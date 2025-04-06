import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  song_count: number;
}

export function MyPlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPlaylists(data || []);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const handleDeleteClick = (playlistId: string) => {
    setDeleteConfirmation(playlistId);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleConfirmDelete = async (playlistId: string) => {
    try {
      setIsDeleting(true);
      
      // First delete all songs in the playlist
      const { error: songsError } = await supabase
        .from('songs')
        .delete()
        .eq('playlist_id', playlistId);

      if (songsError) throw songsError;

      // Then delete the playlist
      const { error: playlistError } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user?.id); // Ensure user owns the playlist

      if (playlistError) throw playlistError;

      // Update local state
      setPlaylists(playlists.filter(p => p.id !== playlistId));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen relative">
        {/* Background with overlay */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/playlist-wallpaper.jpg')] bg-cover bg-center bg-no-repeat opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
        </div>
        
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
          <h1 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">My Playlists</h1>
          <p className="text-gray-300 mb-8 drop-shadow-md">Please log in to view your playlists.</p>
          <Link
            to="/auth/login"
            className="bg-[var(--primary-color)] text-white px-6 py-3 rounded-md hover:bg-[var(--primary-color)]/90 backdrop-blur-sm transition-all"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Background with overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/playlist-wallpaper.jpg')] bg-cover bg-center bg-no-repeat opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">My Playlists</h1>
          <Link
            to="/create-playlist"
            className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md hover:bg-[var(--primary-color)]/90 backdrop-blur-sm transition-all"
          >
            Create New Playlist
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-color)] mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading playlists...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-16 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">No Playlists Yet</h2>
            <p className="text-gray-300 mb-8">Create your first playlist to get started!</p>
            <Link
              to="/create-playlist"
              className="bg-[var(--primary-color)] text-white px-6 py-3 rounded-md hover:bg-[var(--primary-color)]/90 transition-all"
            >
              Create Playlist
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="relative">
                <Link
                  to={`/playlist-result/${playlist.id}`}
                  className="block bg-black/40 backdrop-blur-sm rounded-lg p-6 hover:bg-black/60 transition-all duration-300 border border-white/10 group"
                >
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-[var(--primary-color)]">{playlist.name}</h2>
                  {playlist.description && (
                    <p className="text-gray-300 mb-4 line-clamp-2">{playlist.description}</p>
                  )}
                  <div className="flex justify-between text-sm text-gray-400">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      {playlist.song_count} songs
                    </span>
                    <span className="text-gray-500">{new Date(playlist.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteClick(playlist.id);
                  }}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-black/40"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                {deleteConfirmation === playlist.id && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700">
                      <h3 className="text-xl font-semibold text-white mb-4">Delete Playlist</h3>
                      <p className="text-gray-300 mb-6">
                        Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={handleCancelDelete}
                          className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                          disabled={isDeleting}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(playlist.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 