import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';
import type { MoodType } from '../../../types/database';

interface AccountPreferencesForm {
  preferredGenres: string[];
  favoriteArtists: string[];
  preferredMoods: MoodType[];
  preferredBpmMin: number;
  preferredBpmMax: number;
}

const availableGenres = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Folk', 'Metal', 'Blues', 'Reggae',
];

const availableMoods: MoodType[] = [
  'happy', 'sad', 'energetic', 'relaxed', 'focused',
  'party', 'workout', 'chill',
];

export function AccountPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountPreferencesForm>({
    preferredGenres: [],
    favoriteArtists: [],
    preferredMoods: [],
    preferredBpmMin: 60,
    preferredBpmMax: 180,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      try {
        const preferences = await userService.getUserPreferences(user.id);
        if (preferences) {
          setFormData({
            preferredGenres: preferences.preferred_genres || [],
            favoriteArtists: preferences.favorite_artists || [],
            preferredMoods: preferences.preferred_moods || [],
            preferredBpmMin: preferences.preferred_bpm_min || 60,
            preferredBpmMax: preferences.preferred_bpm_max || 180,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      }
    };

    fetchPreferences();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await userService.updateUserPreferences(user.id, {
        preferred_genres: formData.preferredGenres,
        favorite_artists: formData.favoriteArtists,
        preferred_moods: formData.preferredMoods,
        preferred_bpm_min: formData.preferredBpmMin,
        preferred_bpm_max: formData.preferredBpmMax,
      });
      // Show success message or toast
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      preferredGenres: prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter(g => g !== genre)
        : [...prev.preferredGenres, genre],
    }));
  };

  const toggleMood = (mood: MoodType) => {
    setFormData(prev => ({
      ...prev,
      preferredMoods: prev.preferredMoods.includes(mood)
        ? prev.preferredMoods.filter(m => m !== mood)
        : [...prev.preferredMoods, mood],
    }));
  };

  const handleArtistInput = (input: string) => {
    const artists = input.split(',').map(artist => artist.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      favoriteArtists: artists,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Account Preferences</h2>
        <p className="text-[#E8E8E8]">
          Customize your music preferences for better recommendations
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preferred Genres */}
        <div>
          <label className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Preferred Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map(genre => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  formData.preferredGenres.includes(genre)
                    ? 'bg-[#1DB954] text-white'
                    : 'bg-[#323232] text-[#E8E8E8] hover:bg-opacity-75'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite Artists */}
        <div>
          <label htmlFor="artists" className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Favorite Artists
          </label>
          <input
            id="artists"
            type="text"
            value={formData.favoriteArtists.join(', ')}
            onChange={(e) => handleArtistInput(e.target.value)}
            placeholder="Enter artist names, separated by commas"
            className="w-full px-4 py-2 bg-black border border-[#323232] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
          />
        </div>

        {/* Preferred Moods */}
        <div>
          <label className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Preferred Moods
          </label>
          <div className="flex flex-wrap gap-2">
            {availableMoods.map(mood => (
              <button
                key={mood}
                type="button"
                onClick={() => toggleMood(mood)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
                  formData.preferredMoods.includes(mood)
                    ? 'bg-[#1DB954] text-white'
                    : 'bg-[#323232] text-[#E8E8E8] hover:bg-opacity-75'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* BPM Range */}
        <div>
          <label className="block text-sm font-medium text-[#E8E8E8] mb-2">
            Preferred BPM Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bpmMin" className="block text-sm text-[#E8E8E8] mb-1">
                Minimum BPM
              </label>
              <input
                id="bpmMin"
                type="number"
                min="0"
                max={formData.preferredBpmMax}
                value={formData.preferredBpmMin}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  preferredBpmMin: Math.min(parseInt(e.target.value) || 0, prev.preferredBpmMax),
                }))}
                className="w-full px-4 py-2 bg-black border border-[#323232] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="bpmMax" className="block text-sm text-[#E8E8E8] mb-1">
                Maximum BPM
              </label>
              <input
                id="bpmMax"
                type="number"
                min={formData.preferredBpmMin}
                value={formData.preferredBpmMax}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  preferredBpmMax: Math.max(parseInt(e.target.value) || 0, prev.preferredBpmMin),
                }))}
                className="w-full px-4 py-2 bg-black border border-[#323232] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#1DB954] text-white rounded-full font-medium hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
} 