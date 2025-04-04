import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import loginPhoto from '../../assets/images/loginphoto.jpg';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Container Box */}
      <div className="bg-[#121212] rounded-2xl overflow-hidden w-full max-w-4xl flex shadow-2xl">
        {/* Left side - Image */}
        <div className="w-1/2 relative">
          <img
            src={loginPhoto}
            alt="Vinyl Record Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20" /> {/* Subtle overlay */}
        </div>

        {/* Right side - Login Content */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[#E8E8E8] text-sm">
              {isLogin
                ? 'Sign in to start creating smart playlists'
                : 'Join us to create amazing playlists'}
            </p>
          </div>

          {/* OAuth Buttons */}
          <OAuthButtons onSuccess={handleSuccess} />

          {/* Toggle Login/Register */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#1DB954] text-sm hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 