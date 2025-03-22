import type { PlaylistGenerationOptions } from '../../types/playlist';
import { playlistService } from '../../services/playlistService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
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
      return await playlistService.generatePlaylist(prompt, options);
    }

    // In production, use API endpoint
    const response = await fetch(`${API_BASE_URL}/api/playlist/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, options }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const { content } = await response.json();
    if (!content) {
      throw new Error('No content received from API');
    }

    return content;
  } catch (error) {
    console.error('Error generating playlist suggestions:', error);
    throw new Error('Failed to generate playlist suggestions');
  }
} 