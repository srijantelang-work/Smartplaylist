import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Playlist } from '../types/database';
import type { StateCreator } from 'zustand';

interface PlaylistStore {
  playlists: Playlist[];
  loading: boolean;
  error: string | null;
  fetchPlaylists: () => Promise<void>;
}

export const usePlaylistStore = create<PlaylistStore>(
  ((set) => ({
    playlists: [],
    loading: false,
    error: null,
    fetchPlaylists: async () => {
      try {
        set({ loading: true, error: null });
        
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        set({ playlists: data || [], loading: false });
      } catch (err) {
        console.error('Error fetching playlists:', err);
        set({ 
          error: err instanceof Error ? err.message : 'Failed to fetch playlists',
          loading: false 
        });
      }
    },
  })) as StateCreator<PlaylistStore>
); 