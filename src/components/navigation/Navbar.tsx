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
        <div className="flex justify-between h-16">
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
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white flex items-center gap-2 active:bg-[#1DB954] hover:bg-[#1DB954]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.53-1.07.29-3.29-2.02-7.43-2.47-12.31-1.35-.47.11-.95-.16-1.06-.63-.11-.47.16-.95.63-1.06 5.35-1.23 10.01-.68 13.7 1.69.35.22.48.74.26 1.11zm1.47-3.27c-.3.46-.84.65-1.29.35-3.76-2.32-9.51-2.99-13.97-1.64-.58.18-1.19-.15-1.37-.73-.18-.58.15-1.19.73-1.37 5.09-1.55 11.42-.78 15.77 1.91.46.29.65.83.35 1.29zm.13-3.41c-4.51-2.68-11.95-2.93-16.28-1.62-.69.21-1.42-.17-1.63-.86-.21-.69.17-1.42.86-1.63 4.95-1.5 13.19-1.21 18.38 1.86.61.36.81 1.16.45 1.77-.36.61-1.16.81-1.77.45z"/>
                  </svg>
                  Continue with Spotify
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