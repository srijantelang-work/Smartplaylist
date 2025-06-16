import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Don't show navbar on auth pages
  if (location.pathname.startsWith('/auth/')) {
    return null;
  }

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple sign-out attempts
    
    try {
      setIsSigningOut(true);
      console.log('Navbar: Initiating sign out...');
      
      // Clear any local storage items that might keep user state
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      await signOut();
      
      // Force navigation to home page after sign out
      window.location.replace('/');
    } catch (error) {
      console.error('Navbar: Error during sign out:', error);
      setIsSigningOut(false);
      
      // If sign out fails, try a hard refresh
      window.location.reload();
    }
  };

  // Early return if no user to prevent showing sign-out button
  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            {/* Left section */}
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-white"
              >
                <span className="text-xl sm:text-2xl tracking-[0.2em] font-thin">
                  SMART<span className="text-[#1DB954]">PLAYLIST</span>
                </span>
              </Link>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* Legal Links - Hidden on mobile */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <Link
                  to="/privacy"
                  className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  to="/terms"
                  className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Left section */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center text-white"
            >
              <span className="text-xl sm:text-2xl font-thin tracking-[0.2em] font-display">
                SMART<span className="text-[#1DB954]">PLAYLIST</span>
              </span>
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
            {/* Legal Links - Hidden on mobile */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link
                to="/privacy"
                className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Terms
              </Link>
            </div>
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSigningOut ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <span>Sign Out</span>
                  )}
                </button>
                {isSigningOut && (
                  <Link
                    to="/auth/signout"
                    className="text-xs text-[#1DB954] hover:underline"
                  >
                    Taking too long? Click here
                  </Link>
                )}
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
            {/* Legal Links in Mobile Menu */}
            <div className="border-t border-white/10 mt-2 pt-2">
              <Link
                to="/privacy"
                className="block px-4 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="block px-4 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 