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
            className="w-full px-6 py-4 bg-[#121212]/90 hover:bg-[#1a1a1a]/90 focus:bg-[#1a1a1a]/95 border border-[var(--glass-border)] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-300 resize-none h-40 text-lg backdrop-blur-sm"
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
          <span className="text-2xl font-semibold gradient-text">
            {formData.songCount}
          </span>
        </div>
        <div className="relative py-4">
          <input
            type="range"
            min="5"
            max="20"
            step="5"
            value={formData.songCount}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({ ...formData, songCount: Math.min(value, 20) });
            }}
            className="w-full h-2 glass rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)] hover:glass-dark transition-all duration-300"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>5 songs</span>
            <span>20 songs</span>
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
              className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-300 hover-lift ripple ${
                formData.mood === mood
                  ? 'bg-[var(--primary-color)] text-white depth-2'
                  : 'glass-dark text-gray-300 hover:glass'
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
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  genres: prev.genres.includes(genre)
                    ? prev.genres.filter(g => g !== genre)
                    : [...prev.genres, genre]
                }));
              }}
              className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-300 hover-lift ripple ${
                formData.genres.includes(genre)
                  ? 'bg-[var(--primary-color)] text-white depth-2'
                  : 'glass-dark text-gray-300 hover:glass'
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
          onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-[var(--dark-surface)] ${
            formData.isPublic ? 'bg-[var(--primary-color)]' : 'glass-dark'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
              formData.isPublic ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-base text-gray-300">Make playlist public</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !formData.prompt.trim()}
        className={`w-full px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 hover-lift ripple ${
          loading || !formData.prompt.trim()
            ? 'glass-dark text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color-dark)] text-white depth-2 hover:depth-3'
        }`}
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