import { useState, useEffect } from 'react';
import { MoodType } from '../../types/database';

interface PlaylistFormData {
  prompt: string;
  songCount: number;
  mood: MoodType | null;
  genres: string[];
  isPublic: boolean;
}

interface PlaylistFormProps {
  initialData: PlaylistFormData;
  onSubmit: (data: PlaylistFormData) => void | Promise<void>;
  loading: boolean;
}

const AVAILABLE_GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Latin', 'Metal', 'Folk', 'Blues',
  'Indie', 'Alternative', 'Dance', 'Reggae'
];

const MOODS: MoodType[] = [
  'happy', 'sad', 'energetic', 'relaxed',
  'focused', 'party', 'workout', 'chill'
];

export function PlaylistForm({ initialData, onSubmit, loading }: PlaylistFormProps) {
  const [formData, setFormData] = useState<PlaylistFormData>(initialData);
  const [promptLength, setPromptLength] = useState(0);
  const maxPromptLength = 200;

  useEffect(() => {
    setPromptLength(formData.prompt.length);
  }, [formData.prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="block text-lg font-medium text-gray-200">
          Describe Your Playlist
        </label>
        <div className="relative">
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            maxLength={maxPromptLength}
            placeholder="e.g., A high-energy workout playlist with motivational beats..."
            className="w-full px-6 py-4 bg-[var(--dark-surface)] border border-[var(--dark-accent)] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition-all duration-200 resize-none h-40 text-lg"
            required
          />
          <div className="absolute bottom-3 right-3 text-sm text-gray-400">
            {promptLength}/{maxPromptLength}
          </div>
        </div>
      </div>

      {/* Song Count Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-lg font-medium text-gray-200">
            Number of Songs
          </label>
          <span className="text-2xl font-semibold text-[var(--primary-color)]">
            {formData.songCount}
          </span>
        </div>
        <div className="relative py-4">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={formData.songCount}
            onChange={(e) => setFormData({ ...formData, songCount: parseInt(e.target.value) })}
            className="w-full h-2 bg-[var(--dark-accent)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>5 songs</span>
            <span>50 songs</span>
          </div>
        </div>
      </div>

      {/* Mood Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-gray-200">
          Mood (Optional)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => setFormData({ ...formData, mood: formData.mood === mood ? null : mood })}
              className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 transform hover:scale-105
                ${formData.mood === mood
                  ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20'
                  : 'bg-[var(--dark-surface)] text-gray-300 hover:bg-[var(--dark-accent)] hover:text-white'
                }`}
            >
              {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-gray-200">
          Preferred Genres
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AVAILABLE_GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 transform hover:scale-105
                ${formData.genres.includes(genre)
                  ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20'
                  : 'bg-[var(--dark-surface)] text-gray-300 hover:bg-[var(--dark-accent)] hover:text-white'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Public/Private Toggle */}
      <div className="flex items-center space-x-4 py-3">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-[var(--dark-surface)]
            ${formData.isPublic ? 'bg-[var(--primary-color)]' : 'bg-[var(--dark-accent)]'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
              ${formData.isPublic ? 'translate-x-8' : 'translate-x-1'}`}
          />
        </button>
        <span className="text-base text-gray-300">Make playlist public</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !formData.prompt.trim()}
        className="w-full bg-[var(--primary-color)] text-white py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--primary-color)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Generating your playlist...</span>
          </div>
        ) : (
          'Generate Playlist'
        )}
      </button>
    </form>
  );
} 