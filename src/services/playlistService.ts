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

  async addSongToPlaylist(playlistId: string, song: Partial<Song>) {
    try {
      // Validate required fields
      if (!song.title || !song.artist) {
        throw new Error('Song title and artist are required');
      }

      // Prepare song data with required fields
      const songData = {
        playlist_id: playlistId,
        title: song.title.substring(0, 200),
        artist: song.artist.substring(0, 200),
        album: song.album?.substring(0, 200) || null,
        duration: song.duration || 0,
        year: song.year || null,
        bpm: song.bpm || null,
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

  async generatePlaylist(
    promptOrOptions: string | GeneratePlaylistOptions,
    options: PlaylistGenerationOptions = {}
  ): Promise<string> {
    try {
      // Handle both string and object inputs for backward compatibility
      let prompt: string;
      const generationOptions: PlaylistGenerationOptions = { ...options };

      if (typeof promptOrOptions === 'string') {
        prompt = promptOrOptions;
      } else {
        prompt = promptOrOptions.prompt;
        // Convert legacy options to new format
        if (promptOrOptions.mood || promptOrOptions.songCount) {
          generationOptions.systemPrompt = `You are a music expert AI. Generate a ${
            promptOrOptions.mood || 'versatile'
          } playlist with ${
            promptOrOptions.songCount || 20
          } songs. Return the response as a JSON array of songs with title, artist, and album properties.`;
        }
      }

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
}

export const playlistService = PlaylistService.getInstance(); 