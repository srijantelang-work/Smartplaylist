import { useState, useMemo } from 'react';
import type { Playlist, Song } from '../../../types/database';

interface PlaylistTableProps {
  playlist: Playlist & { songs: Song[] };
}

type SortField = 'title' | 'artist' | 'album' | 'duration' | 'bpm' | 'year';
type SortDirection = 'asc' | 'desc';

export function PlaylistTable({ playlist }: PlaylistTableProps) {
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState('');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDuration = (duration: number) => {
    if (!duration) return '-';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sortedAndFilteredSongs = useMemo(() => {
    let result = [...playlist.songs];

    // Apply filter
    if (filter) {
      const lowercaseFilter = filter.toLowerCase();
      result = result.filter(song =>
        song.title.toLowerCase().includes(lowercaseFilter) ||
        song.artist.toLowerCase().includes(lowercaseFilter) ||
        song.album?.toLowerCase().includes(lowercaseFilter)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist);
          break;
        case 'album':
          comparison = (a.album || '').localeCompare(b.album || '');
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'bpm':
          comparison = (a.bpm || 0) - (b.bpm || 0);
          break;
        case 'year':
          comparison = (a.year || 0) - (b.year || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [playlist.songs, sortField, sortDirection, filter]);

  return (
    <div className="bg-[#323232] rounded-lg overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-[#000000]">
        <input
          type="text"
          placeholder="Filter songs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 bg-black text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-[#E8E8E8] font-medium">#</th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="text-[#E8E8E8] font-medium hover:text-white flex items-center"
                >
                  Title
                  {sortField === 'title' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('artist')}
                  className="text-[#E8E8E8] font-medium hover:text-white flex items-center"
                >
                  Artist
                  {sortField === 'artist' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('album')}
                  className="text-[#E8E8E8] font-medium hover:text-white flex items-center"
                >
                  Album
                  {sortField === 'album' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('duration')}
                  className="text-[#E8E8E8] font-medium hover:text-white flex items-center"
                >
                  Duration
                  {sortField === 'duration' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('bpm')}
                  className="text-[#E8E8E8] font-medium hover:text-white flex items-center"
                >
                  BPM
                  {sortField === 'bpm' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('year')}
                  className="text-[#E8E8E8] font-medium hover:text-white flex items-center"
                >
                  Year
                  {sortField === 'year' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredSongs.map((song, index) => (
              <tr
                key={song.id}
                className="border-t border-[#000000] hover:bg-black/30 transition-colors"
              >
                <td className="px-4 py-3 text-[#E8E8E8] text-right">{index + 1}</td>
                <td className="px-4 py-3 text-white">{song.title}</td>
                <td className="px-4 py-3 text-[#E8E8E8]">{song.artist}</td>
                <td className="px-4 py-3 text-[#E8E8E8]">{song.album || '-'}</td>
                <td className="px-4 py-3 text-[#E8E8E8]">{formatDuration(song.duration)}</td>
                <td className="px-4 py-3 text-[#E8E8E8]">{song.bpm || '-'}</td>
                <td className="px-4 py-3 text-[#E8E8E8]">{song.year || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results */}
      {sortedAndFilteredSongs.length === 0 && (
        <div className="text-center py-8 text-[#E8E8E8]">
          No songs match your filter criteria
        </div>
      )}
    </div>
  );
} 