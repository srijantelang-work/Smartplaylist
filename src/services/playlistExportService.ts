import { supabase } from '../lib/supabase';
import type { Song, Playlist } from '../types/database';
import { SpotifyService } from './spotifyService';
import { YouTubeService } from './youtubeService';

export type ExportPlatform = 'spotify' | 'youtube';

interface ExportResult {
  platformId: string;
  url: string;
  success: boolean;
  error?: string;
  stats?: {
    totalSongs: number;
    matchedSongs: number;
    matchRate: number;
  };
}

interface ExportOptions {
  isPublic?: boolean;
  includeDescription?: boolean;
  retryCount?: number;
  description?: string;
}

interface StyleContext {
  primaryGenre: string;
  subGenres: string[];
  terms: string[];
  intensity: number;
}

interface MoodContext {
  primary: string;
  terms: string[];
  energy: number;
  valence: number;
}

interface MatchOptions {
  targetTitle: string;
  targetArtist: string;
  styleContext: StyleContext;
  moodContext: MoodContext;
  minPopularity?: number;
  maxPopularity?: number;
  minSimilarity?: number;
  requireExactMatch?: boolean;
}

export class PlaylistExportService {
  private static instance: PlaylistExportService;
  private spotifyService: SpotifyService;
  private youtubeService: YouTubeService;

  private constructor() {
    this.spotifyService = SpotifyService.getInstance();
    this.youtubeService = YouTubeService.getInstance();
  }

  public static getInstance(): PlaylistExportService {
    if (!PlaylistExportService.instance) {
      PlaylistExportService.instance = new PlaylistExportService();
    }
    return PlaylistExportService.instance;
  }

  /**
   * Sanitizes a playlist description for Spotify
   * Spotify has a max length of 300 characters and doesn't accept certain characters
   */
  private sanitizeSpotifyDescription(description: string): string {
    if (!description) return '';
    
    // Remove any problematic characters (emojis, special characters)
    const sanitized = description
      .replace(/[^\x20-\x7E\s]/g, '') // Keep only printable ASCII characters and spaces
      .trim();
    
    // Truncate to Spotify's limit (300 characters)
    return sanitized.length > 300 ? sanitized.substring(0, 297) + '...' : sanitized;
  }

  async exportPlaylist(
    playlistId: string,
    platform: ExportPlatform,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const {
      isPublic = false,
      includeDescription = true,
      retryCount = 3
    } = options;

    try {
      // Fetch playlist with songs
      const { data: playlist, error } = await supabase
        .from('playlists')
        .select('*, songs(*)')
        .eq('id', playlistId)
        .single();

      if (error) throw new Error(`Failed to fetch playlist: ${error.message}`);
      if (!playlist) throw new Error('Playlist not found');

      switch (platform) {
        case 'spotify':
          return await this.exportToSpotify(playlist, { isPublic, includeDescription, retryCount });
        case 'youtube':
          return await this.exportToYouTube(playlist, { isPublic, includeDescription, retryCount });
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error exporting playlist to ${platform}:`, error);
      return {
        platformId: '',
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async findSpotifyTrack(song: Song): Promise<string | null> {
    console.log('Finding Spotify track for:', {
      title: song.title,
      artist: song.artist
    });

    const styleContext = this.extractStyleContext(song.title);
    const moodContext = this.extractMoodContext(song.title);
    
    const cleanTitle = this.cleanupTitle(song.title, styleContext);
    const cleanArtist = this.cleanupArtist(song.artist);
    const isRemix = this.isRemixVersion(song.title);

    console.log('Cleaned track info:', {
      cleanTitle,
      cleanArtist,
      styleContext,
      moodContext,
      isRemix
    });

    const attempts = [
      // Attempt 1: Exact artist + title match
      async () => {
        const query = `artist:"${cleanArtist}" track:"${cleanTitle}"`;
        console.log('Attempt 1 - Exact search:', { query });
        const results = await this.spotifyService.searchTracks(query, 20);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          minPopularity: 0,
          maxPopularity: 100,
          requireExactMatch: true,
          debugLog: true
        });
      },
      // Attempt 2: Artist + title with remix consideration
      async () => {
        const query = `${cleanArtist} ${cleanTitle}`;
        console.log('Attempt 2 - Artist + Title search:', { query });
        const results = await this.spotifyService.searchTracks(query, 20);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          minPopularity: 0,
          maxPopularity: 100,
          debugLog: true
        });
      },
      // Attempt 3: Context-based search
      async () => {
        const contextualTerms = [...styleContext.terms, ...moodContext.terms].slice(0, 2);
        const query = `${cleanTitle} ${contextualTerms.join(' ')}`;
        console.log('Attempt 3 - Context search:', { query });
        const results = await this.spotifyService.searchTracks(query, 15);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          minPopularity: 20,
          maxPopularity: 90,
          debugLog: true
        });
      }
    ];

    for (const [index, attempt] of attempts.entries()) {
      try {
        const uri = await attempt();
        if (uri && this.isValidSpotifyUri(uri)) {
          console.log(`Found match on attempt ${index + 1}:`, { uri });
          return uri;
        }
      } catch (error) {
        console.warn(`Search attempt ${index + 1} failed:`, error);
        continue;
      }
    }

    console.warn(`Could not find suitable track: ${song.title} by ${song.artist}`);
    return null;
  }

  private cleanupTitle(title: string, context: StyleContext): string {
    const preserveTerms = [...context.terms, 'mix', 'version', 'edit'];
    return title.toLowerCase()
      .split(/\s+/)
      .filter(term => preserveTerms.includes(term) || !this.isStopword(term))
      .join(' ')
      .trim();
  }

  private cleanupArtist(artist: string): string {
    return artist.toLowerCase()
      .replace(/\b(music|band|orchestra|ensemble|trio|quartet|quintet)\b/gi, '')
      .replace(/[^\w\s-]/g, '')
      .trim();
  }

  private isStopword(term: string): boolean {
    const stopwords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'
    ]);
    return stopwords.has(term) || term.length < 3;
  }

  private isRemixVersion(title: string): boolean {
    const remixIndicators = [
      'remix', 'mix', 'edit', 'version', 'dub',
      'extended', 'radio edit', 'club mix', 'instrumental',
      'remaster', 'live', 'acoustic'
    ];
    return remixIndicators.some(indicator => 
      title.toLowerCase().includes(indicator)
    );
  }

  private extractRemixer(title: string): string | null {
    const remixPatterns = [
      /\(([^)]+(?:remix|mix|edit|version|dub))\)/i,
      /\[([^\]]+(?:remix|mix|edit|version|dub))\]/i,
      /(.+?)(?:remix|mix|edit|version|dub)/i
    ];

    for (const pattern of remixPatterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  private calculateRemixScore(sourceTitle: string, targetTitle: string): number {
    const sourceIsRemix = this.isRemixVersion(sourceTitle);
    const targetIsRemix = this.isRemixVersion(targetTitle);
    
    if (!sourceIsRemix && !targetIsRemix) return 1; // Both are original versions
    if (sourceIsRemix !== targetIsRemix) return 0.3; // One is remix, other isn't
    
    // Both are remixes
    const sourceRemixer = this.extractRemixer(sourceTitle);
    const targetRemixer = this.extractRemixer(targetTitle);
    
    if (sourceRemixer && targetRemixer) {
      const remixerSimilarity = this.calculateSimilarity(sourceRemixer, targetRemixer);
      return remixerSimilarity > 0.8 ? 1 : remixerSimilarity * 0.8;
    }
    
    return 0.5; // Both are remixes but couldn't extract remixer info
  }

  private findBestMatch(
    results: Array<{ 
      uri: string; 
      name: string; 
      artists: Array<{ name: string }>;
      popularity?: number;
    }>,
    options: MatchOptions & { debugLog?: boolean }
  ): string | null {
    const {
      targetTitle,
      targetArtist,
      styleContext,
      moodContext,
      minPopularity = 0,
      maxPopularity = 100,
      minSimilarity = 0.4,
      requireExactMatch = false,
      debugLog = false
    } = options;

    let bestMatch: { uri: string; score: number; details?: any } | null = null;

    if (debugLog) {
      console.log('Matching against results:', {
        resultCount: results.length,
        targetTitle,
        targetArtist,
        requireExactMatch
      });
    }

    for (const track of results) {
      if (track.popularity !== undefined && 
          (track.popularity < minPopularity || track.popularity > maxPopularity)) {
        if (debugLog) {
          console.log('Skipping track due to popularity:', {
            track: track.name,
            popularity: track.popularity,
            range: `${minPopularity}-${maxPopularity}`
          });
        }
        continue;
      }

      const titleSimilarity = this.calculateSimilarity(targetTitle, track.name.toLowerCase());
      const artistSimilarity = Math.max(
        ...track.artists.map(artist => 
          this.calculateSimilarity(targetArtist, artist.name.toLowerCase())
        )
      );
      const remixScore = this.calculateRemixScore(targetTitle, track.name);
      const contextScore = this.calculateContextScore(
        track.name.toLowerCase(),
        styleContext,
        moodContext
      );

      // Adjusted scoring weights
      const score = (
        (titleSimilarity * 0.35) +
        (artistSimilarity * 0.35) +
        (remixScore * 0.2) +
        (contextScore * 0.1)
      );

      if (debugLog) {
        console.log('Track match details:', {
          track: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          titleSimilarity,
          artistSimilarity,
          remixScore,
          contextScore,
          finalScore: score,
          popularity: track.popularity
        });
      }

      // For exact matches, require very high similarity
      if (requireExactMatch && (titleSimilarity < 0.9 || artistSimilarity < 0.9)) {
        continue;
      }

      if (score > minSimilarity && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { 
          uri: track.uri, 
          score,
          details: debugLog ? {
            track: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            titleSimilarity,
            artistSimilarity,
            remixScore,
            contextScore,
            score
          } : undefined
        };
      }
    }

    if (debugLog && bestMatch) {
      console.log('Best match found:', bestMatch.details);
    }

    return bestMatch?.uri || null;
  }

  private calculateContextScore(
    trackName: string,
    styleContext: StyleContext,
    moodContext: MoodContext
  ): number {
    let score = 0;
    const trackLower = trackName.toLowerCase();

    if (styleContext.terms.some(term => trackLower.includes(term))) {
      score += 0.5;
    }
    if (styleContext.subGenres.some(genre => trackLower.includes(genre))) {
      score += 0.3;
    }
    if (moodContext.terms.some(term => trackLower.includes(term))) {
      score += 0.4;
    }

    return Math.min(1, score);
  }

  private extractStyleContext(title: string): StyleContext {
    const titleLower = title.toLowerCase();
    
    const jazzStyles = {
      smooth: ['smooth', 'easy', 'mellow', 'soft'],
      bebop: ['bebop', 'bop', 'fast', 'uptempo'],
      fusion: ['fusion', 'electric', 'modern'],
      swing: ['swing', 'big band', 'traditional'],
      latin: ['latin', 'bossa', 'samba', 'brazilian'],
      contemporary: ['contemporary', 'modern', 'neo'],
      experimental: ['experimental', 'avant', 'free']
    };

    const subGenres: string[] = [];
    const terms: string[] = [];
    let intensity = 0.5;

    Object.entries(jazzStyles).forEach(([style, keywords]) => {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        subGenres.push(style);
        terms.push(...keywords.filter(k => titleLower.includes(k)));
        
        if (['bebop', 'fusion', 'experimental'].includes(style)) {
          intensity += 0.2;
        } else if (['smooth', 'easy', 'mellow'].includes(style)) {
          intensity -= 0.2;
        }
      }
    });

    return {
      primaryGenre: 'jazz',
      subGenres,
      terms: [...new Set(terms)],
      intensity: Math.max(0, Math.min(1, intensity))
    };
  }

  private extractMoodContext(title: string): MoodContext {
    const titleLower = title.toLowerCase();
    
    const moodMap = {
      relaxing: {
        terms: ['relaxing', 'peaceful', 'calm', 'gentle', 'soothing'],
        energy: 0.3,
        valence: 0.6
      },
      upbeat: {
        terms: ['upbeat', 'happy', 'joyful', 'energetic', 'lively'],
        energy: 0.8,
        valence: 0.8
      },
      melancholic: {
        terms: ['melancholic', 'sad', 'blue', 'moody', 'emotional'],
        energy: 0.4,
        valence: 0.3
      },
      romantic: {
        terms: ['romantic', 'love', 'sensual', 'intimate', 'dreamy'],
        energy: 0.5,
        valence: 0.7
      },
      focused: {
        terms: ['focused', 'study', 'concentration', 'work', 'deep'],
        energy: 0.4,
        valence: 0.5
      }
    };

    let primary = 'neutral';
    const matchedTerms: string[] = [];
    let energy = 0.5;
    let valence = 0.5;

    Object.entries(moodMap).forEach(([mood, data]) => {
      if (data.terms.some(term => titleLower.includes(term))) {
        primary = mood;
        matchedTerms.push(...data.terms.filter(t => titleLower.includes(t)));
        energy = data.energy;
        valence = data.valence;
      }
    });

    return {
      primary,
      terms: [...new Set(matchedTerms)],
      energy,
      valence
    };
  }

  private calculateSimilarity(a: string, b: string): number {
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const strA = normalize(a);
    const strB = normalize(b);

    if (strA === strB) return 1;
    if (strA.includes(strB) || strB.includes(strA)) return 0.9;

    const distance = this.levenshteinDistance(strA, strB);
    const maxLength = Math.max(strA.length, strB.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => 
      Array(a.length + 1).fill(null)
    );

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private async exportToSpotify(
    playlist: Playlist & { songs: Song[] },
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get current user's Spotify ID
      const spotifyUser = await this.spotifyService.getCurrentUser();
      
      // Prepare playlist description
      const description = options.includeDescription 
        ? this.sanitizeSpotifyDescription(playlist.description || '')
        : '';

      // Create playlist on Spotify
      const spotifyPlaylist = await this.spotifyService.createPlaylist(
        spotifyUser.id,
        playlist.name,
        description,
        options.isPublic
      );

      // Track success rate
      let successfulMatches = 0;
      const totalSongs = playlist.songs.length;

      // Search and add songs in batches
      const batchSize = 50; // Spotify's limit for adding tracks
      const songBatches = this.chunkArray(playlist.songs, batchSize);

      for (const batch of songBatches) {
        const spotifyTrackUris = await Promise.all(
          batch.map(async (song) => {
            try {
              const trackUri = await this.findSpotifyTrack(song);
              if (trackUri) successfulMatches++;
              return trackUri;
            } catch (error) {
              console.warn(`Failed to find song on Spotify: ${song.title}`, error);
              return null;
            }
          })
        );

        // Filter out null results and add tracks to playlist
        const validUris = spotifyTrackUris.filter((uri): uri is string => 
          uri !== null && this.isValidSpotifyUri(uri)
        );

        if (validUris.length > 0) {
          try {
            await this.spotifyService.addTracksToPlaylist(spotifyPlaylist.id, validUris);
          } catch (error) {
            console.error('Failed to add tracks to playlist:', error);
            throw error;
          }
        }
      }

      // Update the original playlist with the Spotify ID
      await supabase
        .from('playlists')
        .update({ spotify_id: spotifyPlaylist.id })
        .eq('id', playlist.id);

      const matchRate = (successfulMatches / totalSongs) * 100;
      console.log(`Export success rate: ${matchRate.toFixed(1)}% (${successfulMatches}/${totalSongs} songs)`);

      if (matchRate < 50) {
        throw new Error(`Low match rate: Only ${matchRate.toFixed(1)}% of songs were found on Spotify`);
      }

      return {
        platformId: spotifyPlaylist.id,
        url: spotifyPlaylist.external_urls.spotify,
        success: true,
        stats: {
          totalSongs,
          matchedSongs: successfulMatches,
          matchRate: matchRate
        }
      };
    } catch (error) {
      console.error('Spotify export error details:', error);
      throw new Error(`Failed to export to Spotify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates a Spotify URI format
   * Valid format: spotify:track:1234567890abcdef1234567890abcdef
   */
  private isValidSpotifyUri(uri: string): boolean {
    return /^spotify:track:[a-zA-Z0-9]{22}$/.test(uri);
  }

  private async exportToYouTube(
    playlist: Playlist & { songs: Song[] },
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Create playlist on YouTube
      const youtubePlaylist = await this.youtubeService.createPlaylist(
        playlist.name,
        options.includeDescription ? (playlist.description || '') : '',
        options.isPublic ? 'public' : 'private'
      );

      // Search and add videos
      for (const song of playlist.songs) {
        try {
          // Search for the song on YouTube
          const searchQuery = `${song.title} ${song.artist} official music video`;
          const searchResults = await this.youtubeService.searchVideos(searchQuery, 1);
          
          if (searchResults[0]) {
            await this.youtubeService.addVideoToPlaylist(
              youtubePlaylist.id,
              searchResults[0].id.videoId
            );
          }
        } catch (error) {
          console.warn(`Failed to add song to YouTube playlist: ${song.title}`, error);
          continue;
        }
      }

      // Update the original playlist with the YouTube ID
      await supabase
        .from('playlists')
        .update({ youtube_id: youtubePlaylist.id })
        .eq('id', playlist.id);

      return {
        platformId: youtubePlaylist.id,
        url: `https://www.youtube.com/playlist?list=${youtubePlaylist.id}`,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to export to YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
} 