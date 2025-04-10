import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpotifyService } from '../../services/spotifyService';
import { PlaylistExportService } from '../../services/playlistExportService';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const spotifyService = SpotifyService.getInstance();
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for tokens
        await spotifyService.handleCallback(code, state || '');
        if (auth.refreshUser) {
          await auth.refreshUser();
        }

        // Check for stored export state
        const storedState = sessionStorage.getItem('playlist_export_state');
        if (storedState) {
          try {
            const exportState = JSON.parse(storedState);
            if (exportState.playlistId) {
              // Attempt to export the playlist
              const exportService = PlaylistExportService.getInstance();
              const result = await exportService.exportPlaylist(
                exportState.playlistId,
                'spotify',
                {
                  isPublic: exportState.isPublic,
                  includeDescription: true
                }
              );

              // Redirect with export status
              const redirectPath = `/playlist/${exportState.playlistId}`;
              if (result.success) {
                navigate(`${redirectPath}?export=success&url=${encodeURIComponent(result.url)}`);
              } else {
                navigate(`${redirectPath}?export=error&message=${encodeURIComponent(result.error || 'Export failed')}`);
              }
              return;
            }
          } catch (e) {
            console.error('Failed to process stored export state:', e);
          }
        }

        // If no export state or export failed, redirect to stored return path or home
        const returnPath = localStorage.getItem('spotify_auth_return_path');
        navigate(returnPath || '/');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        // Clean up stored data
        sessionStorage.removeItem('playlist_export_state');
        localStorage.removeItem('spotify_auth_return_path');
      }
    };

    handleCallback();
  }, [navigate, auth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Connecting to Spotify...</p>
      </div>
    </div>
  );
} 
