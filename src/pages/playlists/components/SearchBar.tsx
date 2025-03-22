import { useState, useEffect, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

// Type for debounced function with cancel method
type DebouncedFunction<T> = T & {
  cancel: () => void;
};

/**
 * Creates a debounced version of a function that delays its execution
 * until after `wait` milliseconds have elapsed since the last time it was called.
 * 
 * @template T - Function type that extends a function with string parameter
 * @param {T} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {DebouncedFunction<T>} A debounced version of the function with a cancel method
 */
function debounce<T extends (param: string) => void>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout;

  const debounced = (param: string) => {
    const later = () => {
      clearTimeout(timeout);
      func(param);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced as DebouncedFunction<T>;
}

export function SearchBar({ 
  onSearch, 
  isLoading = false, 
  error = '', 
  className = '' 
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Create debounced search with proper typing
  const debouncedSearch = useCallback(
    (term: string) => {
      onSearch(term);
    },
    [onSearch]
  );

  const debouncedSearchWithDelay = debounce(debouncedSearch, 300);

  useEffect(() => {
    debouncedSearchWithDelay(searchTerm);
    return () => debouncedSearchWithDelay.cancel();
  }, [searchTerm, debouncedSearchWithDelay]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`
        relative transition-all duration-200 ease-in-out
        ${isFocused ? 'scale-[1.01]' : 'scale-100'}
        ${error ? 'ring-2 ring-red-500' : ''}
      `}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search playlists..."
          disabled={isLoading}
          aria-label="Search playlists"
          aria-invalid={!!error}
          className={`
            w-full px-4 py-3 pl-10 
            bg-[#323232] text-white rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-[#1DB954] 
            placeholder-[#E8E8E8]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : ''}
          `}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin h-5 w-5">
              <svg className="h-5 w-5 text-[#1DB954]" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : (
            <svg
              className="h-5 w-5 text-[#E8E8E8] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        {searchTerm && !isLoading && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#E8E8E8] hover:text-white
              transition-colors duration-200"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <div className="text-red-500 text-sm px-2 animate-fade-in" role="alert">
          {error}
        </div>
      )}
    </div>
  );
} 