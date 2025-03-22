import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';
import { Toggle } from '../../../components/common/Toggle';

interface PrivacyPreferences {
  publicProfile: boolean;
  showPlaylists: boolean;
  allowDataCollection: boolean;
  shareListeningHistory: boolean;
}

export function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    publicProfile: false,
    showPlaylists: true,
    allowDataCollection: true,
    shareListeningHistory: false,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setInitialLoading(true);
      setError(null);

      try {
        const userPreferences = await userService.getUserPreferences(user.id);
        if (userPreferences?.privacy_settings) {
          setPreferences({
            publicProfile: userPreferences.privacy_settings.publicProfile,
            showPlaylists: userPreferences.privacy_settings.showPlaylists,
            allowDataCollection: userPreferences.privacy_settings.allowDataCollection,
            shareListeningHistory: userPreferences.privacy_settings.shareListeningHistory,
          });
        }
      } catch (err) {
        console.error('Failed to load privacy settings:', err);
        setError('Failed to load privacy settings. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleToggle = async (key: keyof PrivacyPreferences) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key],
      };

      // Update only the privacy_settings column with the new preferences
      const updatedPrefs = await userService.updateUserPreferences(user.id, {
        privacy_settings: newPreferences
      });

      if (updatedPrefs?.privacy_settings) {
        setPreferences(updatedPrefs.privacy_settings);
      } else {
        throw new Error('Failed to update privacy settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
      // Revert the toggle if update failed
      setPreferences(preferences);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Implement account deletion logic
      await userService.deleteAccount(user.id);
      // Handle successful deletion (e.g., sign out and redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#1DB954] border-r-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
        <p className="text-[#E8E8E8]">
          Control your privacy and data preferences
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Public Profile */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Public Profile</h3>
            <p className="text-sm text-[#E8E8E8]">
              Allow others to view your profile
            </p>
          </div>
          <Toggle
            enabled={preferences.publicProfile}
            onChange={() => handleToggle('publicProfile')}
            disabled={loading}
          />
        </div>

        {/* Show Playlists */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Show Playlists</h3>
            <p className="text-sm text-[#E8E8E8]">
              Make your playlists visible to others
            </p>
          </div>
          <Toggle
            enabled={preferences.showPlaylists}
            onChange={() => handleToggle('showPlaylists')}
            disabled={loading}
          />
        </div>

        {/* Data Collection */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Data Collection</h3>
            <p className="text-sm text-[#E8E8E8]">
              Allow us to collect usage data to improve your experience
            </p>
          </div>
          <Toggle
            enabled={preferences.allowDataCollection}
            onChange={() => handleToggle('allowDataCollection')}
            disabled={loading}
          />
        </div>

        {/* Listening History */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Share Listening History</h3>
            <p className="text-sm text-[#E8E8E8]">
              Share your listening activity with friends
            </p>
          </div>
          <Toggle
            enabled={preferences.shareListeningHistory}
            onChange={() => handleToggle('shareListeningHistory')}
            disabled={loading}
          />
        </div>
      </div>

      {/* Data Export & Deletion */}
      <div className="border-t border-[#323232] pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Data Management</h3>
        <div className="space-y-4">
          <button
            onClick={() => {/* Implement data export */}}
            className="w-full px-4 py-2 bg-[#323232] text-white rounded-lg hover:bg-opacity-90 transition"
          >
            Export Your Data
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
          >
            Delete Account
          </button>
        </div>
        <p className="mt-4 text-sm text-[#E8E8E8]">
          Deleting your account will permanently remove all your data from our servers.
          This action cannot be undone.
        </p>
      </div>
    </div>
  );
} 