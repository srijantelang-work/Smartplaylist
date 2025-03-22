import { supabase } from './supabase';
import type { AuthError, Provider, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export type AuthResponse = {
  user: User | null;
  error: AuthError | null;
};

export type SignUpData = {
  email: string;
  password: string;
  fullName: string;
};

export type SignInData = {
  email: string;
  password: string;
};

class AuthService {
  async signUp({ email, password, fullName }: SignUpData): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

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

      if (profileError) throw profileError;

      // Create initial user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .insert([
          {
            user_id: authData.user.id,
            preferred_genres: [],
            favorite_artists: [],
            preferred_moods: [],
          },
        ]);

      if (preferencesError) throw preferencesError;

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: error as AuthError };
    }
  }

  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error as AuthError };
    }
  }

  async signInWithProvider(provider: Provider): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'spotify' ? 'playlist-modify-public playlist-modify-private user-read-email' : undefined,
        },
      });

      if (error) throw error;
      
      // OAuth sign-in initiates a redirect, so we won't have a user object immediately
      return { user: null, error: null };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return { user: null, error: error as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error as AuthError };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      return { error: error as AuthError };
    }
  }

  async getSession() {
    return await supabase.auth.getSession();
  }

  async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  }

  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: User | null) => void) {
    return supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      callback(
        event === 'SIGNED_IN' ? 'SIGNED_IN' : 'SIGNED_OUT',
        session?.user ?? null
      );
    });
  }
}

export const authService = new AuthService(); 