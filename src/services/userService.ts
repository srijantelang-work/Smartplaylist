import { supabase } from '../lib/supabase';
import type { User, UserPreferences, UserStats } from '../types/database';

export class UserService {
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserProfile(userId: string, profile: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Failed to update user preferences:', err);
      throw err;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user preferences:', error);
        return null;
      }

      if (!data) {
        // Create default preferences if none exist
        const defaultPreferences = {
          user_id: userId,
          preferred_genres: [],
          favorite_artists: [],
          preferred_moods: [],
          privacy_settings: {
            publicProfile: false,
            showPlaylists: true,
            allowDataCollection: true,
            shareListeningHistory: false
          }
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert([defaultPreferences])
          .select()
          .single();

        if (createError) {
          console.warn('Error creating default preferences:', createError);
          return null;
        }

        return newPrefs;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error in getUserPreferences:', err);
      return null;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAccount(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
}

export const userService = new UserService(); 