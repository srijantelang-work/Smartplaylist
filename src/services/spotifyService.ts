import { supabase } from '../lib/supabase';

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface SpotifyUser {
  id: string;
  display_name: string | null;
  email: string | null;
  uri: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: Array<{
    name: string;
    id: string;
    uri: string;
  }>;
  album: {
    name: string;
    id: string;
    uri: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  public: boolean;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
}

interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

export class SpotifyService {
  private static instance: SpotifyService;
  private tokens: SpotifyTokens | null = null;
  private readonly clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private readonly clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  private readonly redirectUri = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/auth/callback` : `${window.location.origin}/auth/callback`;
  private readonly scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
    'user-read-email'
  ];

  private constructor() {
    // Validate configuration
    if (!import.meta.env.VITE_APP_URL) {
      console.warn('VITE_APP_URL is not set, falling back to window.location.origin');
    }
    if (!this.clientId) {
      console.error('VITE_SPOTIFY_CLIENT_ID is not configured');
    }
  }

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  /**
   * Initiates the Spotify OAuth flow
   */
  async authorize(): Promise<void> {
    if (!this.clientId) {
      throw new Error('Spotify Client ID is not configured');
    }

    try {
      // Generate and store state with additional metadata
      const state = crypto.randomUUID();
      const stateData = {
        state,
        provider: 'spotify',
        timestamp: Date.now(),
        returnTo: window.location.pathname // Store current path
      };
      sessionStorage.setItem('spotify_auth_state', JSON.stringify(stateData));

      const params = new URLSearchParams({
        client_id: this.clientId,
        response_type: 'code',
        redirect_uri: this.redirectUri,
        state,
        scope: this.scopes.join(' '),
        provider: 'spotify' // Add provider parameter
      });

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
      console.log('Initiating Spotify authorization...', {
        redirectUri: this.redirectUri,
        scopes: this.scopes,
        timestamp: new Date().toISOString()
      });

      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Spotify authorization:', error);
      throw new Error(
        error instanceof Error 
          ? `Spotify authorization failed: ${error.message}`
          : 'Failed to initiate Spotify authorization. Please try again.'
      );
    }
  }

  /**
   * Handles the OAuth callback and exchanges the code for tokens
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      // Retrieve and validate stored state
      const storedStateData = sessionStorage.getItem('spotify_auth_state');
      if (!storedStateData) {
        throw new Error('No authentication state found');
      }

      const stateData = JSON.parse(storedStateData);
      if (state !== stateData.state) {
        throw new Error('State mismatch in OAuth callback');
      }

      // Check for state expiration (30 minutes)
      const stateAge = Date.now() - stateData.timestamp;
      if (stateAge > 30 * 60 * 1000) {
        throw new Error('Authentication state has expired');
      }

      console.log('Processing Spotify callback...', {
        timestamp: new Date().toISOString(),
        stateAge: Math.round(stateAge / 1000) + 's'
      });

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Spotify token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(
          `Token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      // Store tokens in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          spotify_tokens: this.tokens,
          spotify_connected: true,
          spotify_connected_at: new Date().toISOString()
        },
      });

      if (updateError) throw updateError;

      // Clear auth state
      sessionStorage.removeItem('spotify_auth_state');

      console.log('Spotify integration completed successfully');
      return true;
    } catch (error) {
      console.error('Error handling Spotify callback:', error);
      // Clear auth state on error
      sessionStorage.removeItem('spotify_auth_state');
      return false;
    }
  }

  /**
   * Helper method for making authenticated requests to Spotify API
   * @template T The expected response type
   * @param url The Spotify API endpoint URL
   * @param options Optional fetch options
   * @returns Promise resolving to the typed response
   * @throws {Error} If the API request fails
   */
  private async spotifyFetch<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureValidToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as SpotifyError;
      throw new Error(`Spotify API error: ${error.error.message}`);
    }

    return data as T;
  }

  /**
   * Searches for tracks on Spotify
   */
  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    await this.ensureValidToken();
    
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
    });

    const response = await this.spotifyFetch<SpotifySearchResponse>(
      `https://api.spotify.com/v1/search?${params.toString()}`
    );

    return response.tracks.items;
  }

  /**
   * Creates a new playlist on Spotify
   */
  async createPlaylist(
    userId: string,
    name: string,
    description: string,
    isPublic = true
  ): Promise<SpotifyPlaylist> {
    await this.ensureValidToken();

    return await this.spotifyFetch<SpotifyPlaylist>(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          public: isPublic,
        }),
      }
    );
  }

  /**
   * Adds tracks to a Spotify playlist
   */
  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    await this.ensureValidToken();

    await this.spotifyFetch<{ snapshot_id: string }>(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        body: JSON.stringify({
          uris: trackUris,
        }),
      }
    );
  }

  /**
   * Gets detailed track information
   */
  async getTrackDetails(trackId: string): Promise<SpotifyTrack> {
    await this.ensureValidToken();
    
    return await this.spotifyFetch<SpotifyTrack>(
      `https://api.spotify.com/v1/tracks/${trackId}`
    );
  }

  /**
   * Gets the current user's Spotify profile
   */
  async getCurrentUser(): Promise<SpotifyUser> {
    await this.ensureValidToken();
    
    return await this.spotifyFetch<SpotifyUser>(
      'https://api.spotify.com/v1/me'
    );
  }

  /**
   * Ensures we have a valid token, refreshing if necessary
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.tokens) {
      const { data: { user } } = await supabase.auth.getUser();
      this.tokens = user?.user_metadata.spotify_tokens;
      if (!this.tokens) {
        throw new Error('No Spotify tokens found');
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

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refresh_token,
        client_id: this.clientId,
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
        spotify_tokens: this.tokens,
      },
    });
  }
} 