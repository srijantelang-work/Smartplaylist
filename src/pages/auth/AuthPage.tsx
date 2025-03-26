import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { OAuthButtons } from '../../components/auth/OAuthButtons';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[#E8E8E8]">
            {isLogin
              ? 'Sign in to start creating smart playlists'
              : 'Join us to create amazing playlists'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons onSuccess={handleSuccess} />

        {/* Login/Register Form */}
        <div className="bg-[#121212] rounded-lg p-8 shadow-xl">
          {isLogin ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}
        </div>

        {/* Toggle Login/Register */}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#1DB954] hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
} 