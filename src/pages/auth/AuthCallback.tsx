import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpotifyService } from '../../services/spotifyService';
import { PlaylistExportService } from '../../services/playlistExportService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AuthCallbackState {
  status: 'processing' | 'success' | 'error';
  message: string | null;
  redirectPath: string | null;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [state, setState] = useState<AuthCallbackState>({
    status: 'processing',
    message: null,
    redirectPath: null
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Handle session error first
        if (sessionError) {
          console.error('Session error:', {
            error: sessionError,
            message: sessionError.message,
            timestamp: new Date().toISOString()
          });
          throw new Error('Failed to verify authentication status. Please try again.');
        }
        
        if (session) {
          console.log('Active session found:', {
            user: session.user.id,
            timestamp: new Date().toISOString()
          });
          
          // We have a valid session, refresh user data
          if (auth.refreshUser) {
            await auth.refreshUser();
          }

          // Get stored return path or default to home
          const storedReturnPath = localStorage.getItem('auth_redirect') || '/';
          
          // Check if this was a Spotify connection attempt
          const storedState = sessionStorage.getItem('playlist_export_state');
          if (storedState) {
            try {
              const exportState = JSON.parse(storedState);
              if (exportState.playlistId) {
                setState({
                  status: 'processing',
                  message: 'Connecting to Spotify...',
                  redirectPath: `/playlist/${exportState.playlistId}`
                });

                const spotifyService = SpotifyService.getInstance();
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const state = params.get('state');

                if (code) {
                  await spotifyService.handleCallback(code, state || '');
                }

                const exportService = PlaylistExportService.getInstance();
                const result = await exportService.exportPlaylist(
                  exportState.playlistId,
                  'spotify',
                  {
                    isPublic: exportState.isPublic,
                    includeDescription: true
                  }
                );

                navigate(`/playlist/${exportState.playlistId}${
                  result.success 
                    ? `?export=success&url=${encodeURIComponent(result.url)}` 
                    : `?export=error&message=${encodeURIComponent(result.error || 'Export failed')}`
                }`);
                return;
              }
            } catch (e) {
              console.error('Failed to process stored export state:', e);
            }
          }

          // Regular login flow - redirect to stored path
          setState({
            status: 'success',
            message: 'Login successful',
            redirectPath: storedReturnPath
          });

          // Immediate redirect for regular login
          navigate(storedReturnPath);
          return;
        }

        // If we don't have a session or session error, check for OAuth callback parameters
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        
        const error = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');

        if (error || !session) {
          throw new Error(errorDescription || 'Authentication failed. Please try again.');
        }

      } catch (err) {
        console.error('Auth callback error:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          timestamp: new Date().toISOString()
        });
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Authentication failed',
          redirectPath: '/'
        });
      } finally {
        // Clean up stored data
        sessionStorage.removeItem('playlist_export_state');
        localStorage.removeItem('spotify_auth_return_path');
        localStorage.removeItem('auth_redirect');
        localStorage.removeItem('auth_state');
      }
    };

    handleCallback();
  }, [navigate, auth]);

  // Only show loading or error states - success redirects immediately
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        {state.status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">{state.message || 'Completing login...'}</p>
          </>
        )}

        {state.status === 'error' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
            <p className="text-gray-300 mb-6">{state.message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
