import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show navbar on auth pages
  if (location.pathname.startsWith('/auth/')) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Left section */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 text-white font-bold text-xl"
            >
              <span>SmartPlaylist</span>
            </Link>
            <div className="hidden md:flex md:ml-8 md:space-x-4">
              <Link
                to="/create-playlist"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === '/create-playlist'
                    ? 'bg-[#1DB954] text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Create Playlist
              </Link>
              {user && (
                <>
                  <Link
                    to="/my-playlists"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      location.pathname === '/my-playlists'
                        ? 'bg-[#1DB954] text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    My Playlists
                  </Link>
                  <Link
                    to="/settings"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      location.pathname === '/settings'
                        ? 'bg-[#1DB954] text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/auth/login"
                  className="px-6 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white hover:bg-[#1ed760] transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden absolute top-4 right-4 text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="sr-only">Open menu</span>
        {isMobileMenuOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/create-playlist"
              className={`block px-4 py-2 rounded-md text-base font-medium ${
                location.pathname === '/create-playlist'
                  ? 'bg-[#1DB954] text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Playlist
            </Link>
            {user && (
              <>
                <Link
                  to="/my-playlists"
                  className={`block px-4 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/my-playlists'
                      ? 'bg-[#1DB954] text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Playlists
                </Link>
                <Link
                  to="/settings"
                  className={`block px-4 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/settings'
                      ? 'bg-[#1DB954] text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 