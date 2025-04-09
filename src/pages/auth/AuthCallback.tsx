import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SpotifyService } from '../../services/spotifyService';
import { PlaylistExportService } from '../../services/playlistExportService';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Helper function to get stored return path
  const getStoredReturnPath = () => {
    const sessionReturnPath = sessionStorage.getItem('spotify_return_path');
    const localReturnPath = localStorage.getItem('spotify_return_path');
    try {
      if (sessionReturnPath) {
        return JSON.parse(sessionReturnPath);
      }
      if (localReturnPath) {
        return JSON.parse(localReturnPath);
      }
    } catch (e) {
      console.error('Failed to parse return path:', e);
    }
    return null;
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Enhanced logging
        console.log('Starting auth callback handling...', {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          params: Object.fromEntries(searchParams.entries()),
          hasLocalState: !!localStorage.getItem('spotify_auth_state'),
          hasSessionState: !!sessionStorage.getItem('spotify_auth_state'),
          hasAuthRedirect: !!localStorage.getItem('auth_redirect'),
          hasReturnPath: !!sessionStorage.getItem('spotify_return_path') || !!localStorage.getItem('spotify_return_path')
        });

        // First, check if this is a direct Spotify integration callback
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        if (error) {
          console.error('Spotify OAuth Error:', {
            error,
            error_description,
            state,
            hasCode: !!code,
            hasStoredState: !!sessionStorage.getItem('spotify_auth_state'),
            currentUrl: window.location.href,
            searchParams: Object.fromEntries(searchParams.entries())
          });
          throw new Error(`Spotify authorization error: ${error}${error_description ? ` - ${error_description}` : ''}`);
        }

        // Handle direct Spotify integration if we have a code and state
        if (code && state) {
          let storedStateData = sessionStorage.getItem('spotify_auth_state');
          if (!storedStateData) {
            storedStateData = localStorage.getItem('spotify_auth_state');
          }

          if (!storedStateData) {
            console.error('No stored state found:', {
              sessionStorage: sessionStorage.getItem('spotify_auth_state'),
              localStorage: localStorage.getItem('spotify_auth_state'),
              receivedState: state,
              code: code
            });
            throw new Error('No stored state found for Spotify integration');
          }

          const stateData = JSON.parse(storedStateData);
          console.log('Processing Spotify integration:', {
            stateData,
            receivedState: state,
            code: code
          });

          const spotifyService = SpotifyService.getInstance();
          const success = await spotifyService.handleCallback(code, state);
          
          if (!success) {
            throw new Error('Failed to complete Spotify integration');
          }

          // Get stored return path
          const returnPathData = getStoredReturnPath();
          
          // Handle playlist export if needed
          if (stateData.playlistId || (returnPathData && returnPathData.playlistId)) {
            const playlistId = stateData.playlistId || returnPathData.playlistId;
            console.log('Starting playlist export:', {
              playlistId,
              isPublic: stateData.isPublic,
              description: stateData.description
            });

            const exportService = PlaylistExportService.getInstance();
            const result = await exportService.exportPlaylist(
              playlistId,
              'spotify',
              {
                isPublic: stateData.isPublic || false,
                includeDescription: true,
                description: stateData.description
              }
            );

            // Clean up storage
            sessionStorage.removeItem('spotify_auth_state');
            localStorage.removeItem('spotify_auth_state');
            sessionStorage.removeItem('spotify_return_path');
            localStorage.removeItem('spotify_return_path');

            if (result.success) {
              console.log('Export successful:', {
                playlistId,
                url: result.url
              });
              navigate(`/playlist/${playlistId}?export=success&url=${encodeURIComponent(result.url)}`, { replace: true });
              return;
            } else {
              console.error('Export failed:', result);
              throw new Error('Failed to export playlist to Spotify');
            }
          }

          // Clean up storage
          sessionStorage.removeItem('spotify_auth_state');
          localStorage.removeItem('spotify_auth_state');
          sessionStorage.removeItem('spotify_return_path');
          localStorage.removeItem('spotify_return_path');

          // Navigate to the stored return path or fallback to settings
          const returnPath = returnPathData?.path || stateData.returnTo || '/settings';
          navigate(returnPath, { replace: true });
          return;
        }

        // Check if this is a Supabase auth callback
        const { data: { session }, error: supabaseError } = await supabase.auth.getSession();
        
        if (supabaseError) {
          console.error('Supabase auth error:', {
            error: supabaseError,
            url: window.location.href,
            params: Object.fromEntries(searchParams.entries()),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          });
          throw supabaseError;
        }

        // If we have a session, handle the auth redirect
        if (session) {
          // Get the return URL from localStorage if it exists
          const returnTo = localStorage.getItem('auth_redirect') || '/';
          localStorage.removeItem('auth_redirect');
          
          // Navigate to the return URL
          navigate(returnTo, { replace: true });
          return;
        }

        // If we get here without handling any callback, something went wrong
        throw new Error('Invalid authentication state');
      } catch (err) {
        console.error('Auth callback error:', {
          error: err,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          params: Object.fromEntries(searchParams.entries()),
          hasSession: !!(await supabase.auth.getSession()).data.session,
          environment: process.env.NODE_ENV,
          spotifyState: {
            localStorage: localStorage.getItem('spotify_auth_state'),
            sessionStorage: sessionStorage.getItem('spotify_auth_state')
          }
        });
        
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        
        // Clean up any stale state
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');
        sessionStorage.removeItem('spotify_return_path');
        localStorage.removeItem('spotify_return_path');
        localStorage.removeItem('auth_redirect');

        // Get stored return path for error redirect
        const returnPathData = getStoredReturnPath();
        const returnPath = returnPathData?.path || '/settings';
        
        setTimeout(() => {
          navigate(returnPath, { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-500 bg-red-900/20 px-4 py-3 rounded-lg">
              {error}
            </div>
            <p className="text-[#E8E8E8]">Redirecting...</p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#1DB954] border-r-2 mb-4"></div>
            <p className="text-[#E8E8E8]">Completing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
} 
