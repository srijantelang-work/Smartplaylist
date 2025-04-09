export type MoodType = 
  | 'happy'
  | 'sad'
  | 'energetic'
  | 'relaxed'
  | 'focused'
  | 'party'
  | 'workout'
  | 'chill';

export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  spotify_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_playlists: number;
  total_songs: number;
  total_duration: number;
  favorite_genres: { genre: string; count: number }[];
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_genres: string[];
  favorite_artists: string[];
  preferred_bpm_min: number | null;
  preferred_bpm_max: number | null;
  preferred_moods: MoodType[];
  theme_preference: 'light' | 'dark' | 'system';
  high_contrast_mode: boolean;
  reduced_motion: boolean;
  font_size: 'small' | 'medium' | 'large';
  notification_settings: {
    emailNotifications: boolean;
    playlistUpdates: boolean;
    newFeatures: boolean;
    marketingEmails: boolean;
  };
  privacy_settings: {
    publicProfile: boolean;
    showPlaylists: boolean;
    allowDataCollection: boolean;
    shareListeningHistory: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string | null;
  mood: MoodType | null;
  is_public: boolean;
  song_count: number;
  total_duration: number;
  cover_url: string | null;
  spotify_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  playlist_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  year: number | null;
  bpm: number | null;
  key: string | null;
  spotify_id: string | null;
  youtube_id: string | null;
  preview_url: string | null;
  created_at: string;
}

export interface Track {
  id: string;
  name: string;
  artists: string[];
  album: string;
  duration_ms: number;
  preview_url: string | null;
  spotify_id: string | null;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id: string;
  playlist_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PlaylistMetrics {
  id: string;
  playlist_id: string;
  total_plays: number;
  unique_listeners: number;
  average_completion_rate: number;
  share_count: number;
  favorite_count: number;
  last_played_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  total_playlists_created: number;
  total_playlists_shared: number;
  total_collaborations: number;
  favorite_genres: Array<{ genre: string; count: number }>;
  active_days: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface CollaborationInvite {
  id: string;
  playlist_id: string;
  inviter_id: string;
  invitee_email: string;
  role: CollaboratorRole;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
}

export interface Collaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  role: CollaboratorRole;
  joined_at: string;
}

export type CollaboratorRole = 'editor' | 'viewer';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface ShareSettings {
  is_public: boolean;
  allow_comments: boolean;
  allow_duplication: boolean;
  require_approval: boolean;
  expiry_date?: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_stats: {
        Row: UserStats;
        Insert: Omit<UserStats, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserStats, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      playlists: {
        Row: Playlist;
        Insert: Omit<Playlist, 'id' | 'song_count' | 'total_duration' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      songs: {
        Row: Song;
        Insert: Omit<Song, 'id' | 'created_at'>;
        Update: Partial<Omit<Song, 'id' | 'playlist_id' | 'created_at'>>;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>;
        Update: never;
      };
      playlist_metrics: {
        Row: PlaylistMetrics;
        Insert: Omit<PlaylistMetrics, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PlaylistMetrics, 'id' | 'playlist_id' | 'created_at' | 'updated_at'>>;
      };
      user_analytics: {
        Row: UserAnalytics;
        Insert: Omit<UserAnalytics, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserAnalytics, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      collaboration_invites: {
        Row: CollaborationInvite;
        Insert: Omit<CollaborationInvite, 'id' | 'created_at'>;
        Update: Partial<Omit<CollaborationInvite, 'id' | 'playlist_id' | 'inviter_id' | 'created_at'>>;
      };
      collaborators: {
        Row: Collaborator;
        Insert: Omit<Collaborator, 'id' | 'joined_at'>;
        Update: Partial<Omit<Collaborator, 'id' | 'playlist_id' | 'user_id' | 'joined_at'>>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      check_playlist_access: {
        Args: {
          p_playlist_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      accept_collaboration_invite: {
        Args: {
          p_invite_id: string;
          p_user_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      mood_type: MoodType;
      collaborator_role: CollaboratorRole;
      invite_status: InviteStatus;
    };
  };
} 