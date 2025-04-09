import { supabase } from '../lib/supabase';
import type { Playlist, Song, MoodType } from '../types/database';
import { PostgrestError } from '@supabase/supabase-js';
import { apiService } from './apiService';
import type { PlaylistGenerationOptions } from '@/types/playlist';

export interface GeneratePlaylistOptions {
  prompt: string;
  mood?: MoodType;
  songCount?: number;
  /** @deprecated Use authentication context instead */
  userId?: string;
}

/**
 * Options for controlling artist diversity in playlists
 */
export interface DiversityOptions {
  maxSongsPerArtist?: number;
  minUniqueArtists?: number;
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    spotify_id?: string;
    [key: string]: unknown;
  };
}

interface DatabaseError {
  code: string;
  message?: string;
  details?: string;
}

export class PlaylistGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PlaylistGenerationError';
  }
}

// Define a combined interface for playlist generation request
interface GeneratePlaylistRequest {
  prompt: string;
  mood?: string;
  songCount?: number;
  genres?: string[];
  options?: PlaylistGenerationOptions;
}

export class PlaylistService {
  private static instance: PlaylistService;

  private constructor() {}

  static getInstance(): PlaylistService {
    if (!PlaylistService.instance) {
      PlaylistService.instance = new PlaylistService();
    }
    return PlaylistService.instance;
  }

  private handleSupabaseError(error: PostgrestError, context: string) {
    console.error(`${context}:`, error);
    
    // Handle specific Supabase error codes
    switch (error.code) {
      case '23505': // unique_violation
        throw new Error('A playlist with these details already exists');
      case '23503': // foreign_key_violation
        throw new Error('Invalid reference to another resource');
      case '42703': // undefined_column
        throw new Error('Invalid field in request');
      case 'PGRST116': // not found
        return null;
      default:
        throw new Error(`${context}: ${error.message}`);
    }
  }

  private async waitForAuthReady(maxAttempts = 3): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.access_token) {
        // Set auth header through Supabase client methods
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token!
        });
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Authentication not ready');
  }

  private async ensureUserProfile(authUser: AuthUser) {
    try {
      // Wait for auth to be ready
      await this.waitForAuthReady();

      // Set proper headers through session management
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token!
        });
      }

      // First try to get the user profile with proper error handling
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, created_at')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        // Handle specific error codes
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist, continue to creation
          console.log('User profile not found, creating new profile');
        } else {
          console.error('Error fetching user profile:', fetchError);
          throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
        }
      }

      if (!existingUser) {
        // Prepare the user data with proper timestamps
        const now = new Date().toISOString();
        const userData = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          spotify_id: authUser.user_metadata?.spotify_id || null,
          created_at: now,
          updated_at: now
        };

        // Create user profile with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          const { error: insertError } = await supabase
            .from('users')
            .upsert([userData], {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (!insertError) {
            break;
          }

          if (insertError.code === '23505') { // Unique violation
            console.log('Profile already exists, continuing...');
            break;
          }

          console.warn(`Retry ${retryCount + 1}/${maxRetries} failed:`, insertError);
          retryCount++;
          
          if (retryCount === maxRetries) {
            throw new Error(`Failed to create user profile after ${maxRetries} attempts`);
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }

        // Create preferences with separate error handling
        const preferencesData = {
          user_id: authUser.id,
          preferred_genres: [],
          favorite_artists: [],
          preferred_moods: [],
          public_profile: false,
          show_playlists: true,
          allow_data_collection: true,
          share_listening_history: false,
          created_at: now,
          updated_at: now
        };

        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert([preferencesData], {
            onConflict: 'user_id',
            ignoreDuplicates: true
          });

        if (prefError) {
          console.warn('Failed to create preferences:', prefError);
          // Don't throw, continue with basic profile
        }

        // Verify the profile exists
        const { data: verifyUser, error: verifyError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (verifyError || !verifyUser) {
          throw new Error('Failed to verify user profile creation');
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      if (error && typeof error === 'object' && this.isDatabaseError(error)) {
        throw new Error(`Database error: ${error.message || error.details || 'Unknown error'}`);
      }
      if (error instanceof Error) {
        throw new Error(`Failed to sync user profile: ${error.message}`);
      }
      throw new Error('Failed to sync user profile');
    }
  }

  private isDatabaseError(error: unknown): error is DatabaseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as DatabaseError).code === 'string'
    );
  }

  async createPlaylist(data: Partial<Playlist>) {
    try {
      // Get the current user's ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Ensure user profile exists
      await this.ensureUserProfile(user);

      // Ensure required fields are present
      const playlistData = {
        user_id: user.id,
        name: data.name || 'Untitled Playlist',
        description: data.description || null,
        prompt: data.prompt || null,
        mood: data.mood || null,
        is_public: data.is_public || false,
        cover_url: data.cover_url || null,
        spotify_id: data.spotify_id || null,
        song_count: 0,
        total_duration: 0
      };

      const { data: playlist, error } = await supabase
        .from('playlists')
        .insert([playlistData])
        .select('*')
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Failed to create playlist');
      }

      return playlist;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create playlist');
    }
  }

  async getPlaylist(playlistId: string) {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          songs (*)
        `)
        .eq('id', playlistId)
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Failed to get playlist');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get playlist');
    }
  }

  async getUserPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing preferences

      if (error) {
        this.handleSupabaseError(error, 'Failed to get user preferences');
      }

      return data;
    } catch (error) {
      console.warn('Failed to get user preferences:', error);
      return null; // Return null instead of throwing to handle missing preferences gracefully
    }
  }

  async getUserPlaylists(userId: string) {
    const { data, error } = await supabase
      .from('playlists')
      .select('*, songs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addSongToPlaylist(playlistId: string, song: Partial<Song & { genre?: string }>, bpmRequirement?: { min?: number; max?: number }) {
    try {
      // Validate required fields
      if (!song.title || !song.artist) {
        throw new Error('Song title and artist are required');
      }

      // Estimate duration if not provided (average pop song is ~3:30)
      const estimatedDuration = song.duration || 210; // 3.5 minutes in seconds
      
      // Determine appropriate BPM based on requirements or defaults
      let estimatedBpm = song.bpm || 120;
      
      // Apply BPM requirements if provided
      if (bpmRequirement) {
        if (bpmRequirement.min && (!song.bpm || song.bpm < bpmRequirement.min)) {
          // If song doesn't meet minimum BPM requirement, use the minimum or a reasonable default
          estimatedBpm = bpmRequirement.min;
        }
        
        if (bpmRequirement.max && song.bpm && song.bpm > bpmRequirement.max) {
          // If song exceeds maximum BPM, cap it at the maximum
          estimatedBpm = bpmRequirement.max;
        }
      }

      // Save genre information via console log for now (can be stored elsewhere in future)
      if (song.genre) {
        console.info(`Song ${song.title} by ${song.artist} has genre: ${song.genre}`);
      }

      // Prepare song data with required fields
      const songData = {
        playlist_id: playlistId,
        title: song.title.substring(0, 200),
        artist: song.artist.substring(0, 200),
        album: song.album?.substring(0, 200) || null,
        duration: estimatedDuration,
        year: song.year || null,
        bpm: estimatedBpm,
        key: song.key || null,
        spotify_id: song.spotify_id || null,
        youtube_id: song.youtube_id || null,
        preview_url: song.preview_url || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('songs')
        .insert([songData])
        .select('*')
        .single();

      if (error) {
        console.error('Failed to add song:', error);
        throw error;
      }

      // Update playlist song count and duration
      await this.updatePlaylistMetrics(playlistId);

      return data;
    } catch (error) {
      console.error('Failed to add song to playlist:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to add song to playlist');
    }
  }

  async removeSongFromPlaylist(playlistId: string, songId: string) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId)
      .eq('playlist_id', playlistId);

    if (error) throw error;

    // Update playlist song count and duration
    await this.updatePlaylistMetrics(playlistId);
  }

  private async updatePlaylistMetrics(playlistId: string) {
    try {
      // Get all songs in the playlist
      const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('duration')
        .eq('playlist_id', playlistId);

      if (songsError) {
        console.error('Failed to fetch songs for metrics:', songsError);
        throw songsError;
      }

      // Calculate total duration and count
      const totalDuration = songs?.reduce((sum, song) => sum + (song.duration || 0), 0) || 0;
      const songCount = songs?.length || 0;

      // Update playlist metrics
      const { error: updateError } = await supabase
        .from('playlists')
        .update({
          song_count: songCount,
          total_duration: totalDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId);

      if (updateError) {
        console.error('Failed to update playlist metrics:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('Failed to update playlist metrics:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to update playlist metrics');
    }
  }

  /**
   * Extract BPM range from a prompt with improved pattern matching
   */
  private extractBpmRangeFromPrompt(prompt: string): { min?: number; max?: number } {
    const result = { min: undefined, max: undefined } as { min?: number; max?: number };
    
    if (!prompt) return result;
    
    try {
      // Check for BPM range patterns with various formats
      const rangePatterns = [
        /(\d+)\s*-\s*(\d+)\s*(?:bpm|BPM|Bpm|beats per minute)/i,
        /(?:bpm|BPM|Bpm|beats per minute)\s*(?:of|at|between)?\s*(\d+)\s*-\s*(\d+)/i,
        /(?:between|from)\s*(\d+)\s*(?:and|to)\s*(\d+)\s*(?:bpm|BPM|Bpm|beats per minute)/i
      ];
      
      for (const pattern of rangePatterns) {
        const match = prompt.match(pattern);
        if (match) {
          const min = parseInt(match[1], 10);
          const max = parseInt(match[2], 10);
          
          if (!isNaN(min) && !isNaN(max)) {
            result.min = min;
            result.max = max;
            return result;
          }
        }
      }
      
      // Check for descriptive tempo terms
      if (/\b(?:slow|relaxing|calm|chill)\b/i.test(prompt)) {
        result.max = 100;
        return result;
      }
      
      if (/\b(?:medium|moderate|average)\s*(?:tempo|pace)\b/i.test(prompt)) {
        result.min = 100;
        result.max = 130;
        return result;
      }
      
      if (/\b(?:fast|upbeat|energetic|high energy|workout|running)\b/i.test(prompt)) {
        result.min = 130;
        return result;
      }
      
      // Check for single BPM value with various formats
      const singlePatterns = [
        /(\d+)\s*(?:bpm|BPM|Bpm|beats per minute)/i,
        /(?:bpm|BPM|Bpm|beats per minute)\s*(?:of|at)?\s*(\d+)/i
      ];
      
      for (const pattern of singlePatterns) {
        const match = prompt.match(pattern);
        if (match) {
          const bpm = parseInt(match[1], 10);
          if (!isNaN(bpm)) {
            // Create a small range around the exact value
            result.min = Math.max(bpm - 5, 0);
            result.max = bpm + 5;
            return result;
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing BPM range from prompt:', error);
    }
    
    return result;
  }

  async generatePlaylist(
    promptOrOptions: string | GeneratePlaylistRequest,
    diversityOptions?: DiversityOptions
  ): Promise<string> {
    try {
      let prompt: string;
      let generationOptions: PlaylistGenerationOptions = {};
      let bpmRange: { min?: number; max?: number } = {};
      let mood: string | undefined;
      let songCount: number = 20;
      let genres: string[] = [];
      
      // Parse arguments
      if (typeof promptOrOptions === 'string') {
        prompt = promptOrOptions;
        bpmRange = this.extractBpmRangeFromPrompt(prompt);
      } else {
        prompt = promptOrOptions.prompt;
        mood = promptOrOptions.mood;
        songCount = promptOrOptions.songCount || 20;
        genres = promptOrOptions.genres || [];
        bpmRange = this.extractBpmRangeFromPrompt(prompt);
        
        if (promptOrOptions.options) {
          generationOptions = { ...promptOrOptions.options };
        }
      }

      // Get mood-specific BPM ranges if not explicitly set
      if (!bpmRange.min && !bpmRange.max) {
        bpmRange = this.getMoodBasedBPMRange(mood);
      }

      // Calculate genre weights and distribution
      const genreDistribution = this.calculateGenreDistribution(genres, songCount);
      const genreInstructions = genres.length > 0 
        ? `
Genre Distribution Requirements:
${Object.entries(genreDistribution)
  .map(([genre, count]) => `- ${genre}: approximately ${count} songs`)
  .join('\n')}

Maintain this genre balance while ensuring smooth transitions between genres. When mixing genres, prefer songs that can bridge different styles naturally.`
        : 'Create a well-balanced mix of genres that work well together.';

      generationOptions.systemPrompt = `You are a world-class music curator with deep knowledge of music history, genres, and artist catalogs. Generate an authentic ${mood || 'versatile'} playlist that follows these specific requirements:

MOOD & TEMPO:
${this.getMoodSpecificInstructions(mood)}
- BPM Range: ${bpmRange.min || '70'}-${bpmRange.max || '180'} BPM
${this.getMoodTransitionGuidelines(mood)}

GENRE REQUIREMENTS:
${genreInstructions}

PLAYLIST STRUCTURE:
- Generate exactly ${songCount} songs
- Ensure smooth transitions between songs
- Create a natural energy flow throughout the playlist
${diversityOptions ? this.getDiversityInstructions(diversityOptions) : ''}

Your response must be a valid JSON array of song objects with the following fields:
- "title": The exact song title with correct capitalization
- "artist": The primary artist name with correct capitalization
- "album": The album the song appears on
- "year": The release year (number between 1920-${new Date().getFullYear()})
- "bpm": The beats per minute (MUST follow the specified BPM range with natural variation)
- "duration": Length in seconds (between 180-300 seconds)
- "genre": Primary genre classification (MUST align with the genre distribution requirements)
- "key": Musical key if known (optional)
- "subgenres": Array of relevant subgenres (optional)
- "mood_tags": Array of mood-related descriptors (optional)

CRITICAL REQUIREMENTS:
1. Maintain the specified genre distribution while ensuring playlist cohesion
2. Ensure natural BPM progression within the specified range
3. Select songs that genuinely match the ${mood || 'requested'} mood in terms of:
   - Lyrical themes
   - Instrumental elements
   - Vocal delivery
   - Production style
4. Create smooth transitions between different genres and tempos
5. Include both well-known and lesser-known tracks for variety

Do not return songs with identical BPMs and durations - ensure natural variety in your playlist.`;

      // Validate prompt
      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Invalid prompt: Must be a non-empty string');
      }

      const response = await apiService.generatePlaylist(prompt, generationOptions);
      
      if (response.error) {
        throw new PlaylistGenerationError(
          response.error,
          { prompt, options: generationOptions }
        );
      }

      if (!response.data) {
        throw new Error('No playlist data received');
      }

      // Parse the response and validate/fix BPM values if needed
      try {
        const songs = JSON.parse(response.data);
        if (Array.isArray(songs)) {
          // Use our enhanced BPM correction method for better variety
          const correctedSongs = this.correctPlaylistBPM(songs, bpmRange, diversityOptions);
          return JSON.stringify(correctedSongs);
        }
      } catch (e) {
        // If there's an error parsing, return original response
        console.warn('Error processing songs:', e);
      }

      return response.data;
    } catch (error) {
      console.error('Error generating playlist:', error);
      throw error instanceof PlaylistGenerationError
        ? error
        : new PlaylistGenerationError(
            'Failed to generate playlist',
            error
          );
    }
  }

  /**
   * Enforce artist diversity in the generated playlist
   */
  private enforceArtistDiversity(songs: any[], options?: DiversityOptions): any[] {
    if (!options) return songs;
    
    const artistCounts: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};
    const result: any[] = [];
    
    // First pass: count artists and add songs within limits
    for (const song of songs) {
      const artist = song.artist?.toLowerCase() || 'unknown';
      const genre = song.genre?.toLowerCase() || 'unknown';
      
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      
      if (!options.maxSongsPerArtist || artistCounts[artist] <= options.maxSongsPerArtist) {
        result.push(song);
      }
    }
    
    // Check if we have enough unique artists
    if (options.minUniqueArtists && Object.keys(artistCounts).length < options.minUniqueArtists) {
      console.warn(`Generated playlist has only ${Object.keys(artistCounts).length} unique artists, ` +
                   `which is less than the requested ${options.minUniqueArtists}`);
    }
    
    // Log genre diversity for informational purposes
    console.info(`Genre distribution in playlist: ${Object.keys(genreCounts).length} genres`);
    
    return result;
  }

  private correctPlaylistBPM(songs: Partial<Song>[], bpmRange: { min?: number, max?: number }, diversityOptions?: DiversityOptions): Partial<Song>[] {
    if (!Array.isArray(songs) || songs.length === 0) {
      return songs;
    }

    // Safety floors and ceilings for BPM
    const ABSOLUTE_MIN_BPM = 60;
    const ABSOLUTE_MAX_BPM = 200;
    
    // Track used BPM values to avoid repetition
    const usedBpmValues = new Set<number>();
    
    const correctedSongs = songs.map((song, index) => {
      const correctedSong = { ...song };
      
      // Safety checks for BPM
      if (typeof correctedSong.bpm !== 'number' || isNaN(correctedSong.bpm)) {
        // If BPM is missing or invalid, derive a value based on position in playlist
        // This creates a natural progression throughout the playlist
        if (bpmRange.min && bpmRange.max) {
          // Create a varied BPM across the range using multiple distribution patterns
          const range = bpmRange.max - bpmRange.min;
          
          // Use a combination of patterns to create more natural variance
          // 1. Position-based for gradual changes (40% influence)
          // 2. Sine wave pattern for undulating changes (30% influence)
          // 3. Random component for unpredictability (30% influence)
          
          // Calculate normalized position in the playlist (0-1)
          const normalPosition = songs.length > 1 ? index / (songs.length - 1) : 0.5;
          
          // Sine wave distribution for natural ebbs and flows
          // Period of the sine wave is adjusted to create 2-3 "peaks" in a typical playlist
          const sinePosition = Math.sin(normalPosition * Math.PI * 2.5);
          
          // Random offset to break any obvious patterns
          
          // Combine all factors with appropriate weights
          const positionComponent = normalPosition * 0.4; 
          const sineComponent = (sinePosition + 1) / 2 * 0.3; // Normalize sine to 0-1
          const randomComponent = (Math.random() * 0.3);
          
          // Calculate the fractional position in the BPM range
          const fractionalPosition = positionComponent + sineComponent + randomComponent;
          
          // Calculate BPM with a natural distribution across the range
          let newBpm = Math.round(bpmRange.min + (range * fractionalPosition));
          
          // Add a small random variation to prevent duplicates
          newBpm += Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          
          // Ensure the BPM stays within range
          newBpm = Math.max(bpmRange.min, Math.min(bpmRange.max, newBpm));
          
          // Try to avoid recent BPM values to prevent clusters of similar values
          if (usedBpmValues.has(newBpm)) {
            // Try up to 5 alternatives within ±5 BPM
            let foundAlternative = false;
            for (let i = 1; i <= 5; i++) {
              // Try alternating above/below the target
              const alt1 = newBpm + i;
              const alt2 = newBpm - i;
              
              if (!usedBpmValues.has(alt1) && alt1 <= bpmRange.max) {
                newBpm = alt1;
                foundAlternative = true;
                break;
              }
              if (!usedBpmValues.has(alt2) && alt2 >= bpmRange.min) {
                newBpm = alt2;
                foundAlternative = true;
                break;
              }
            }
            
            // If we couldn't find an alternative, just use the original value
            if (!foundAlternative) {
              // This is fine - in a large playlist, some duplicates are natural
              console.log(`Couldn't avoid duplicate BPM ${newBpm}`);
            }
          }
          
          correctedSong.bpm = newBpm;
        } else {
          // Default to a sensible value with variation if no range specified
          const baseBpm = 120;
          // Use a wider spread when no range is specified
          correctedSong.bpm = baseBpm + Math.floor(Math.random() * 60) - 30; // 90-150 range
        }
      } else if (bpmRange.min !== undefined && correctedSong.bpm < bpmRange.min) {
        // If below minimum, assign a value from the lower portion of the valid range
        // with some variation to prevent all songs from having the exact same BPM
        const lowerVariationRange = Math.min(15, (bpmRange.max || ABSOLUTE_MAX_BPM) - bpmRange.min);
        
        // Use a weighted random distribution that favors values closer to the minimum
        // This creates a more natural transition at the boundary
        const randomWeight = Math.pow(Math.random(), 1.5); // Exponent < 1 shifts distribution toward lower values
        correctedSong.bpm = Math.round(bpmRange.min + (randomWeight * lowerVariationRange));
        
      } else if (bpmRange.max !== undefined && correctedSong.bpm > bpmRange.max) {
        // If above maximum, assign a value from the upper portion of the valid range
        // with some variation to prevent all songs from having the exact same BPM
        const upperVariationRange = Math.min(15, bpmRange.max - (bpmRange.min || ABSOLUTE_MIN_BPM));
        
        // Use a weighted random distribution that favors values closer to the maximum
        // This creates a more natural transition at the boundary
        const randomWeight = Math.pow(Math.random(), 1.5); // Exponent < 1 shifts distribution toward lower values
        correctedSong.bpm = Math.round(bpmRange.max - (randomWeight * upperVariationRange));
      }
      
      // Ensure absolute min/max are respected
      correctedSong.bpm = Math.max(ABSOLUTE_MIN_BPM, Math.min(ABSOLUTE_MAX_BPM, correctedSong.bpm));
      
      // Track the BPM value we've used
      usedBpmValues.add(correctedSong.bpm);
      
      // Ensure duration has variety too
      if (!correctedSong.duration || typeof correctedSong.duration !== 'number' || isNaN(correctedSong.duration)) {
        // Create varied duration between 180-300 seconds with wider distribution
        const baseTime = 180; // 3 minutes minimum
        const variation = 120;  // up to 2 minutes additional
        
        // Use song position and a random factor to vary duration
        const positionFactor = songs.length > 1 ? (index / (songs.length - 1)) : 0.5;
        const randomFactor = Math.random(); // 0-1 random component
        
        // Combine factors for a natural progression with some randomness
        // Square root of the random factor gives more variation in the middle range
        correctedSong.duration = Math.round(baseTime + (variation * (positionFactor * 0.5 + Math.sqrt(randomFactor) * 0.5)));
      }
      
      return correctedSong;
    });
    
    // If diversity options provided, enforce artist diversity
    if (diversityOptions?.maxSongsPerArtist || diversityOptions?.minUniqueArtists) {
      return this.enforceArtistDiversity(correctedSongs, diversityOptions);
    }
    
    return correctedSongs;
  }

  private getMoodBasedBPMRange(mood?: string): { min: number; max: number } {
    const moodBPMRanges: Record<string, { min: number; max: number }> = {
      'energetic': { min: 120, max: 160 },
      'relaxed': { min: 60, max: 90 },
      'focused': { min: 70, max: 110 },
      'party': { min: 115, max: 130 },
      'workout': { min: 125, max: 145 },
      'chill': { min: 65, max: 95 },
      'happy': { min: 95, max: 130 },
      'sad': { min: 60, max: 85 }
    };
    
    return mood ? moodBPMRanges[mood] || { min: 70, max: 180 } : { min: 70, max: 180 };
  }

  private getMoodSpecificInstructions(mood?: string): string {
    const moodInstructions: Record<string, string> = {
      'energetic': 'Focus on high-energy songs with strong rhythms and uplifting elements',
      'relaxed': 'Select songs with gentle rhythms and soothing melodies',
      'focused': 'Choose songs with minimal lyrics and consistent rhythms',
      'party': 'Include danceable tracks with strong beats and memorable hooks',
      'workout': 'Select high-energy songs with strong, motivating rhythms',
      'chill': 'Focus on laid-back tracks with smooth progressions',
      'happy': 'Choose uplifting songs with positive lyrics and bright melodies',
      'sad': 'Select emotionally resonant songs with deeper themes'
    };

    return mood 
      ? `- Mood Focus: ${moodInstructions[mood]}`
      : '- Balance different moods while maintaining playlist coherence';
  }

  private getMoodTransitionGuidelines(mood?: string): string {
    return mood
      ? `- Create smooth energy transitions while maintaining the ${mood} mood throughout`
      : '- Ensure natural energy flow between songs';
  }

  private calculateGenreDistribution(genres: string[], totalSongs: number): Record<string, number> {
    if (!genres.length) return {};

    const distribution: Record<string, number> = {};
    const baseCount = Math.floor(totalSongs / genres.length);
    let remaining = totalSongs;

    // First pass: assign base counts
    genres.forEach(genre => {
      distribution[genre] = baseCount;
      remaining -= baseCount;
    });

    // Second pass: distribute remaining songs
    // Prioritize primary genres (first in the list)
    let index = 0;
    while (remaining > 0) {
      distribution[genres[index % genres.length]]++;
      remaining--;
      index++;
    }

    return distribution;
  }

  private getDiversityInstructions(options: DiversityOptions): string {
    return `
DIVERSITY REQUIREMENTS:
- Maximum ${options.maxSongsPerArtist || 2} songs per artist
- Include at least ${options.minUniqueArtists || 5} different artists
- Vary release years to include both classic and contemporary tracks
- Mix mainstream and underground artists`;
  }

  async deletePlaylist(playlistId: string) {
    try {
      // Get the current user's ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Verify playlist ownership
      const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single();

      if (!playlist) throw new Error('Playlist not found');
      if (playlist.user_id !== user.id) throw new Error('You do not have permission to delete this playlist');

      // Delete all songs in the playlist first
      const { error: songsError } = await supabase
        .from('songs')
        .delete()
        .eq('playlist_id', playlistId);

      if (songsError) throw songsError;

      // Delete the playlist
      const { error: playlistError } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (playlistError) throw playlistError;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to delete playlist');
    }
  }
}

export const playlistService = PlaylistService.getInstance(); 