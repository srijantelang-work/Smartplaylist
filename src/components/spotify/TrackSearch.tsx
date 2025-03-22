import { useState, useCallback } from 'react';
import { SpotifyService } from '../../services/spotifyService';
import { SearchBar } from '../../pages/playlists/components/SearchBar';
import { Spacing } from '../layout/Spacing';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
}

interface TrackSearchProps {
  onTrackSelect?: (track: SpotifyTrack) => void;
  selectedTracks?: Set<string>;
}

export function TrackSearch({ onTrackSelect, selectedTracks = new Set() }: TrackSearchProps) {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const spotifyService = SpotifyService.getInstance();
      const results = await spotifyService.searchTracks(query);
      setTracks(results);
    } catch (err) {
      setError('Failed to search tracks. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <SearchBar
        onSearch={handleSearch}
        isLoading={isLoading}
        error={error}
        className="mb-6"
      />
      
      {tracks.length > 0 && (
        <Spacing size={2}>
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => onTrackSelect?.(track)}
              className={`
                w-full p-4 rounded-lg
                flex items-center gap-4
                transition-all duration-200
                ${
                  selectedTracks.has(track.id)
                    ? 'bg-[#1DB954] bg-opacity-20 hover:bg-opacity-30'
                    : 'bg-[#323232] hover:bg-opacity-80'
                }
              `}
            >
              <img
                src={track.album.images[2]?.url || track.album.images[0]?.url}
                alt={`${track.album.name} cover`}
                className="w-12 h-12 rounded"
              />
              
              <div className="flex-grow text-left">
                <h3 className="text-white font-medium truncate">{track.name}</h3>
                <p className="text-[#E8E8E8] text-sm truncate">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              </div>
              
              <div className="text-[#E8E8E8] text-sm">
                {formatDuration(track.duration_ms)}
              </div>
            </button>
          ))}
        </Spacing>
      )}

      {!isLoading && !error && tracks.length === 0 && (
        <div className="text-center text-[#E8E8E8] mt-8">
          Search for tracks to add to your playlist
        </div>
      )}
    </div>
  );
} 