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
        console.log('Auth callback initiated:', {
          timestamp: new Date().toISOString(),
          search: window.location.search,
          hash: window.location.hash,
          pathname: window.location.pathname,
          href: window.location.href
        });

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
          console.log('Auth state check:', {
            hasSession: !!session,
            sessionStorage: {
              hasExportState: !!sessionStorage.getItem('playlist_export_state'),
              hasAuthState: !!sessionStorage.getItem('spotify_auth_state')
            },
            localStorage: {
              hasExportState: !!localStorage.getItem('playlist_export_state'),
              hasAuthState: !!localStorage.getItem('spotify_auth_state'),
              hasReturnPath: !!localStorage.getItem('spotify_return_path')
            }
          });
          
          // We have a valid session, refresh user data
          if (auth.refreshUser) {
            await auth.refreshUser();
          }

          // Get stored return path or default to home
          const storedReturnPath = localStorage.getItem('auth_redirect') || '/';
          
          // Try to retrieve export state from multiple sources
          const getStoredState = () => {
            // Try sessionStorage first
            const sessionState = sessionStorage.getItem('playlist_export_state');
            if (sessionState) return sessionState;

            // Try localStorage next
            const localState = localStorage.getItem('playlist_export_state');
            if (localState) return localState;

            // Try cookies as last resort
            const cookies = document.cookie.split(';');
            const stateCookie = cookies.find(c => c.trim().startsWith('playlist_export_state='));
            if (stateCookie) {
              return decodeURIComponent(stateCookie.split('=')[1]);
            }

            return null;
          };

          const storedState = getStoredState();
          console.log('Retrieved stored state:', {
            hasState: !!storedState,
            timestamp: new Date().toISOString()
          });

          if (storedState) {
            try {
              const exportState = JSON.parse(storedState);
              // Validate the state has required fields and isn't too old
              if (exportState.playlistId && 
                  exportState.state && 
                  exportState.timestamp && 
                  Date.now() - exportState.timestamp < 3600000) {  // 1 hour expiry
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

                // Only clean up storage after successful export
                sessionStorage.removeItem('playlist_export_state');
                localStorage.removeItem('playlist_export_state');
                localStorage.removeItem('spotify_auth_return_path');
                localStorage.removeItem('auth_redirect');
                localStorage.removeItem('auth_state');

                navigate(`/playlist/${exportState.playlistId}${
                  result.success 
                    ? `?export=success&url=${encodeURIComponent(result.url)}` 
                    : `?export=error&message=${encodeURIComponent(result.error || 'Export failed')}`
                }`);
                return;
              }
            } catch (e) {
              console.error('Failed to process stored export state:', e);
              // On error, redirect back to the playlist if we can extract the ID
              try {
                const exportState = JSON.parse(storedState);
                if (exportState.playlistId) {
                  navigate(`/playlist/${exportState.playlistId}?export=error&message=${encodeURIComponent('Failed to connect to Spotify')}`);
                  return;
                }
              } catch {
                // If we can't even parse the state at all, continue to regular flow
              }
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
