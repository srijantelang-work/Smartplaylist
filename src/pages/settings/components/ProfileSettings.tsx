import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';

export function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const data = await userService.getUserProfile(user.id);
        setFormData({
          fullName: data.full_name || '',
          avatarUrl: data.avatar_url || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await userService.updateUserProfile(user.id, {
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl,
      });
      // Show success message or toast
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
        <p className="text-[#E8E8E8]">
          Manage your personal information and profile settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-[#000000] overflow-hidden">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#323232] text-[#E8E8E8]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <input
                type="text"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="Enter image URL"
                className="w-full px-4 py-2 bg-black border border-[#323232] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
              />
              <p className="mt-1 text-sm text-[#E8E8E8]">
                Enter the URL of your profile picture
              </p>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2 bg-black border border-[#323232] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-2 bg-[#000000] border border-[#323232] rounded-lg text-[#E8E8E8] cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-[#E8E8E8]">
            Email cannot be changed
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#1DB954] text-white rounded-full font-medium hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 