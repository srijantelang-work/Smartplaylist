import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';
import { Toggle } from '../../../components/common/Toggle';

interface NotificationPreferences {
  emailNotifications: boolean;
  playlistUpdates: boolean;
  newFeatures: boolean;
  marketingEmails: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    playlistUpdates: true,
    newFeatures: true,
    marketingEmails: false,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setInitialLoading(true);
      setError(null);

      try {
        const userPreferences = await userService.getUserPreferences(user.id);
        if (userPreferences?.notification_settings) {
          setPreferences(userPreferences.notification_settings);
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
        setError('Failed to load notification settings. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key],
      };

      // Update only the notification_settings column with the new preferences
      const updatedPrefs = await userService.updateUserPreferences(user.id, {
        notification_settings: newPreferences
      });

      if (updatedPrefs?.notification_settings) {
        setPreferences(updatedPrefs.notification_settings);
      } else {
        throw new Error('Failed to update notification settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
      // Revert the toggle if update failed
      setPreferences(preferences);
    } finally {
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
        <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
        <p className="text-[#E8E8E8]">
          Manage how you receive notifications and updates
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-[#E8E8E8]">
              Receive important updates via email
            </p>
          </div>
          <Toggle
            enabled={preferences.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
            disabled={loading}
          />
        </div>

        {/* Playlist Updates */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Playlist Updates</h3>
            <p className="text-sm text-[#E8E8E8]">
              Get notified when your playlists are updated
            </p>
          </div>
          <Toggle
            enabled={preferences.playlistUpdates}
            onChange={() => handleToggle('playlistUpdates')}
            disabled={loading}
          />
        </div>

        {/* New Features */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">New Features</h3>
            <p className="text-sm text-[#E8E8E8]">
              Stay updated about new features and improvements
            </p>
          </div>
          <Toggle
            enabled={preferences.newFeatures}
            onChange={() => handleToggle('newFeatures')}
            disabled={loading}
          />
        </div>

        {/* Marketing Emails */}
        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
          <div>
            <h3 className="font-medium">Marketing Emails</h3>
            <p className="text-sm text-[#E8E8E8]">
              Receive promotional offers and marketing updates
            </p>
          </div>
          <Toggle
            enabled={preferences.marketingEmails}
            onChange={() => handleToggle('marketingEmails')}
            disabled={loading}
          />
        </div>
      </div>

      <p className="text-sm text-[#E8E8E8]">
        You can change these settings at any time. For more information about our communication practices, please see our Privacy Policy.
      </p>
    </div>
  );
} 