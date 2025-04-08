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

  private async getAuthHeader(): Promise<Headers> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    
    if (session?.access_token) {
      headers.append('Authorization', `Bearer ${session.access_token}`);
    }
    
    return headers;
  }

  private getApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  async generatePlaylist(prompt: string, options: PlaylistGenerationOptions = {}): Promise<ApiResponse<string>> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(this.getApiUrl('/api/playlist/generate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, options }),
        credentials: 'include'
      });

      if (!response.ok) {
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

      const data = await response.json();

      if (!data.success || !data.data || !Array.isArray(data.data)) {
        console.error('Invalid response format:', data);
        return { error: 'Invalid response format from server' };
      }

      return { data: JSON.stringify(data.data) };
    } catch (error) {
      console.error('Error generating playlist:', error);
      return { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to generate playlist'
      };
    }
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