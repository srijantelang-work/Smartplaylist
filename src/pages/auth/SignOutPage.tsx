import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function SignOutPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'signing-out' | 'success' | 'error'>('signing-out');
  
  useEffect(() => {
    const performSignOut = async () => {
      try {
        // Clear all possible stored auth states
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('auth_redirect');
        localStorage.removeItem('auth_state');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Sign out error:', error);
          setStatus('error');
          return;
        }
        
        setStatus('success');
        
        // Redirect after a delay to allow user to see the success message
        setTimeout(() => {
          window.location.replace('/');
        }, 2000);
      } catch (error) {
        console.error('Unexpected error during sign out:', error);
        setStatus('error');
      }
    };
    
    performSignOut();
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-[var(--dark-background)] flex flex-col items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-md p-8 rounded-xl max-w-md w-full border border-white/10">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          {status === 'signing-out' && 'Signing Out...'}
          {status === 'success' && 'Sign Out Successful'}
          {status === 'error' && 'Sign Out Error'}
        </h1>
        
        {status === 'signing-out' && (
          <div className="flex justify-center mb-6">
            <div className="animate-spin h-12 w-12 border-4 border-[#1DB954] border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center mb-6 text-white/80">
            <p>You have been successfully signed out.</p>
            <p className="mt-2">Redirecting you to the home page...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center mb-6 text-white/80">
            <p>There was an error signing you out.</p>
            <p className="mt-2">Please try again or clear your browser cache.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-full text-sm font-medium text-white bg-[#1DB954] hover:bg-[#1ed760] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-[#1DB954] hover:underline"
          >
            Return to Home Page
          </a>
        </div>
      </div>
    </div>
  );
} 