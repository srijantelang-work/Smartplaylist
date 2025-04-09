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

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

interface SpotifyAuthDetails {
  playlistId: string;
  isPublic: boolean;
  description?: string;
  state?: string;
  returnPath?: string;
}

export class SpotifyService {
  private static instance: SpotifyService;
  private tokens: SpotifyTokens | null = null;
  private readonly clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private readonly clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  private readonly supabaseCallbackUrl = 'https://mdpavdpfxubuoxmzhrvw.supabase.co/auth/v1/callback';
  private readonly localCallbackUrl = import.meta.env.PROD 
    ? 'https://smartplaylist.vercel.app/auth/callback'
    : 'http://localhost:5173/auth/callback';
  private readonly scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
    'user-read-email'
  ];

  // Rate limiting and token refresh configuration
  private readonly rateLimitConfig: RateLimitConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000 // 10 seconds
  };
  private readonly tokenRefreshBuffer = 300000; // 5 minutes in milliseconds
  private tokenRefreshPromise: Promise<void> | null = null;

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
  async authorize(exportDetails?: SpotifyAuthDetails, isSupabaseAuth: boolean = false): Promise<void> {
    if (!this.clientId) {
      throw new Error('Spotify Client ID is not configured');
    }

    try {
      // Use provided state or generate a new one
      const state = exportDetails?.state || crypto.randomUUID();
      const redirectUri = this.getRedirectUri(isSupabaseAuth);
      
      // Log authorization initiation
      console.log('Initiating Spotify authorization:', {
        timestamp: new Date().toISOString(),
        redirectUri,
        scopes: this.scopes,
        hasExportDetails: !!exportDetails,
        environment: import.meta.env.MODE,
        origin: window.location.origin
      });

      const stateData = {
        state,
        provider: 'spotify',
        timestamp: Date.now(),
        returnTo: exportDetails?.returnPath || exportDetails?.playlistId ? `/playlist/${exportDetails.playlistId}` : window.location.pathname,
        isSupabaseAuth,
        redirectUri, // Store the redirect URI used
        ...(exportDetails && {
          playlistId: exportDetails.playlistId,
          isPublic: exportDetails.isPublic,
          description: exportDetails.description,
          returnPath: exportDetails.returnPath || `/playlist/${exportDetails.playlistId}`
        })
      };

      // Store state data with additional validation
      try {
        const stateString = JSON.stringify(stateData);
        sessionStorage.setItem('spotify_auth_state', stateString);
        sessionStorage.setItem('spotify_return_path', JSON.stringify({
          path: stateData.returnTo,
          playlistId: exportDetails?.playlistId
        }));

        // Verify storage was successful
        const storedState = sessionStorage.getItem('spotify_auth_state');
        if (!storedState || storedState !== stateString) {
          throw new Error('State storage verification failed');
        }
      } catch (e) {
        console.warn('SessionStorage failed, falling back to localStorage:', e);
        try {
          const stateString = JSON.stringify(stateData);
          localStorage.setItem('spotify_auth_state', stateString);
          localStorage.setItem('spotify_return_path', JSON.stringify({
            path: stateData.returnTo,
            playlistId: exportDetails?.playlistId
          }));

          // Verify storage was successful
          const storedState = localStorage.getItem('spotify_auth_state');
          if (!storedState || storedState !== stateString) {
            throw new Error('State storage verification failed');
          }
        } catch (e2) {
          console.error('Both sessionStorage and localStorage failed:', e2);
          throw new Error('Failed to store authorization state');
        }
      }

      const params = new URLSearchParams({
        client_id: this.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        state,
        scope: this.scopes.join(' ')
      });

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

      // Final validation before redirect
      console.log('Authorization URL generated:', {
        timestamp: new Date().toISOString(),
        authUrl,
        params: Object.fromEntries(params.entries()),
        storedState: stateData
      });

      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Spotify authorization:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
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

      // Exchange the code for tokens
      const tokens = await this.exchangeCodeForTokens(code, isSupabaseAuth);
      
      // Verify the tokens work by getting user info
      await this.verifyTokens(tokens);
      
      // Only set instance tokens after verification
      this.tokens = tokens;
      
      // Store tokens in Supabase
      await this.updateTokensInSupabase(tokens);

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

  private async exchangeCodeForTokens(code: string, isSupabaseAuth: boolean): Promise<SpotifyTokens> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials are not configured');
    }

    const redirectUri = this.getRedirectUri(isSupabaseAuth);
    
    // Log the token exchange attempt
    console.log('Attempting Spotify token exchange:', {
      timestamp: new Date().toISOString(),
      isSupabaseAuth,
      redirectUri,
      codeLength: code?.length,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      environment: import.meta.env.MODE
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Enhanced error logging
        console.error('Spotify token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
          redirectUri,
          hasCode: !!code,
          hasClientId: !!this.clientId,
          hasClientSecret: !!this.clientSecret,
          requestUrl: 'https://accounts.spotify.com/api/token',
          timestamp: new Date().toISOString(),
          headers: {
            'content-type': response.headers.get('content-type'),
            'www-authenticate': response.headers.get('www-authenticate')
          }
        });

        throw new Error(
          `Token exchange failed: ${responseData.error_description || responseData.error || response.statusText}`
        );
      }

      // Validate the token response structure
      if (!responseData.access_token || !responseData.refresh_token) {
        console.error('Invalid token response structure:', {
          hasAccessToken: !!responseData.access_token,
          hasRefreshToken: !!responseData.refresh_token,
          responseKeys: Object.keys(responseData),
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid token response from Spotify');
      }

      // Log successful token exchange
      console.log('Spotify token exchange successful:', {
        timestamp: new Date().toISOString(),
        expiresIn: responseData.expires_in,
        tokenType: responseData.token_type,
        scope: responseData.scope
      });

      return {
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token,
        expires_at: Date.now() + responseData.expires_in * 1000,
      };
    } catch (error) {
      // Log any unexpected errors
      console.error('Unexpected error during token exchange:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private async verifyTokens(tokens: SpotifyTokens): Promise<void> {
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
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
  }

  /**
   * Helper method for making authenticated requests to Spotify API with retry logic
   */
  private async spotifyFetch<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    await this.ensureValidToken();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.tokens!.access_token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        if (retryCount < this.rateLimitConfig.maxRetries) {
          const delay = Math.min(
            this.rateLimitConfig.initialDelay * Math.pow(2, retryCount),
            this.rateLimitConfig.maxDelay
          );
          console.warn('Rate limited by Spotify API, retrying after delay:', {
            attempt: retryCount + 1,
            maxRetries: this.rateLimitConfig.maxRetries,
            retryAfter,
            calculatedDelay: delay,
            endpoint: url
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.spotifyFetch<T>(url, options, retryCount + 1);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const error = data as SpotifyError;
        
        // Handle token expiration
        if (response.status === 401 && retryCount === 0) {
          console.warn('Token expired during request, refreshing and retrying...');
          await this.refreshToken();
          return this.spotifyFetch<T>(url, options, retryCount + 1);
        }

        console.error('Spotify API error:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
          endpoint: url,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        });
        throw new Error(`Spotify API error: ${error.error?.message || 'Unknown error'}`);
      }

      return data as T;
    } catch (error) {
      // Retry on network errors
      if (error instanceof TypeError && retryCount < this.rateLimitConfig.maxRetries) {
        const delay = Math.min(
          this.rateLimitConfig.initialDelay * Math.pow(2, retryCount),
          this.rateLimitConfig.maxDelay
        );
        console.warn('Network error, retrying...', {
          attempt: retryCount + 1,
          maxRetries: this.rateLimitConfig.maxRetries,
          delay,
          error,
          endpoint: url
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.spotifyFetch<T>(url, options, retryCount + 1);
      }

      console.error('Spotify API request failed:', {
        error,
        endpoint: url,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
      throw error;
    }
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
    try {
      if (!this.tokens) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw new Error('Failed to get user data: ' + userError.message);
        }
        
        this.tokens = user?.user_metadata?.spotify_tokens;
        if (!this.tokens) {
          throw new Error('No Spotify tokens found');
        }
      }

      // Check if token will expire soon (within buffer time)
      if (Date.now() + this.tokenRefreshBuffer >= this.tokens.expires_at) {
        // Use a promise to prevent multiple simultaneous refresh attempts
        if (!this.tokenRefreshPromise) {
          this.tokenRefreshPromise = this.refreshToken().finally(() => {
            this.tokenRefreshPromise = null;
          });
        }
        await this.tokenRefreshPromise;
      }
    } catch (error) {
      // Clear tokens if they're invalid
      this.tokens = null;
      throw error;
    }
  }

  private async updateTokensInSupabase(tokens: SpotifyTokens): Promise<void> {
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        spotify_tokens: tokens,
        spotify_connected: true,
        spotify_connected_at: new Date().toISOString()
      },
    });

    if (updateError) {
      throw new Error('Failed to update tokens in Supabase: ' + updateError.message);
    }
  }

  /**
   * Refreshes the access token with improved error handling
   */
  private async refreshToken(): Promise<void> {
    if (!this.tokens?.refresh_token) {
      console.error('No refresh token available:', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasTokens: !!this.tokens
      });
      throw new Error('No refresh token available');
    }

    let retryCount = 0;
    const maxRetries = this.rateLimitConfig.maxRetries;

    while (retryCount <= maxRetries) {
      try {
        const response: Response = await fetch('https://accounts.spotify.com/api/token', {
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
          
          // If we get a 400 or 401, the refresh token might be invalid
          if (response.status === 400 || response.status === 401) {
            console.error('Invalid refresh token:', {
              status: response.status,
              error: errorData,
              timestamp: new Date().toISOString()
            });
            throw new Error('Invalid refresh token');
          }

          // For other errors, we might want to retry
          if (retryCount < maxRetries) {
            const delay = Math.min(
              this.rateLimitConfig.initialDelay * Math.pow(2, retryCount),
              this.rateLimitConfig.maxDelay
            );
            console.warn('Token refresh failed, retrying...', {
              attempt: retryCount + 1,
              maxRetries,
              delay,
              status: response.status,
              error: errorData
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }

          throw new Error(
            `Token refresh failed: ${errorData.error_description || errorData.error || response.statusText}`
          );
        }

        const data: SpotifyTokenResponse = await response.json();
        
        this.tokens = {
          ...this.tokens,
          access_token: data.access_token,
          refresh_token: data.refresh_token || this.tokens.refresh_token,
          expires_at: Date.now() + data.expires_in * 1000,
        };

        // Update tokens in Supabase
        await this.updateTokensInSupabase(this.tokens);

        return;
      } catch (error) {
        if (retryCount === maxRetries) {
          console.error('Token refresh failed after all retries:', {
            error,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          });
          throw error;
        }
        retryCount++;
      }
    }
  }
} 