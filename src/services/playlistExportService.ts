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
  styleContext?: StyleContext;
  moodContext?: MoodContext;
  minPopularity?: number;
  maxPopularity?: number;
  minSimilarity?: number;
  requireExactMatch?: boolean;
  debugLog?: boolean;
  duration?: number;
  album?: string;
}

interface SpotifyTrack {
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album?: { name: string };
  duration_ms?: number;
  popularity?: number;
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
      artist: song.artist,
      album: song.album,
      duration: song.duration
    });

    const styleContext = this.extractStyleContext(song.title);
    const moodContext = this.extractMoodContext(song.title);
    
    const cleanTitle = this.cleanupTitle(song.title, styleContext);
    const cleanArtist = this.cleanupArtist(song.artist);
    const isRemix = this.isRemixVersion(song.title);

    // Convert null to undefined for album
    const albumForMatch = song.album === null ? undefined : song.album;

    console.log('Cleaned track info:', {
      cleanTitle,
      cleanArtist,
      album: albumForMatch,
      duration: song.duration,
      styleContext,
      moodContext,
      isRemix
    });

    const attempts = [
      // Attempt 1: Exact artist + title + album match
      async () => {
        const query = albumForMatch ? 
          `artist:"${cleanArtist}" track:"${cleanTitle}" album:"${albumForMatch}"` :
          `artist:"${cleanArtist}" track:"${cleanTitle}"`;
        console.log('Attempt 1 - Exact search:', { query });
        const results = await this.spotifyService.searchTracks(query, 20);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          requireExactMatch: true,
          debugLog: true,
          duration: song.duration,
          album: albumForMatch
        });
      },
      // Attempt 2: Artist + title with album consideration
      async () => {
        const query = `${cleanArtist} ${cleanTitle}`;
        console.log('Attempt 2 - Artist + Title search:', { query });
        const results = await this.spotifyService.searchTracks(query, 20);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          debugLog: true,
          duration: song.duration,
          album: albumForMatch
        });
      },
      // Attempt 3: Title + album search
      async () => {
        const query = albumForMatch ? 
          `${cleanTitle} album:"${albumForMatch}"` :
          cleanTitle;
        console.log('Attempt 3 - Title + Album search:', { query });
        const results = await this.spotifyService.searchTracks(query, 20);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          debugLog: true,
          duration: song.duration,
          album: albumForMatch
        });
      },
      // Attempt 4: Context-based search with relaxed matching
      async () => {
        const contextualTerms = [...styleContext.terms, ...moodContext.terms].slice(0, 2);
        const query = `${cleanTitle} ${contextualTerms.join(' ')}`;
        console.log('Attempt 4 - Context search:', { query });
        const results = await this.spotifyService.searchTracks(query, 15);
        return this.findBestMatch(results, {
          targetTitle: cleanTitle,
          targetArtist: cleanArtist,
          styleContext,
          moodContext,
          debugLog: true,
          duration: song.duration,
          album: albumForMatch,
          minSimilarity: 0.5 // More lenient similarity threshold for context search
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

  private findBestMatch(
    results: SpotifyTrack[],
    options: MatchOptions
  ): string | null {
    const {
      targetTitle,
      targetArtist,
      minSimilarity = 0.5,
      requireExactMatch = false,
      debugLog = false,
      duration,
      album
    } = options;

    let bestMatch: { 
      uri: string; 
      score: number; 
      confidence: number;
      details?: any 
    } | null = null;

    // Extract version and features information from target
    const targetVersionInfo = this.extractVersionInfo(targetTitle);
    const targetFeatures = this.extractFeatures(targetTitle, targetArtist);
    const cleanTargetTitle = this.normalizeTitle(targetVersionInfo.baseTitle);
    const cleanTargetArtist = this.normalizeArtist(targetArtist);

    if (debugLog) {
      console.log('Matching details:', {
        cleanTargetTitle,
        cleanTargetArtist,
        targetVersion: targetVersionInfo.version,
        targetFeatures,
        requireExactMatch
      });
    }

    for (const track of results) {
      try {
        const trackVersionInfo = this.extractVersionInfo(track.name);
        const trackFeatures = this.extractFeatures(track.name, track.artists.map(a => a.name).join(', '));
        const cleanTrackTitle = this.normalizeTitle(trackVersionInfo.baseTitle);
        const cleanTrackArtists = track.artists.map(a => this.normalizeArtist(a.name));

        // Skip if title length difference is too large
        if (Math.abs(cleanTrackTitle.length - cleanTargetTitle.length) > 15) {
          continue;
        }

        // Calculate various similarity scores
        const titleSimilarity = this.calculateSimilarity(cleanTargetTitle, cleanTrackTitle);
        const artistSimilarity = Math.max(
          ...cleanTrackArtists.map(artist => this.calculateSimilarity(cleanTargetArtist, artist))
        );
        const versionSimilarity = this.calculateVersionSimilarity(
          targetVersionInfo.version,
          trackVersionInfo.version
        );
        const featureSimilarity = this.calculateFeatureSimilarity(targetFeatures, trackFeatures);
        const albumSimilarity = this.calculateAlbumSimilarity(
          album,
          track.album?.name
        );
        const durationSimilarity = duration && track.duration_ms ? 
          this.calculateDurationSimilarity(duration, track.duration_ms / 1000) : 0.5;

        // Perfect match conditions (relaxed thresholds)
        if (cleanTargetTitle === cleanTrackTitle && 
            artistSimilarity > 0.8 &&
            versionSimilarity > 0.8) {
          return track.uri;
        }

        // Calculate weighted score with adjusted weights
        const score = (
          (titleSimilarity * 0.40) +
          (artistSimilarity * 0.35) +
          (versionSimilarity * 0.05) +
          (featureSimilarity * 0.05) +
          (albumSimilarity * 0.10) +
          (durationSimilarity * 0.05)
        );

        // Calculate confidence level with relaxed thresholds
        const confidence = (
          (titleSimilarity > 0.8 ? 1 : titleSimilarity > 0.6 ? 0.5 : 0) +
          (artistSimilarity > 0.8 ? 1 : artistSimilarity > 0.6 ? 0.5 : 0) +
          (versionSimilarity > 0.7 ? 1 : versionSimilarity > 0.5 ? 0.5 : 0) +
          (albumSimilarity > 0.7 ? 1 : albumSimilarity > 0.5 ? 0.5 : 0) +
          (durationSimilarity > 0.8 ? 1 : durationSimilarity > 0.6 ? 0.5 : 0)
        ) / 5;

        if (debugLog) {
          console.log('Track match details:', {
            track: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            titleSimilarity,
            artistSimilarity,
            versionSimilarity,
            featureSimilarity,
            albumSimilarity,
            durationSimilarity,
            finalScore: score,
            confidence,
            popularity: track.popularity
          });
        }

        // Skip if exact match is required but similarity is too low
        if (requireExactMatch && (titleSimilarity < 0.8 || artistSimilarity < 0.8)) {
          continue;
        }

        // Update best match if this is better
        if (score > minSimilarity && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { 
            uri: track.uri, 
            score,
            confidence,
            details: debugLog ? {
              track: track.name,
              artist: track.artists.map(a => a.name).join(', '),
              titleSimilarity,
              artistSimilarity,
              versionSimilarity,
              featureSimilarity,
              albumSimilarity,
              durationSimilarity,
              score,
              confidence
            } : undefined
          };
        }
      } catch (error) {
        console.warn('Error processing track match:', error);
        continue;
      }
    }

    if (debugLog && bestMatch) {
      console.log('Best match found:', bestMatch.details);
    }

    // Return match with relaxed confidence threshold
    return (bestMatch && bestMatch.confidence >= 0.5) ? bestMatch.uri : null;
  }

  private calculateFeatureSimilarity(features1: string[], features2: string[]): number {
    if (!features1.length && !features2.length) return 1;
    if (!features1.length || !features2.length) return 0.5;

    const matches = features1.filter(f1 => 
      features2.some(f2 => this.calculateSimilarity(f1, f2) > 0.8)
    );

    return matches.length / Math.max(features1.length, features2.length);
  }

  private normalizeTitle(title: string): string {
    // Preserve important version information in parentheses
    const versionInfo = title.match(/\((.*?(?:remix|mix|edit|version|remaster|live).*?)\)/i);
    const cleanTitle = title.toLowerCase()
      .replace(/\(feat\.?.*?\)/gi, '') // Remove feature credits
      .replace(/\[.*?\]/g, '')         // Remove bracketed content
      .replace(/ft\.?|feat\.?/gi, '')  // Remove feature indicators
      .replace(/[^\w\s\-']/g, ' ')     // Keep apostrophes and hyphens
      .replace(/\s+/g, ' ')            // Normalize spaces
      .trim();

    return versionInfo ? `${cleanTitle} ${versionInfo[1].toLowerCase()}` : cleanTitle;
  }

  private normalizeArtist(artist: string): string {
    return artist.toLowerCase()
      .replace(/\s*&\s*/g, ' and ')    // Normalize & to 'and'
      .replace(/\(.*?\)/g, '')         // Remove parenthetical content
      .replace(/,\s*/g, ' ')           // Convert commas to spaces
      .replace(/[^\w\s\-']/g, ' ')     // Keep apostrophes and hyphens
      .replace(/\s+/g, ' ')            // Normalize spaces
      .trim();
  }

  private extractFeatures(title: string, artist: string): string[] {
    const features: string[] = [];
    
    // Extract features from title
    const titleFeatures = title.match(/(?:feat\.?|ft\.?)\s*(.*?)(?:\)|\]|$)/i);
    if (titleFeatures) {
      features.push(...titleFeatures[1].split(/,|&/).map(f => f.trim()));
    }
    
    // Extract features from artist string
    const artistFeatures = artist.split(/,|&/).slice(1);
    features.push(...artistFeatures.map(f => f.trim()));
    
    return [...new Set(features)].filter(Boolean);
  }

  private calculateDurationSimilarity(duration1: number, duration2: number): number {
    const maxDiff = 30; // Maximum acceptable difference in seconds
    const diff = Math.abs(duration1 - duration2);
    return Math.max(0, 1 - (diff / maxDiff));
  }

  private calculateVersionSimilarity(version1: string, version2: string): number {
    if (!version1 || !version2) return 1;
    
    const v1 = version1.toLowerCase();
    const v2 = version2.toLowerCase();
    
    // Exact match
    if (v1 === v2) return 1;
    
    // Check for common version types
    const versionTypes = ['remix', 'edit', 'version', 'mix', 'remaster', 'live'];
    const type1 = versionTypes.find(t => v1.includes(t));
    const type2 = versionTypes.find(t => v2.includes(t));
    
    // If both have version types but different ones
    if (type1 && type2 && type1 !== type2) return 0.3;
    
    // If only one has a version type
    if ((type1 && !type2) || (!type1 && type2)) return 0.5;
    
    return this.calculateSimilarity(v1, v2);
  }

  private extractVersionInfo(title: string): { baseTitle: string; version: string } {
    const versionMatch = title.match(/\((.*?(?:remix|mix|edit|version|remaster|live).*?)\)/i);
    if (!versionMatch) {
      return { baseTitle: title, version: '' };
    }
    
    return {
      baseTitle: title.replace(versionMatch[0], '').trim(),
      version: versionMatch[1]
    };
  }

  private calculateAlbumSimilarity(album1?: string, album2?: string): number {
    if (!album1 || !album2) return 0.5; // Neutral score if either album is missing
    
    const norm1 = this.normalizeTitle(album1);
    const norm2 = this.normalizeTitle(album2);
    
    // Exact match
    if (norm1 === norm2) return 1;
    
    // Check if one album name contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    return this.calculateSimilarity(norm1, norm2);
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