import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { PlaylistGrid } from './components/PlaylistGrid';
import { PlaylistFilters } from './components/PlaylistFilters';
import { SearchBar } from './components/SearchBar';
import { useAuth } from '../../hooks/useAuth';
import { playlistService } from '../../services/playlistService';
import type { Playlist } from '../../types/database';

type SortOption = 'newest' | 'oldest' | 'name' | 'songs' | 'duration';

interface FilterState {
  search: string;
  genres: string[];
  moods: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const initialFilters: FilterState = {
  search: '',
  genres: [],
  moods: [],
  dateRange: {
    start: null,
    end: null,
  },
};

export function MyPlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedPlaylists = await playlistService.getUserPlaylists(user.id);
      
      // Apply filters
      const filteredPlaylists = fetchedPlaylists.filter(playlist => {
        const matchesSearch = playlist.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesGenres = filters.genres.length === 0 || filters.genres.some(genre => 
          playlist.description?.toLowerCase().includes(genre.toLowerCase())
        );
        const matchesMoods = filters.moods.length === 0 || (playlist.mood && filters.moods.includes(playlist.mood));
        const matchesDate = !filters.dateRange.start || !filters.dateRange.end || (
          new Date(playlist.created_at) >= filters.dateRange.start &&
          new Date(playlist.created_at) <= filters.dateRange.end
        );

        return matchesSearch && matchesGenres && matchesMoods && matchesDate;
      });

      // Apply sorting
      filteredPlaylists.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'name':
            return a.name.localeCompare(b.name);
          case 'songs':
            return b.song_count - a.song_count;
          case 'duration':
            return b.total_duration - a.total_duration;
          default:
            return 0;
        }
      });

      // Implement pagination
      const itemsPerPage = 12;
      const start = (page - 1) * itemsPerPage;
      const paginatedPlaylists = filteredPlaylists.slice(start, start + itemsPerPage);
      
      setPlaylists(prev => page === 1 ? paginatedPlaylists : [...prev, ...paginatedPlaylists]);
      setHasMore(paginatedPlaylists.length === itemsPerPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }, [user, filters, sortBy, page]);

  useEffect(() => {
    if (!user) return;
    fetchPlaylists();
  }, [user, fetchPlaylists]);

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPage(1);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setPage(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handlePlaylistDeleted = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Playlists</h1>
            <p className="text-[#E8E8E8]">
              Manage and organize your AI-generated playlists
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <SearchBar onSearch={handleSearch} />
            <PlaylistFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Playlists Grid */}
          {error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : (
            <PlaylistGrid
              playlists={playlists}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onPlaylistDeleted={handlePlaylistDeleted}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 