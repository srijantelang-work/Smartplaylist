/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: { email: string; password: string; fullName: string }) => Promise<{ error: AuthError | null }>;
  signIn: (data: { email: string; password: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) return { error: signUpError };
      if (!authData.user) {
        const error = new Error('User creation failed') as AuthError;
        error.status = 400;
        error.code = 'USER_CREATION_FAILED';
        return { error };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            avatar_url: null,
          },
        ]);

      if (profileError) {
        const error = new Error(profileError.message) as AuthError;
        error.status = parseInt(profileError.code) || 400;
        error.code = 'PROFILE_CREATION_FAILED';
        return { error };
      }

      // Create initial user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .insert([
          {
            user_id: authData.user.id,
            preferred_genres: [],
            favorite_artists: [],
            preferred_moods: [],
            privacy_settings: {
              publicProfile: false,
              showPlaylists: true,
              allowDataCollection: true,
              shareListeningHistory: false
            }
          },
        ]);

      if (preferencesError) {
        console.warn('Failed to create initial preferences:', preferencesError);
        // Don't fail signup if preferences creation fails
      }

      return { error: null };
    } catch (error) {
      const authError = new Error((error as Error).message) as AuthError;
      authError.status = 500;
      authError.code = 'SIGNUP_FAILED';
      return { error: authError };
    }
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithProvider = async (provider: Provider) => {
    try {
      // Store current path for redirect
      const currentPath = window.location.pathname;
      localStorage.setItem('auth_redirect', currentPath);
      
      // Clear any existing auth states to prevent loops
      sessionStorage.removeItem('spotify_auth_state');
      localStorage.removeItem('spotify_auth_state');
      
      // Get the absolute URL for redirect
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth/callback`;
      
      // Store the redirect URL to verify later
      sessionStorage.setItem('expected_redirect', redirectUrl);
      
      console.log('Initiating provider sign in:', {
        provider,
        redirectUrl,
        currentPath,
        origin,
        timestamp: new Date().toISOString()
      });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          scopes: provider === 'spotify' 
            ? 'playlist-modify-public playlist-modify-private user-read-private user-read-email'
            : provider === 'google'
            ? 'https://www.googleapis.com/auth/youtube.force-ssl'
            : undefined,
          queryParams: provider === 'spotify' ? {
            show_dialog: 'true',
            response_type: 'code',
            // Force new auth flow to prevent loops
            state: `spotify-auth-${Date.now()}`,
          } : undefined
        },
      });

      if (error) {
        console.error('Provider sign in error:', {
          provider,
          error,
          redirectUrl,
          currentUrl: window.location.href,
          timestamp: new Date().toISOString()
        });
        // Clear any stale state that might cause loops
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');
        sessionStorage.removeItem('expected_redirect');
      }

      return { error };
    } catch (error) {
      console.error('Unexpected error during provider sign in:', {
        error,
        provider,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      // First get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session retrieval error:', sessionError);
      }

      // If we have a valid session, try to sign out properly
      if (session?.access_token) {
        try {
          // Try local scope first
          const { error: localError } = await supabase.auth.signOut({
            scope: 'local'
          });

          if (localError) {
            console.error('Local sign out error:', localError);
            
            // Only try global scope if local failed
            const { error: globalError } = await supabase.auth.signOut({
              scope: 'global'
            });

            if (globalError) {
              console.error('Global sign out error:', globalError);
            }
          }
        } catch (signOutError) {
          console.error('Sign out operation error:', signOutError);
        }
      }

      // Regardless of sign out success, clean up all auth states
      try {
        // Clear session explicitly first
        await supabase.auth.setSession({
          access_token: '',
          refresh_token: ''
        });

        // Then clear all OAuth and auth-related states
        sessionStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('auth_redirect');
        
        // Clear any other auth-related storage
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        
        // Force refresh auth state
        setUser(null);
      } catch (cleanupError) {
        console.error('Auth cleanup error:', cleanupError);
      }
    } catch (error) {
      console.error('Sign out process error:', error);
      
      // Final fallback: force clear everything
      try {
        await supabase.auth.setSession({
          access_token: '',
          refresh_token: ''
        });
        setUser(null);
      } catch (finalError) {
        console.error('Final cleanup error:', finalError);
      }
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 