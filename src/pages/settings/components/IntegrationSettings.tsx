import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';
import { SpotifyService } from '../../../services/spotifyService';
import { supabase } from '../../../lib/supabase';

interface IntegrationStatus {
  spotify: {
    connected: boolean;
    username?: string;
    error?: string | null;
  };
}

interface UserProfileUpdates {
  spotify_id?: string | null;
  spotify_tokens?: unknown | null;
}

export function IntegrationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    spotify: { connected: false },
  });

  useEffect(() => {
    const checkIntegrations = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      try {
        // Check Spotify integration
        try {
          const spotifyService = SpotifyService.getInstance();
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const hasSpotifyTokens = currentUser?.user_metadata?.spotify_tokens;
          
          if (hasSpotifyTokens) {
            const spotifyUser = await spotifyService.getCurrentUser();
            setIntegrationStatus(prev => ({
              ...prev,
              spotify: {
                connected: true,
                username: spotifyUser.display_name || spotifyUser.id
              }
            }));
          } else {
            setIntegrationStatus(prev => ({
              ...prev,
              spotify: {
                connected: false,
                error: null // Clear any previous error since this is an expected state
              }
            }));
          }
        } catch (err) {
          console.warn('Spotify integration error:', err);
          setIntegrationStatus(prev => ({
            ...prev,
            spotify: {
              connected: false,
              error: err instanceof Error ? err.message : 'Failed to connect to Spotify'
            }
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check integrations');
      } finally {
        setLoading(false);
      }
    };

    checkIntegrations();
  }, [user]);

  const handleConnect = async (platform: 'spotify') => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const spotifyService = SpotifyService.getInstance();
      await spotifyService.authorize();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect to ${platform}`);
      setLoading(false);
    }
  };

  const handleDisconnect = async (platform: 'spotify') => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Update user profile
      const updates: UserProfileUpdates = {
        spotify_id: null,
        spotify_tokens: null,
      };

      await userService.updateUserProfile(user.id, updates);

      // Update local state
      setIntegrationStatus(prev => ({
        ...prev,
        [platform]: { connected: false }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to disconnect from ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Platform Integrations</h2>
        <p className="text-[#E8E8E8]">
          Connect your Spotify account to enable playlist synchronization
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Spotify Integration */}
      <div className="p-6 bg-black rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <div>
              <h3 className="font-medium">Spotify</h3>
              <p className="text-sm text-[#E8E8E8]">
                {integrationStatus.spotify.connected
                  ? `Connected as ${integrationStatus.spotify.username}`
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <button
            onClick={() => integrationStatus.spotify.connected
              ? handleDisconnect('spotify')
              : handleConnect('spotify')
            }
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              integrationStatus.spotify.connected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#1DB954] hover:bg-[#1DB954]/90 text-white'
            } disabled:opacity-50`}
          >
            {loading
              ? 'Processing...'
              : integrationStatus.spotify.connected
              ? 'Disconnect'
              : 'Connect'}
          </button>
        </div>
        {integrationStatus.spotify.error && (
          <p className="text-sm text-red-400 mt-2">{integrationStatus.spotify.error}</p>
        )}
      </div>
    </div>
  );
}