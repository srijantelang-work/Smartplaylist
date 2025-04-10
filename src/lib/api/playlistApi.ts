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

    console.log('Making playlist generation request:', {
      API_BASE_URL,
      prompt,
      options
    });

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session found');
    }

    console.log('Session found, making API request');

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

    console.log('API response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Attempting to refresh session due to 401');
        // Try to refresh the session
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !newSession) {
          console.error('Session refresh failed:', refreshError);
          throw new Error('Authentication failed: Please sign in again');
        }
        
        console.log('Session refreshed, retrying request');
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
        
        console.log('Retry response status:', retryResponse.status);
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          console.error('Retry request failed:', {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            errorText
          });
          throw new Error(`API request failed: ${retryResponse.statusText}. Details: ${errorText}`);
        }
        
        const { content } = await retryResponse.json();
        if (!content) {
          throw new Error('No content received from API');
        }
        
        return content;
      }

      // For non-401 errors, try to get more error details
      const errorText = await response.text();
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`API request failed: ${response.statusText}. Details: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('API response data:', responseData);

    if (!responseData.content) {
      console.error('No content in response:', responseData);
      throw new Error('No content received from API');
    }

    return responseData.content;
  } catch (error) {
    console.error('Error generating playlist suggestions:', error);
    throw error instanceof Error ? error : new Error('Failed to generate playlist suggestions');
  }
} 