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
  private readonly supabaseCallbackUrl = 'https://mdpavdpfxubuoxmzhrvw.supabase.co/auth/v1/callback';
  private readonly localCallbackUrl = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/auth/callback` : `${window.location.origin}/auth/callback`;
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

  private getRedirectUri(isSupabaseAuth: boolean = false): string {
    return isSupabaseAuth ? this.supabaseCallbackUrl : this.localCallbackUrl;
  }

  /**
   * Initiates the Spotify OAuth flow
   */
  async authorize(exportDetails?: { playlistId: string; isPublic: boolean; description?: string; state?: string }, isSupabaseAuth: boolean = false): Promise<void> {
    if (!this.clientId) {
      throw new Error('Spotify Client ID is not configured');
    }

    try {
      // Use provided state or generate a new one
      const state = exportDetails?.state || crypto.randomUUID();
      const stateData = {
        state,
        provider: 'spotify',
        timestamp: Date.now(),
        returnTo: window.location.pathname,
        isSupabaseAuth,
        ...(exportDetails && {
          playlistId: exportDetails.playlistId,
          isPublic: exportDetails.isPublic,
          description: exportDetails.description
        })
      };

      // Try sessionStorage first, fallback to localStorage
      try {
        sessionStorage.setItem('spotify_auth_state', JSON.stringify(stateData));
      } catch (e) {
        console.warn('SessionStorage failed, falling back to localStorage:', e);
        try {
          localStorage.setItem('spotify_auth_state', JSON.stringify(stateData));
        } catch (e2) {
          console.error('Both sessionStorage and localStorage failed:', e2);
        }
      }

      const params = new URLSearchParams({
        client_id: this.clientId,
        response_type: 'code',
        redirect_uri: this.getRedirectUri(isSupabaseAuth),
        state,
        scope: this.scopes.join(' '),
        provider: 'spotify'
      });

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
      console.log('Initiating Spotify authorization...', {
        redirectUri: this.getRedirectUri(isSupabaseAuth),
        scopes: this.scopes,
        timestamp: new Date().toISOString(),
        state,
        storedStateData: stateData,
        fullAuthUrl: authUrl,
        origin: window.location.origin,
        currentPath: window.location.pathname
      });

      // Verify sessionStorage is working
      const testKey = 'spotify_storage_test';
      try {
        sessionStorage.setItem(testKey, 'test');
        const testValue = sessionStorage.getItem(testKey);
        sessionStorage.removeItem(testKey);
        console.log('SessionStorage test:', {
          working: testValue === 'test',
          spotify_auth_state: sessionStorage.getItem('spotify_auth_state')
        });
      } catch (e) {
        console.error('SessionStorage test failed:', e);
      }

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
      // For Supabase auth flow, we use a special state
      const isSupabaseAuth = state === 'supabase-auth';
      
      if (!isSupabaseAuth) {
        // Regular Spotify integration flow
        const storedStateData = sessionStorage.getItem('spotify_auth_state') || localStorage.getItem('spotify_auth_state');
        if (!storedStateData) {
          console.error('No authentication state found', {
            sessionState: sessionStorage.getItem('spotify_auth_state'),
            localState: localStorage.getItem('spotify_auth_state'),
            currentUrl: window.location.href
          });
          throw new Error('No authentication state found');
        }

        const stateData = JSON.parse(storedStateData);
        if (state !== stateData.state) {
          console.error('State mismatch', {
            expectedState: stateData.state,
            receivedState: state,
            stateData
          });
          throw new Error('State mismatch in OAuth callback');
        }
      }

      console.log('Processing Spotify callback...', {
        timestamp: new Date().toISOString(),
        isSupabaseAuth,
        hasCode: !!code,
        redirectUri: this.getRedirectUri(isSupabaseAuth)
      });

      // Verify we have the required credentials
      if (!this.clientId || !this.clientSecret) {
        console.error('Missing Spotify credentials', {
          hasClientId: !!this.clientId,
          hasClientSecret: !!this.clientSecret
        });
        throw new Error('Spotify credentials are not configured');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.getRedirectUri(isSupabaseAuth),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Spotify token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          redirectUri: this.getRedirectUri(isSupabaseAuth),
          hasCode: !!code,
          hasClientId: !!this.clientId,
          hasClientSecret: !!this.clientSecret
        });
        throw new Error(
          `Token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      
      // Validate the token response
      if (!data.access_token || !data.refresh_token) {
        console.error('Invalid token response', {
          hasAccessToken: !!data.access_token,
          hasRefreshToken: !!data.refresh_token,
          responseData: data
        });
        throw new Error('Invalid token response from Spotify');
      }

      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      // Get current user info to verify tokens work
      try {
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${this.tokens.access_token}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to verify Spotify tokens');
        }
        
        const userData = await userResponse.json();
        console.log('Spotify user verification successful:', {
          id: userData.id,
          email: userData.email,
          timestamp: new Date().toISOString()
        });
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        throw new Error('Failed to verify Spotify access');
      }

      // Store tokens in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          spotify_tokens: this.tokens,
          spotify_connected: true,
          spotify_connected_at: new Date().toISOString()
        },
      });

      if (updateError) {
        console.error('Failed to update Spotify tokens in Supabase:', updateError);
        throw updateError;
      }

      // Clear auth state if not Supabase auth
      if (!isSupabaseAuth) {
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');
      }

      console.log('Spotify integration completed successfully');
      return true;
    } catch (error) {
      console.error('Error handling Spotify callback:', error);
      // Clear tokens on error
      this.tokens = null;
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

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(
          `Token refresh failed: ${errorData.error_description || errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      
      // Note: Spotify may not always return a new refresh token
      this.tokens = {
        ...this.tokens,
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.tokens.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      // Update tokens in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          spotify_tokens: this.tokens,
        },
      });

      if (updateError) {
        console.error('Failed to update tokens in Supabase:', updateError);
        throw new Error('Failed to update tokens in user profile');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens to force re-authentication
      this.tokens = null;
      throw new Error(
        error instanceof Error 
          ? `Failed to refresh token: ${error.message}`
          : 'Failed to refresh token'
      );
    }
  }
} 