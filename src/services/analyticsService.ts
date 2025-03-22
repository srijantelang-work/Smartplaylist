import { supabase } from '../lib/supabase';

interface AnalyticsEvent {
  event_type: string;
  user_id: string;
  playlist_id?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface PlaylistMetrics {
  total_plays: number;
  unique_listeners: number;
  average_completion_rate: number;
  share_count: number;
  favorite_count: number;
  last_played_at: string;
}

interface UserAnalytics {
  total_playlists_created: number;
  total_playlists_shared: number;
  total_collaborations: number;
  favorite_genres: Array<{ genre: string; count: number }>;
  active_days: number;
  last_active_at: string;
}

interface GenreCount {
  genre: string;
  count: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track a user event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert([{
          ...event,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  /**
   * Track playlist interaction
   */
  async trackPlaylistInteraction(
    playlistId: string,
    userId: string,
    action: 'play' | 'share' | 'favorite' | 'collaborate',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      event_type: `playlist_${action}`,
      user_id: userId,
      playlist_id: playlistId,
      metadata
    });

    // Update playlist metrics
    try {
      const { data: metrics } = await supabase
        .from('playlist_metrics')
        .select('*')
        .eq('playlist_id', playlistId)
        .single();

      const updates: Partial<PlaylistMetrics> = {};
      
      switch (action) {
        case 'play':
          updates.total_plays = (metrics?.total_plays || 0) + 1;
          updates.last_played_at = new Date().toISOString();
          break;
        case 'share':
          updates.share_count = (metrics?.share_count || 0) + 1;
          break;
        case 'favorite':
          updates.favorite_count = (metrics?.favorite_count || 0) + 1;
          break;
      }

      await supabase
        .from('playlist_metrics')
        .upsert([{
          playlist_id: playlistId,
          ...metrics,
          ...updates,
        }]);
    } catch (error) {
      console.error('Failed to update playlist metrics:', error);
    }
  }

  /**
   * Get playlist metrics
   */
  async getPlaylistMetrics(playlistId: string): Promise<PlaylistMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('playlist_metrics')
        .select('*')
        .eq('playlist_id', playlistId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get playlist metrics:', error);
      return null;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return null;
    }
  }

  /**
   * Update user activity
   */
  async updateUserActivity(userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { data: analytics } = await supabase
        .from('user_analytics')
        .select('last_active_at, active_days')
        .eq('user_id', userId)
        .single();

      // Calculate active days
      let activeDays = analytics?.active_days || 0;
      if (analytics?.last_active_at) {
        const lastActive = new Date(analytics.last_active_at);
        const today = new Date();
        if (lastActive.toDateString() !== today.toDateString()) {
          activeDays++;
        }
      } else {
        activeDays = 1;
      }

      await supabase
        .from('user_analytics')
        .upsert([{
          user_id: userId,
          last_active_at: now,
          active_days: activeDays,
        }]);
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }

  /**
   * Track genre preference
   */
  async trackGenrePreference(userId: string, genre: string): Promise<void> {
    try {
      const { data: analytics } = await supabase
        .from('user_analytics')
        .select('favorite_genres')
        .eq('user_id', userId)
        .single();

      const favoriteGenres: GenreCount[] = analytics?.favorite_genres || [];
      const existingGenre = favoriteGenres.find((g: GenreCount) => g.genre === genre);

      if (existingGenre) {
        existingGenre.count++;
      } else {
        favoriteGenres.push({ genre, count: 1 });
      }

      // Sort by count in descending order
      favoriteGenres.sort((a: GenreCount, b: GenreCount) => b.count - a.count);

      await supabase
        .from('user_analytics')
        .upsert([{
          user_id: userId,
          favorite_genres: favoriteGenres,
        }]);
    } catch (error) {
      console.error('Failed to track genre preference:', error);
    }
  }
} 