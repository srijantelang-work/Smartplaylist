import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';
import { SpotifyService } from '../../../services/spotifyService';
import { YouTubeService } from '../../../services/youtubeService';
import { supabase } from '../../../lib/supabase';
import { Modal } from '../../../components/common/Modal';

interface IntegrationStatus {
  spotify: {
    connected: boolean;
    username?: string;
    error?: string | null;
  };
  youtube: {
    connected: boolean;
    username?: string;
    error?: string | null;
  };
}

interface UserProfileUpdates {
  spotify_id?: string | null;
  spotify_tokens?: unknown | null;
  youtube_tokens?: unknown | null;
}

export function IntegrationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    spotify: { connected: false },
    youtube: { connected: false },
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

        // Check YouTube integration
        try {
          const youtubeService = YouTubeService.getInstance();
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const hasYouTubeTokens = currentUser?.user_metadata?.youtube_tokens;
          
          if (hasYouTubeTokens) {
            const youtubeUser = await youtubeService.getCurrentUser();
            setIntegrationStatus(prev => ({
              ...prev,
              youtube: {
                connected: true,
                username: youtubeUser.snippet.title
              }
            }));
          } else {
            setIntegrationStatus(prev => ({
              ...prev,
              youtube: {
                connected: false,
                error: null // Clear any previous error since this is an expected state
              }
            }));
          }
        } catch (err) {
          console.warn('YouTube integration error:', err);
          setIntegrationStatus(prev => ({
            ...prev,
            youtube: {
              connected: false,
              error: err instanceof Error ? err.message : 'Failed to connect to YouTube'
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

  const handleConnect = async (platform: 'spotify' | 'youtube') => {
    if (!user) return;
    
    if (platform === 'youtube') {
      setShowYouTubeModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (platform === 'spotify') {
        const spotifyService = SpotifyService.getInstance();
        await spotifyService.authorize();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect to ${platform}`);
      setLoading(false);
    }
  };

  const handleDisconnect = async (platform: 'spotify' | 'youtube') => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Update user profile
      const updates: UserProfileUpdates = {};
      if (platform === 'spotify') {
        updates.spotify_id = null;
        updates.spotify_tokens = null;
      } else {
        updates.youtube_tokens = null;
      }

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
          Connect your music streaming accounts to enable playlist synchronization
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
                  : 'Connect to import and export playlists'}
              </p>
            </div>
          </div>
          <button
            onClick={() => integrationStatus.spotify.connected
              ? handleDisconnect('spotify')
              : handleConnect('spotify')}
            disabled={loading}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              integrationStatus.spotify.connected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#1DB954] hover:bg-[#1DB954]/90 text-white'
            }`}
          >
            {loading ? 'Loading...' : integrationStatus.spotify.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        {integrationStatus.spotify.error && (
          <p className="text-sm text-red-400">{integrationStatus.spotify.error}</p>
        )}
      </div>

      {/* YouTube Integration */}
      <div className="p-6 bg-black rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#FF0000">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <div>
              <h3 className="font-medium">YouTube</h3>
              <p className="text-sm text-[#E8E8E8]">
                {integrationStatus.youtube.connected
                  ? `Connected as ${integrationStatus.youtube.username}`
                  : 'Connect to import and export playlists'}
              </p>
            </div>
          </div>
          <button
            onClick={() => integrationStatus.youtube.connected
              ? handleDisconnect('youtube')
              : handleConnect('youtube')}
            disabled={loading}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              integrationStatus.youtube.connected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#FF0000] hover:bg-[#FF0000]/90 text-white'
            }`}
          >
            {loading ? 'Loading...' : integrationStatus.youtube.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        {integrationStatus.youtube.error && (
          <p className="text-sm text-red-400">{integrationStatus.youtube.error}</p>
        )}
      </div>

      <p className="text-sm text-[#E8E8E8]">
        Note: Connecting these services allows SmartPlaylist to create and manage playlists on your behalf.
        You can disconnect these integrations at any time.
      </p>

      {/* YouTube Integration Modal */}
      <Modal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        title="YouTube Integration"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Feature Coming Soon!</h3>
          <p className="text-[#E8E8E8] mb-4">
            We're working hard to bring YouTube integration to SmartPlaylist. Stay tuned for updates!
          </p>
          <button
            onClick={() => setShowYouTubeModal(false)}
            className="w-full bg-[#FF0000] text-white py-2 px-4 rounded-full hover:bg-opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}