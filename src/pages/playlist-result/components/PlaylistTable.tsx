import { useState, useMemo } from 'react';
import type { Playlist, Track } from '../../../types/database';

interface PlaylistTableProps {
  playlist: Playlist & { tracks: Track[] };
}

type SortField = 'title' | 'artist' | 'album' | 'duration';
type SortDirection = 'asc' | 'desc';

export function PlaylistTable({ playlist }: PlaylistTableProps) {
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sortedTracks = useMemo(() => {
    const tracks = [...playlist.tracks];
    
    return tracks.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'artist':
          comparison = a.artists[0].localeCompare(b.artists[0]);
          break;
        case 'album':
          comparison = (a.album || '').localeCompare(b.album || '');
          break;
        case 'duration':
          comparison = a.duration_ms - b.duration_ms;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [playlist.tracks, sortField, sortDirection]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-6 py-4 text-left text-sm font-light text-gray-400 tracking-wider">#</th>
            <th className="px-6 py-4 text-left text-sm font-light text-gray-400 tracking-wider">
              <button
                onClick={() => handleSort('title')}
                className="flex items-center space-x-1 hover:text-gray-200 transition-colors focus:outline-none group"
              >
                <span>Title</span>
                {sortField === 'title' && (
                  <svg 
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-left text-sm font-light text-gray-400 tracking-wider">
              <button
                onClick={() => handleSort('artist')}
                className="flex items-center space-x-1 hover:text-gray-200 transition-colors focus:outline-none group"
              >
                <span>Artist</span>
                {sortField === 'artist' && (
                  <svg 
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-left text-sm font-light text-gray-400 tracking-wider">
              <button
                onClick={() => handleSort('album')}
                className="flex items-center space-x-1 hover:text-gray-200 transition-colors focus:outline-none group"
              >
                <span>Album</span>
                {sortField === 'album' && (
                  <svg 
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-left text-sm font-light text-gray-400 tracking-wider">
              <button
                onClick={() => handleSort('duration')}
                className="flex items-center space-x-1 hover:text-gray-200 transition-colors focus:outline-none group"
              >
                <span>Duration</span>
                {sortField === 'duration' && (
                  <svg 
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedTracks.map((track, index) => (
            <tr 
              key={track.id} 
              className="group hover:bg-white/5 transition-colors duration-200"
            >
              <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                {index + 1}
              </td>
              <td className="px-6 py-4 text-sm text-gray-100 whitespace-nowrap font-medium group-hover:text-[var(--primary-color)] transition-colors">
                {track.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                {track.artists.join(", ")}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                {track.album}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                {formatDuration(track.duration_ms)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 