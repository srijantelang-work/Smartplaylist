import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { signInWithProvider } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const { error: signInError } = await signInWithProvider('google');
    if (signInError) {
      setError(signInError.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center p-4">
      {/* Main Card */}
      <div className="w-full max-w-5xl h-[600px] bg-black rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left Section - Image */}
        <div className="w-1/2 relative bg-black">
          <div className="absolute inset-0">
            <img 
              src="/music-collage.jpg" 
              alt="Music Collage" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
          </div>
          
          <div className="relative z-10 p-16 h-full flex flex-col justify-center">
            <h2 className="text-5xl font-thin tracking-[0.15em] text-white mb-4">
              Create Your<br />Playlist
            </h2>
            <p className="text-lg text-gray-400 font-light tracking-wide">
              Share your music taste<br />and get personalized playlists!
            </p>
          </div>
        </div>

        {/* Right Section - Content */}
        <div className="w-1/2 bg-[#121212] flex flex-col items-center justify-center relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 via-transparent to-transparent" />
          
          <div className="relative z-10 w-full max-w-[320px] px-8 flex flex-col items-center">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-thin tracking-[0.15em] text-white mb-4">
                SMART<span className="text-[#1DB954]">PLAYLIST</span>
              </h1>
              <p className="text-lg text-gray-400 font-light tracking-wide">
                Sign in to create personalized playlists
              </p>
            </div>

            {error && (
              <div className="w-full bg-red-900/20 border border-red-500/20 rounded-lg p-3 mb-6 backdrop-blur-sm">
                <p className="text-red-400 text-sm font-light text-center">{error}</p>
              </div>
            )}

            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white text-gray-800 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-100"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-base font-medium">Continue with Google</span>
              </div>
            </button>

            {/* Terms Text */}
            <p className="text-xs text-gray-500 text-center mt-8 font-light">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-[#1DB954] hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-[#1DB954] hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 