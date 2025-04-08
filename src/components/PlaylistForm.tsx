import React, { useState, FormEvent } from 'react';

interface PlaylistFormProps {
  onSubmit: (data: PlaylistFormData) => void;
  loading?: boolean;
}

interface PlaylistFormData {
  moods: string[];
  genres: string[];
  duration: number;
}

const moods = ['Energetic', 'Relaxed', 'Focused', 'Party', 'Workout', 'Chill', 'Happy', 'Sad'];
const genres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Indie'];
const durations = [30, 45, 60, 90];

export const PlaylistForm: React.FC<PlaylistFormProps> = ({ onSubmit, loading = false }) => {
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const isValid = selectedMoods.length > 0 && selectedGenres.length > 0 && selectedDuration !== null;

  const handleMoodSelect = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || !selectedDuration) return;
    
    onSubmit({
      moods: selectedMoods,
      genres: selectedGenres,
      duration: selectedDuration
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mood Selection */}
      <div className="space-y-4">
        <h2 className="text-3xl font-thin tracking-[0.15em] text-gray-100">Choose your mood</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {moods.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => handleMoodSelect(mood)}
              className={`px-6 py-3 rounded-xl font-light tracking-[0.1em] transition-all duration-300 ${
                selectedMoods.includes(mood)
                  ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20'
                  : 'bg-[var(--dark-accent)]/10 text-gray-300 hover:bg-[var(--dark-accent)]/20'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Selection */}
      <div className="space-y-4">
        <h2 className="text-3xl font-thin tracking-[0.15em] text-gray-100">Select genres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreSelect(genre)}
              className={`px-6 py-3 rounded-xl font-light tracking-[0.1em] transition-all duration-300 ${
                selectedGenres.includes(genre)
                  ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20'
                  : 'bg-[var(--dark-accent)]/10 text-gray-300 hover:bg-[var(--dark-accent)]/20'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="space-y-4">
        <h2 className="text-3xl font-thin tracking-[0.15em] text-gray-100">Playlist duration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {durations.map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => setSelectedDuration(duration)}
              className={`px-6 py-3 rounded-xl font-light tracking-[0.1em] transition-all duration-300 ${
                selectedDuration === duration
                  ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20'
                  : 'bg-[var(--dark-accent)]/10 text-gray-300 hover:bg-[var(--dark-accent)]/20'
              }`}
            >
              {duration} min
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !isValid}
        className={`w-full px-8 py-4 rounded-xl font-light tracking-[0.15em] text-lg transition-all duration-300 ${
          loading || !isValid
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color-dark)] text-white hover:shadow-lg hover:shadow-[var(--primary-color)]/20'
        }`}
      >
        {loading ? 'Creating...' : 'Create Playlist'}
      </button>

      {/* Validation Message */}
      {!isValid && (
        <p className="text-sm text-red-400 font-light tracking-[0.1em] text-center">
          Please select at least one mood and genre
        </p>
      )}
    </form>
  );
}; 