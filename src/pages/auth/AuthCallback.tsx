import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SpotifyService } from '../../services/spotifyService';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for Spotify-specific error
        if (error) {
          throw new Error(`Spotify authorization error: ${error}`);
        }

        // Try to get stored state data
        const storedStateData = sessionStorage.getItem('spotify_auth_state');
        
        if (storedStateData) {
          // This is a Spotify callback
          if (!code || !state) {
            throw new Error('Missing required Spotify authorization parameters');
          }

          const stateData = JSON.parse(storedStateData);
          const spotifyService = SpotifyService.getInstance();
          const success = await spotifyService.handleCallback(code, state);
          
          if (!success) {
            throw new Error('Failed to complete Spotify integration');
          }

          // Return to the original page or default to settings
          const returnTo = stateData.returnTo || '/settings';
          navigate(returnTo, { replace: true });
          return;
        }

        // Handle Supabase auth callback
        const { data: { session }, error: supabaseError } = await supabase.auth.getSession();
        if (supabaseError) throw supabaseError;

        if (session) {
          // Check if user already has Spotify connected
          const { data: { user } } = await supabase.auth.getUser();
          const hasSpotifyTokens = user?.user_metadata?.spotify_tokens;

          if (!hasSpotifyTokens) {
            // Automatically initiate Spotify connection
            const spotifyService = SpotifyService.getInstance();
            await spotifyService.authorize();
            return;
          }
        }
        
        // Default navigation for Supabase auth
        navigate('/create-playlist', { replace: true });
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        // Delay navigation to show error
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