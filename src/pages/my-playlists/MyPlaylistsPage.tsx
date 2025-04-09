import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlaylistStore } from '@/stores/playlistStore';
import type { Playlist } from '@/types/database';

export function MyPlaylistsPage() {
  const { playlists, loading, error, fetchPlaylists } = usePlaylistStore();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient particles relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center h-[calc(100vh-6rem)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg font-light">Loading your playlists...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen animated-gradient particles relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center h-[calc(100vh-6rem)]">
          <div className="text-center max-w-md mx-auto px-4">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-2xl font-light text-white mb-2">Error Loading Playlists</h3>
            <p className="text-gray-300 mb-6 font-light">{error}</p>
            <button
              onClick={() => fetchPlaylists()}
              className="px-6 py-3 bg-[#1DB954] text-white rounded-xl hover:bg-[#1ed760] 
                       transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient particles relative overflow-hidden pt-24">
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-thin tracking-wider text-white">
            My <span className="text-[#1DB954] font-thin">Playlists</span>
          </h1>
          <Link
            to="/create-playlist"
            className="group flex items-center gap-2 px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-xl 
                     transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#1DB954]/20"
          >
            <span className="font-medium">Create New Playlist</span>
            <svg 
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist: Playlist, index: number) => (
            <Link
              key={playlist.id}
              to={`/playlist-result/${playlist.id}`}
              className="group relative"
              style={{
                animation: `fadeSlideUp 0.6s ease-out ${index * 0.1}s forwards`,
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            >
              {/* Card with glass effect */}
              <div className="glass-card rounded-2xl p-6 transition-all duration-300 
                            group-hover:shadow-lg group-hover:shadow-[#1DB954]/10
                            transform group-hover:translate-y-[-4px]">
                {/* Playlist Title */}
                <h3 className="text-xl font-medium text-white mb-2 truncate
                             group-hover:text-[#1DB954] transition-colors duration-300">
                  {playlist.name}
                </h3>

                {/* Playlist Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 font-light">
                  {playlist.description || 'No description'}
                </p>

                {/* Playlist Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span>{playlist.song_count} songs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{Math.round(playlist.total_duration / 60)} mins</span>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                              bg-gradient-to-r from-[#1DB954]/10 via-transparent to-transparent
                              transition-opacity duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {playlists.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-gray-300 mb-4">No Playlists Yet</h3>
            <p className="text-gray-400 mb-8 font-light">Create your first playlist to get started!</p>
            <Link
              to="/create-playlist"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] 
                       text-white rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Create Playlist</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Add animations */}
      <style>
        {`
          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animated-gradient {
            background: linear-gradient(
              -45deg,
              #121212,
              #1a1a1a,
              #1DB954/10,
              #121212
            );
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
          }

          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}
      </style>
    </div>
  );
} 