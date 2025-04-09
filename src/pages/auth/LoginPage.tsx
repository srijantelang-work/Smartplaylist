import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { signInWithProvider } = useAuth();
  const navigate = useNavigate();

  const handleSpotifySignIn = async () => {
    const { error: signInError } = await signInWithProvider('spotify');
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

            {/* Spotify Button */}
            <button
              onClick={handleSpotifySignIn}
              className="w-full bg-[#1DB954] text-white px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-[#1ed760]"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.53-1.07.29-3.29-2.02-7.43-2.47-12.31-1.35-.47.11-.95-.16-1.06-.63-.11-.47.16-.95.63-1.06 5.35-1.23 10.01-.68 13.7 1.69.35.22.48.74.26 1.11zm1.47-3.27c-.3.46-.84.65-1.29.35-3.76-2.32-9.51-2.99-13.97-1.64-.58.18-1.19-.15-1.37-.73-.18-.58.15-1.19.73-1.37 5.09-1.55 11.42-.78 15.77 1.91.46.29.65.83.35 1.29zm.13-3.41c-4.51-2.68-11.95-2.93-16.28-1.62-.69.21-1.42-.17-1.63-.86-.21-.69.17-1.42.86-1.63 4.95-1.5 13.19-1.21 18.38 1.86.61.36.81 1.16.45 1.77-.36.61-1.16.81-1.77.45z"/>
                </svg>
                <span className="text-base font-medium">Continue with Spotify</span>
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