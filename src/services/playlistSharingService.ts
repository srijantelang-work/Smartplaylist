import { supabase } from '../lib/supabase';
import type { User, Song } from '../types/database';

interface ShareSettings {
  isPublic: boolean;
  allowEdits: boolean;
  allowCopy: boolean;
  expiresAt?: Date;
}

interface CollaboratorPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canExport: boolean;
}

interface CollaboratorInfo {
  user: User;
  permissions: CollaboratorPermissions;
  addedAt: Date;
}

interface PlaylistWithSongs {
  id: string;
  name: string;
  description: string | null;
  songs: Song[];
}

export class PlaylistSharingService {
  private static instance: PlaylistSharingService;

  private constructor() {}

  static getInstance(): PlaylistSharingService {
    if (!PlaylistSharingService.instance) {
      PlaylistSharingService.instance = new PlaylistSharingService();
    }
    return PlaylistSharingService.instance;
  }

  /**
   * Share a playlist with specific settings
   */
  async sharePlaylist(playlistId: string, settings: ShareSettings): Promise<string> {
    const { error } = await supabase
      .from('playlists')
      .update({
        is_public: settings.isPublic,
        allow_edits: settings.allowEdits,
        allow_copy: settings.allowCopy,
        share_expires_at: settings.expiresAt?.toISOString(),
      })
      .eq('id', playlistId);

    if (error) throw error;

    // Generate a shareable link
    const shareLink = `${window.location.origin}/playlist/${playlistId}`;
    return shareLink;
  }

  /**
   * Add a collaborator to a playlist
   */
  async addCollaborator(
    playlistId: string,
    userId: string,
    permissions: CollaboratorPermissions
  ): Promise<void> {
    const { error } = await supabase
      .from('playlist_collaborators')
      .insert({
        playlist_id: playlistId,
        user_id: userId,
        can_edit: permissions.canEdit,
        can_delete: permissions.canDelete,
        can_invite: permissions.canInvite,
        can_export: permissions.canExport,
      });

    if (error) throw error;
  }

  /**
   * Get all collaborators for a playlist
   */
  async getCollaborators(playlistId: string): Promise<CollaboratorInfo[]> {
    const { data, error } = await supabase
      .from('playlist_collaborators')
      .select('*, user:users(*)')
      .eq('playlist_id', playlistId);

    if (error) throw error;

    return data.map(row => ({
      user: row.user,
      permissions: {
        canEdit: row.can_edit,
        canDelete: row.can_delete,
        canInvite: row.can_invite,
        canExport: row.can_export,
      },
      addedAt: new Date(row.created_at),
    }));
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaboratorPermissions(
    playlistId: string,
    userId: string,
    permissions: CollaboratorPermissions
  ): Promise<void> {
    const { error } = await supabase
      .from('playlist_collaborators')
      .update({
        can_edit: permissions.canEdit,
        can_delete: permissions.canDelete,
        can_invite: permissions.canInvite,
        can_export: permissions.canExport,
      })
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Remove a collaborator from a playlist
   */
  async removeCollaborator(playlistId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('playlist_collaborators')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Export playlist to various platforms
   */
  async exportPlaylist(playlistId: string, platform: 'spotify' | 'youtube'): Promise<string> {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select('*, songs(*)')
      .eq('id', playlistId)
      .single();

    if (error) throw error;
    if (!playlist) throw new Error('Playlist not found');

    // Implementation will depend on the platform
    switch (platform) {
      case 'spotify':
        // TODO: Implement Spotify export using SpotifyService
        return 'spotify:playlist:id';
      case 'youtube':
        // TODO: Implement YouTube export using YouTubeService
        return 'https://youtube.com/playlist?list=id';
      default:
        throw new Error('Unsupported platform');
    }
  }

  /**
   * Create a copy of a playlist
   */
  async copyPlaylist(playlistId: string, userId: string): Promise<string> {
    // Start a Supabase transaction
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the original playlist with songs
    const { data: originalPlaylist, error: fetchError } = await supabase
      .from('playlists')
      .select('*, songs(*)')
      .eq('id', playlistId)
      .single() as { data: PlaylistWithSongs | null; error: Error | null };

    if (fetchError) throw fetchError;
    if (!originalPlaylist) throw new Error('Playlist not found');

    // Create new playlist
    const { data: newPlaylist, error: createError } = await supabase
      .from('playlists')
      .insert({
        name: `Copy of ${originalPlaylist.name}`,
        description: originalPlaylist.description,
        user_id: userId,
        is_public: false,
      })
      .select()
      .single();

    if (createError) throw createError;
    if (!newPlaylist) throw new Error('Failed to create new playlist');

    // Copy songs to new playlist
    const songsToInsert = originalPlaylist.songs.map(song => ({
      ...song,
      id: undefined, // Let Supabase generate new IDs
      playlist_id: newPlaylist.id,
      created_at: new Date().toISOString(),
    }));

    const { error: copyError } = await supabase
      .from('songs')
      .insert(songsToInsert);

    if (copyError) throw copyError;

    return newPlaylist.id;
  }
} 