import { supabase } from '../lib/supabase';
import { AudioFeatures } from '../types/audio';
import type { PlaylistGenerationOptions } from '../types/playlist';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private static instance: ApiService;
  private readonly baseUrl: string;
  private readonly TIMEOUT_MS = 30000; // 30 second timeout
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly SESSION_RETRY_ATTEMPTS = 3;

  private constructor() {
    if (!import.meta.env.VITE_API_URL) {
      console.warn('VITE_API_URL is not set. API calls may fail in production.');
    }
    this.baseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')).replace(/\/$/, '');
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async ensureValidSession(): Promise<string> {
    for (let attempt = 0; attempt < this.SESSION_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}/${this.SESSION_RETRY_ATTEMPTS} to get valid session`);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', {
            error,
            attempt: attempt + 1,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        
        if (!session) {
          console.error('No active session found:', {
            attempt: attempt + 1,
            timestamp: new Date().toISOString()
          });
          throw new Error('No active session');
        }

        // Check if token is expired or about to expire (within 5 minutes)
        const tokenExpiryTime = session.expires_at ? session.expires_at * 1000 : 0;
        const isExpiringSoon = tokenExpiryTime - Date.now() < 5 * 60 * 1000;

        if (isExpiringSoon || !tokenExpiryTime) {
          if (!session.refresh_token) {
            console.error('No refresh token available:', {
              attempt: attempt + 1,
              timestamp: new Date().toISOString()
            });
            throw new Error('No refresh token available');
          }

          console.log('Token expiring soon or no expiry time, attempting refresh:', {
            expiryTime: tokenExpiryTime ? new Date(tokenExpiryTime).toISOString() : 'unknown',
            timeUntilExpiry: tokenExpiryTime ? tokenExpiryTime - Date.now() : 'unknown',
            attempt: attempt + 1
          });
          
          try {
            const { data: { session: newSession }, error: refreshError } = 
              await supabase.auth.refreshSession({
                refresh_token: session.refresh_token
              });

            if (refreshError) {
              console.error('Token refresh failed:', {
                error: refreshError,
                attempt: attempt + 1,
                timestamp: new Date().toISOString()
              });
              
              // If refresh fails with an invalid token error, try to get a new session
              if (refreshError.message?.includes('invalid token')) {
                await supabase.auth.signOut();
                throw new Error('Invalid refresh token, please log in again');
              }
              
              throw refreshError;
            }
            
            if (!newSession) {
              console.error('No new session after refresh:', {
                attempt: attempt + 1,
                timestamp: new Date().toISOString()
              });
              throw new Error('Failed to refresh session');
            }

            // Verify the new session is valid
            if (!newSession.access_token || !newSession.refresh_token) {
              console.error('Invalid refreshed session:', {
                hasAccessToken: !!newSession.access_token,
                hasRefreshToken: !!newSession.refresh_token,
                attempt: attempt + 1,
                timestamp: new Date().toISOString()
              });
              throw new Error('Invalid refreshed session');
            }

            console.log('Successfully refreshed token:', {
              newExpiryTime: new Date(newSession.expires_at! * 1000).toISOString(),
              attempt: attempt + 1
            });
            return newSession.access_token;
          } catch (refreshError) {
            if (attempt === this.SESSION_RETRY_ATTEMPTS - 1) {
              throw refreshError;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * Math.pow(2, attempt)));
            continue;
          }
        }

        console.log('Using existing valid token:', {
          expiryTime: new Date(tokenExpiryTime).toISOString(),
          attempt: attempt + 1
        });
        return session.access_token;
      } catch (error) {
        if (attempt === this.SESSION_RETRY_ATTEMPTS - 1) {
          console.error('All session attempts failed:', {
            error,
            attempts: this.SESSION_RETRY_ATTEMPTS,
            timestamp: new Date().toISOString()
          });
          throw new Error('Failed to get valid session after multiple attempts');
        }
        console.warn('Session attempt failed, retrying:', {
          error,
          attempt: attempt + 1,
          nextAttemptIn: `${this.RETRY_DELAY_MS * Math.pow(2, attempt)}ms`
        });
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
    throw new Error('Failed to get valid session');
  }

  private async getAuthHeader(): Promise<Headers> {
    try {
      const accessToken = await this.ensureValidSession();
      
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
      
      if (accessToken) {
        headers.append('Authorization', `Bearer ${accessToken}`);
        // Add the token as a cookie as well for redundancy
        document.cookie = `sb-access-token=${accessToken}; path=/; secure; SameSite=Strict`;
      } else {
        console.error('No access token available after session validation');
        throw new Error('No authorization token available');
      }
      
      return headers;
    } catch (error) {
      console.error('Error getting auth headers:', error);
      // Try force refresh if normal refresh failed
      try {
        const newToken = await this.forceRefreshSession();
        const headers = new Headers({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${newToken}`
        });
        return headers;
      } catch (refreshError) {
        throw new Error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private getApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async retryRequest(fn: () => Promise<Response>): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * Math.pow(2, attempt)));
          continue;
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  private async forceRefreshSession(): Promise<string> {
    await supabase.auth.signOut();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('Failed to refresh session: ' + (error?.message || 'No session'));
    }
    
    return session.access_token;
  }

  async generatePlaylist(prompt: string, options: PlaylistGenerationOptions = {}): Promise<ApiResponse<string>> {
    try {
      // Get current session and ensure it's valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('Failed to get valid session: ' + (refreshError?.message || 'No session'));
        }
      }

      if (!session && !sessionError) {
        throw new Error('No active session found');
      }

      const currentSession = session || (await supabase.auth.getSession()).data.session;
      if (!currentSession) {
        throw new Error('No valid session available');
      }

      const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      });

      // Add debug logging
      console.debug('Request details:', {
        headers: Object.fromEntries(headers.entries()),
        url: this.getApiUrl('/api/playlist/generate'),
        sessionExpiry: currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'unknown'
      });
      
      const response = await this.retryRequest(async () => {
        return await this.fetchWithTimeout(this.getApiUrl('/api/playlist/generate'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            prompt, 
            options: {
              ...options,
              maxTokens: options.maxTokens || 2000,
              temperature: options.temperature || 0.7
            }
          }),
          credentials: 'include'
        });
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed:', {
            status: response.status,
            statusText: response.statusText,
            responseHeaders: Object.fromEntries(response.headers.entries())
          });
          
          try {
            const errorBody = await response.clone().json();
            console.error('Authentication error details:', errorBody);

            // If token expired, try to refresh and retry
            if (errorBody.error === 'Token expired' || errorBody.error === 'Invalid token') {
              const { data: { session: newSession }, error: refreshError } = 
                await supabase.auth.refreshSession();

              if (refreshError || !newSession) {
                console.error('Session refresh failed:', refreshError);
                throw new Error('Failed to refresh session');
              }

              console.debug('Retrying with new token:', {
                sessionExpiry: newSession.expires_at ? new Date(newSession.expires_at * 1000).toISOString() : 'unknown'
              });

              const retryResponse = await this.fetchWithTimeout(this.getApiUrl('/api/playlist/generate'), {
                method: 'POST',
                headers: new Headers({
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${newSession.access_token}`
                }),
                body: JSON.stringify({ 
                  prompt, 
                  options: {
                    ...options,
                    maxTokens: options.maxTokens || 2000,
                    temperature: options.temperature || 0.7
                  }
                }),
                credentials: 'include'
              });
              
              if (!retryResponse.ok) {
                const retryErrorBody = await retryResponse.clone().json().catch(() => ({}));
                console.error('Retry failed:', {
                  status: retryResponse.status,
                  body: retryErrorBody
                });
                throw new Error(`Retry failed: ${retryResponse.status}`);
              }
              
              return await this.handlePlaylistResponse(retryResponse);
            }
          } catch (e) {
            console.error('Error handling authentication failure:', e);
            throw new Error('Authentication failed after retry');
          }
        }
        
        console.error('Playlist generation failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          environment: import.meta.env.MODE
        });

        const data = await response.json().catch(() => ({}));
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        return { error: errorMessage };
      }

      return await this.handlePlaylistResponse(response);
    } catch (error) {
      console.error('Error generating playlist:', error);
      return { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to generate playlist'
      };
    }
  }

  private async handlePlaylistResponse(response: Response): Promise<ApiResponse<string>> {
    const data = await response.json();

    if (!data.success || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid response format:', data);
      return { error: 'Invalid response format from server' };
    }

    return { data: JSON.stringify(data.data) };
  }

  async analyzeAudio(audioUrl: string): Promise<ApiResponse<AudioFeatures>> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(this.getApiUrl('/api/audio/analyze'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ audioUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      return { error: error instanceof Error ? error.message : 'Failed to analyze audio' };
    }
  }
}

export const apiService = ApiService.getInstance(); 