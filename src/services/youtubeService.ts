import { supabase } from '../lib/supabase';

interface YouTubeTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface YouTubeVideo {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
  };
}

interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
  status: {
    privacyStatus: 'private' | 'unlisted' | 'public';
  };
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideo[];
}

interface YouTubeError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

interface YouTubeUser {
  kind: string;
  etag: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
}

export class YouTubeService {
  private static instance: YouTubeService;
  private tokens: YouTubeTokens | null = null;
  private readonly clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private readonly apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  private readonly redirectUri = `${window.location.origin}/auth/callback`;
  
  // TODO: YouTube integration will be implemented in a future update
  // For now, we're only using Google OAuth for authentication
  private readonly scopes: string[] = [];
  // private readonly scopes = [
  //   'https://www.googleapis.com/auth/youtube',
  //   'https://www.googleapis.com/auth/youtube.force-ssl'
  // ];

  private constructor() {}

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  /**
   * Initiates the YouTube OAuth flow
   */
  async authorize(): Promise<void> {
    const state = crypto.randomUUID();
    sessionStorage.setItem('youtube_auth_state', state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handles the OAuth callback and exchanges the code for tokens
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    const storedState = sessionStorage.getItem('youtube_auth_state');
    if (state !== storedState) {
      throw new Error('State mismatch in OAuth callback');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      // Store tokens in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          youtube_tokens: this.tokens,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error handling YouTube callback:', error);
      return false;
    }
  }

  /**
   * Helper method for making authenticated requests to YouTube API
   */
  private async youtubeFetch<T>(
    url: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    let requestUrl = url;
    const requestOptions = { ...options };
    requestOptions.headers = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // For endpoints requiring authentication, use OAuth token
    if (requiresAuth) {
      await this.ensureValidToken();
      requestOptions.headers['Authorization'] = `Bearer ${this.tokens!.access_token}`;
    } else {
      // For public endpoints, use API key
      const separator = requestUrl.includes('?') ? '&' : '?';
      requestUrl = `${requestUrl}${separator}key=${this.apiKey}`;
    }

    const response = await fetch(requestUrl, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      const error = data as YouTubeError;
      throw new Error(`YouTube API error: ${error.error.message}`);
    }

    return data as T;
  }

  /**
   * Searches for videos on YouTube
   */
  async searchVideos(query: string, maxResults = 20): Promise<YouTubeVideo[]> {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      maxResults: maxResults.toString(),
      q: query,
      type: 'video',
      videoCategoryId: '10', // Music category
    });

    const response = await this.youtubeFetch<YouTubeSearchResponse>(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      {},
      false // Use API key instead of OAuth token
    );

    return response.items;
  }

  /**
   * Creates a new playlist on YouTube
   */
  async createPlaylist(
    title: string,
    description: string,
    privacyStatus: 'private' | 'unlisted' | 'public' = 'private'
  ): Promise<YouTubePlaylist> {
    await this.ensureValidToken();

    return await this.youtubeFetch<YouTubePlaylist>(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        body: JSON.stringify({
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus,
          },
        }),
      }
    );
  }

  /**
   * Adds a video to a playlist
   */
  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
    await this.ensureValidToken();

    await this.youtubeFetch<{ id: string }>(
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      {
        method: 'POST',
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        }),
      }
    );
  }

  /**
   * Gets video details
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideo> {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: videoId,
    });

    const response = await this.youtubeFetch<{ items: YouTubeVideo[] }>(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      {},
      false // Use API key instead of OAuth token
    );

    if (!response.items?.[0]) {
      throw new Error('Video not found');
    }

    return response.items[0];
  }

  /**
   * Ensures we have a valid token, refreshing if necessary
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.tokens) {
      const { data: { user } } = await supabase.auth.getUser();
      this.tokens = user?.user_metadata.youtube_tokens;
      if (!this.tokens) {
        throw new Error('No YouTube tokens found');
      }
    }

    if (Date.now() >= this.tokens.expires_at) {
      await this.refreshToken();
    }
  }

  /**
   * Refreshes the access token
   */
  private async refreshToken(): Promise<void> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        refresh_token: this.tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.tokens = {
      ...this.tokens,
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    // Update tokens in Supabase
    await supabase.auth.updateUser({
      data: {
        youtube_tokens: this.tokens,
      },
    });
  }

  /**
   * Formats an ISO 8601 duration to minutes and seconds
   */
  static formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] ?? '0') || 0;
    const minutes = parseInt(match[2] ?? '0') || 0;
    const seconds = parseInt(match[3] ?? '0') || 0;

    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Gets the current user's YouTube channel information
   */
  async getCurrentUser(): Promise<YouTubeUser> {
    await this.ensureValidToken();
    
    return await this.youtubeFetch<YouTubeUser>(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true'
    );
  }
} 