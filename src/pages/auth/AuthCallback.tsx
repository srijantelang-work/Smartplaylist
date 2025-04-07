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
          hasAuthRedirect: !!localStorage.getItem('auth_redirect'),
          expectedRedirect: sessionStorage.getItem('expected_redirect')
        });

        // Verify we're on the expected callback URL
        const expectedRedirect = sessionStorage.getItem('expected_redirect');
        if (expectedRedirect && !window.location.href.startsWith(expectedRedirect)) {
          console.error('Redirect URL mismatch:', {
            expected: expectedRedirect,
            actual: window.location.href
          });
          throw new Error('Invalid redirect URL');
        }

        // Wait briefly to ensure Supabase has processed the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // First, check if this is a Supabase auth callback
        const { data: { session }, error: supabaseError } = await supabase.auth.getSession();
        
        if (supabaseError) {
          console.error('Supabase auth error:', {
            error: supabaseError,
            url: window.location.href,
            params: Object.fromEntries(searchParams.entries())
          });
          throw supabaseError;
        }

        // If we have a session, handle Spotify token exchange if needed
        if (session) {
          // Enhanced session logging
          console.log('Session details:', {
            timestamp: new Date().toISOString(),
            provider: session.user?.app_metadata?.provider,
            userId: session.user?.id,
            hasSpotifyTokens: !!session.user?.user_metadata?.spotify_tokens,
            hasAccessToken: !!session.access_token,
            metadata: session.user?.user_metadata,
            appMetadata: session.user?.app_metadata
          });

          // If this was a Spotify auth and we don't have tokens, we need to exchange the code
          if (session.user?.app_metadata?.provider === 'spotify') {
            const code = searchParams.get('code');
            
            if (code && !session.user?.user_metadata?.spotify_tokens) {
              console.log('Initiating Spotify token exchange...');
              
              try {
                // Exchange the code for tokens
                const spotifyService = SpotifyService.getInstance();
                const success = await spotifyService.handleCallback(code, searchParams.get('state') || 'supabase-auth');
                
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

                // Double check session after refresh
                const { data: { session: refreshedSession } } = await supabase.auth.getSession();
                if (!refreshedSession) {
                  throw new Error('Session refresh failed');
                }

                // Verify Spotify tokens are present
                if (!refreshedSession.user?.user_metadata?.spotify_tokens) {
                  throw new Error('Spotify tokens not found after refresh');
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
          
          // Clear auth states AFTER successful processing
          localStorage.removeItem('auth_redirect');
          sessionStorage.removeItem('spotify_auth_state');
          localStorage.removeItem('spotify_auth_state');
          sessionStorage.removeItem('expected_redirect');
          
          // Ensure we still have a valid session before redirecting
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (!finalSession) {
            throw new Error('Session lost during callback processing');
          }

          // Force a small delay before redirect to ensure state is saved
          await new Promise(resolve => setTimeout(resolve, 500));

          // Navigate to the return URL
          console.log('Auth callback successful, redirecting to:', returnTo);
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
        
        // Clear any stale state
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('auth_redirect');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/auth/login', { replace: true });
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
            <p className="text-[#E8E8E8]">Redirecting to login...</p>
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