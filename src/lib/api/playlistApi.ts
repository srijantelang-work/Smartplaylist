import type { PlaylistGenerationOptions } from '../../types/playlist';
import { playlistService } from '../../services/playlistService';
import { supabase } from '../supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const isDevelopment = import.meta.env.DEV;

/**
 * Generate playlist suggestions using the backend service.
 * In development, uses the playlistService directly.
 * In production, calls the backend API endpoint.
 */
export async function generatePlaylistSuggestionsApi(
  prompt: string,
  options: PlaylistGenerationOptions = {}
): Promise<string> {
  try {
    if (isDevelopment) {
      return await playlistService.generatePlaylist(prompt);
    }

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    // In production, use API endpoint with auth headers
    const response = await fetch(`${API_BASE_URL}/api/playlist/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt, options }),
      credentials: 'include', // Include cookies if needed
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh the session
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !newSession) {
          throw new Error('Authentication failed: Please sign in again');
        }
        
        // Retry with new token
        const retryResponse = await fetch(`${API_BASE_URL}/api/playlist/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newSession.access_token}`,
          },
          body: JSON.stringify({ prompt, options }),
          credentials: 'include',
        });
        
        if (!retryResponse.ok) {
          throw new Error(`API request failed: ${retryResponse.statusText}`);
        }
        
        const { content } = await retryResponse.json();
        if (!content) {
          throw new Error('No content received from API');
        }
        
        return content;
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const { content } = await response.json();
    if (!content) {
      throw new Error('No content received from API');
    }

    return content;
  } catch (error) {
    console.error('Error generating playlist suggestions:', error);
    throw error instanceof Error ? error : new Error('Failed to generate playlist suggestions');
  }
} 