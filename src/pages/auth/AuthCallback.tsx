import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SpotifyService } from '../../services/spotifyService';
import { PlaylistExportService } from '../../services/playlistExportService';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

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
          hasAuthRedirect: !!localStorage.getItem('auth_redirect')
        });

        // Log all search parameters for debugging
        console.log('Auth callback received:', {
          params: Object.fromEntries(searchParams.entries()),
          url: window.location.href,
          hasSession: !!(await supabase.auth.getSession()).data.session
        });

        // Clear any stale state that might cause loops
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');

        // First, check if this is a Supabase auth callback
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

        // If we have a session, handle Spotify token exchange if needed
        if (session) {
          // Enhanced session logging
          console.log('Session details:', {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            provider: session.user?.app_metadata?.provider,
            userId: session.user?.id,
            hasSpotifyTokens: !!session.user?.user_metadata?.spotify_tokens,
            hasAccessToken: !!session.access_token,
            metadata: session.user?.user_metadata,
            appMetadata: session.user?.app_metadata,
            currentUrl: window.location.href,
            hasLocalStorage: !!localStorage.getItem('auth_redirect'),
            hasSessionStorage: !!sessionStorage.getItem('spotify_auth_state')
          });

          // If this was a Spotify auth and we don't have tokens, we need to exchange the code
          if (session.user?.app_metadata?.provider === 'spotify') {
            const code = searchParams.get('code');
            
            if (code && !session.user?.user_metadata?.spotify_tokens) {
              console.log('Initiating Spotify token exchange...');
              
              try {
                // Exchange the code for tokens
                const spotifyService = SpotifyService.getInstance();
                const success = await spotifyService.handleCallback(code, 'supabase-auth');
                
                if (!success) {
                  // If token exchange fails, sign out and redirect to login
                  await supabase.auth.signOut();
                  throw new Error('Failed to exchange Spotify tokens. Please try logging in again.');
                }

                // Refresh the session to get the updated tokens
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                  // If session refresh fails, sign out and redirect to login
                  await supabase.auth.signOut();
                  throw refreshError;
                }

                console.log('Spotify token exchange completed successfully');
              } catch (tokenError) {
                console.error('Token exchange failed:', tokenError);
                // Sign out and redirect to login with error message
                await supabase.auth.signOut();
                throw new Error('Failed to complete Spotify authentication. Please try again.');
              }
            }
          }

          // Get the return URL from localStorage if it exists
          const returnTo = localStorage.getItem('auth_redirect') || '/';
          localStorage.removeItem('auth_redirect');
          
          // Navigate to the return URL
          navigate(returnTo, { replace: true });
          return;
        }

        // If no session, check for direct Spotify integration callback
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

        // Handle direct Spotify integration
        if (code && state) {
          let storedStateData = sessionStorage.getItem('spotify_auth_state');
          if (!storedStateData) {
            storedStateData = localStorage.getItem('spotify_auth_state');
          }

          if (!storedStateData) {
            throw new Error('No stored state found for Spotify integration');
          }

          const stateData = JSON.parse(storedStateData);
          const spotifyService = SpotifyService.getInstance();
          const success = await spotifyService.handleCallback(code, state);
          
          if (!success) {
            throw new Error('Failed to complete Spotify integration');
          }

          // Clean up storage
          sessionStorage.removeItem('spotify_auth_state');
          localStorage.removeItem('spotify_auth_state');

          // Handle playlist export if needed
          if (stateData.playlistId) {
            const exportService = PlaylistExportService.getInstance();
            const result = await exportService.exportPlaylist(
              stateData.playlistId,
              'spotify',
              {
                isPublic: stateData.isPublic || false,
                includeDescription: true,
                description: stateData.description
              }
            );

            if (result.success) {
              navigate(`/playlist/${stateData.playlistId}?export=success&url=${encodeURIComponent(result.url)}`, { replace: true });
              return;
            }
          }

          navigate(stateData.returnTo || '/settings', { replace: true });
          return;
        }

        // If we get here without handling any callback, something went wrong
        throw new Error('Invalid authentication state');
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => {
          navigate('/settings', { replace: true });
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
