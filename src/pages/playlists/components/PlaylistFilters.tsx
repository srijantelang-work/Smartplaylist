import { useState } from 'react';
import type { MoodType } from '../../../types/database';

interface FilterState {
  genres: string[];
  moods: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

type SortOption = 'newest' | 'oldest' | 'name' | 'songs' | 'duration';

interface PlaylistFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name' },
  { value: 'songs', label: 'Song Count' },
  { value: 'duration', label: 'Duration' },
];

export function PlaylistFilters({
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
}: PlaylistFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onFilterChange({ genres: newGenres });
  };

  const toggleMood = (mood: MoodType) => {
    const newMoods = filters.moods.includes(mood)
      ? filters.moods.filter(m => m !== mood)
      : [...filters.moods, mood];
    onFilterChange({ moods: newMoods });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    onFilterChange({
      dateRange: {
        ...filters.dateRange,
        [type]: value ? new Date(value) : null,
      },
    });
  };

  return (
    <div className="bg-[#323232] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-black text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Active Filters Summary */}
          <div className="text-[#E8E8E8] text-sm">
            {filters.genres.length > 0 && (
              <span className="mr-2">{filters.genres.length} genres</span>
            )}
            {filters.moods.length > 0 && (
              <span className="mr-2">{filters.moods.length} moods</span>
            )}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span>Date filtered</span>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#E8E8E8] hover:text-white"
        >
          <svg
            className={`w-6 h-6 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 mt-4 pt-4 border-t border-black">
          {/* Date Range */}
          <div>
            <h3 className="text-white font-medium mb-2">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#E8E8E8] mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="w-full bg-black text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#E8E8E8] mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="w-full bg-black text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-white font-medium mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${filters.genres.includes(genre)
                      ? 'bg-[#1DB954] text-white'
                      : 'bg-black text-[#E8E8E8] hover:bg-[#1DB954] hover:bg-opacity-20'
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Moods */}
          <div>
            <h3 className="text-white font-medium mb-2">Moods</h3>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => toggleMood(mood)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${filters.moods.includes(mood)
                      ? 'bg-[#1DB954] text-white'
                      : 'bg-black text-[#E8E8E8] hover:bg-[#1DB954] hover:bg-opacity-20'
                    }`}
                >
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.genres.length > 0 ||
            filters.moods.length > 0 ||
            filters.dateRange.start ||
            filters.dateRange.end) && (
            <button
              onClick={() =>
                onFilterChange({
                  genres: [],
                  moods: [],
                  dateRange: { start: null, end: null },
                })
              }
              className="text-[#1DB954] text-sm hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
} 