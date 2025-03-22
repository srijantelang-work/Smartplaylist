import { supabase } from '../lib/supabase';
import { AnalyticsService } from './analyticsService';

interface CollaborationInvite {
  id: string;
  playlist_id: string;
  inviter_id: string;
  invitee_email: string;
  role: CollaboratorRole;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
}

interface Collaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  role: CollaboratorRole;
  joined_at: string;
}

type CollaboratorRole = 'editor' | 'viewer';
type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

interface ShareSettings {
  is_public: boolean;
  allow_comments: boolean;
  allow_duplication: boolean;
  require_approval: boolean;
  expiry_date?: string;
}

export class CollaborationService {
  private static instance: CollaborationService;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Invite a user to collaborate on a playlist
   */
  async inviteCollaborator(
    playlistId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: CollaboratorRole = 'editor'
  ): Promise<CollaborationInvite> {
    try {
      // Check if user has permission to invite
      const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single();

      if (!playlist || playlist.user_id !== inviterUserId) {
        throw new Error('You do not have permission to invite collaborators');
      }

      // Create invitation
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Expire in 7 days

      const { data: invite, error } = await supabase
        .from('collaboration_invites')
        .insert([{
          playlist_id: playlistId,
          inviter_id: inviterUserId,
          invitee_email: inviteeEmail,
          role,
          status: 'pending',
          expires_at: expiryDate.toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Track the invite event
      await this.analyticsService.trackEvent({
        event_type: 'collaboration_invite_sent',
        user_id: inviterUserId,
        playlist_id: playlistId,
        metadata: { invitee_email: inviteeEmail, role }
      });

      return invite;
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      throw error;
    }
  }

  /**
   * Accept a collaboration invitation
   */
  async acceptInvitation(inviteId: string, userId: string): Promise<void> {
    try {
      // Get and validate the invitation
      const { data: invite } = await supabase
        .from('collaboration_invites')
        .select('*, users!invitee_email(id)')
        .eq('id', inviteId)
        .single();

      if (!invite) throw new Error('Invitation not found');
      if (invite.status !== 'pending') throw new Error('Invitation is no longer valid');
      if (new Date(invite.expires_at) < new Date()) throw new Error('Invitation has expired');

      // Start a transaction
      const { error: transactionError } = await supabase.rpc('accept_collaboration_invite', {
        p_invite_id: inviteId,
        p_user_id: userId
      });

      if (transactionError) throw transactionError;

      // Track the acceptance
      await this.analyticsService.trackEvent({
        event_type: 'collaboration_invite_accepted',
        user_id: userId,
        playlist_id: invite.playlist_id
      });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaboratorRole(
    playlistId: string,
    ownerUserId: string,
    collaboratorUserId: string,
    newRole: CollaboratorRole
  ): Promise<void> {
    try {
      // Verify ownership
      const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single();

      if (!playlist || playlist.user_id !== ownerUserId) {
        throw new Error('You do not have permission to modify collaborator roles');
      }

      // Update role
      const { error } = await supabase
        .from('collaborators')
        .update({ role: newRole })
        .eq('playlist_id', playlistId)
        .eq('user_id', collaboratorUserId);

      if (error) throw error;

      // Track the role update
      await this.analyticsService.trackEvent({
        event_type: 'collaborator_role_updated',
        user_id: ownerUserId,
        playlist_id: playlistId,
        metadata: { collaborator_id: collaboratorUserId, new_role: newRole }
      });
    } catch (error) {
      console.error('Failed to update collaborator role:', error);
      throw error;
    }
  }

  /**
   * Remove a collaborator from a playlist
   */
  async removeCollaborator(
    playlistId: string,
    ownerUserId: string,
    collaboratorUserId: string
  ): Promise<void> {
    try {
      // Verify ownership
      const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single();

      if (!playlist || playlist.user_id !== ownerUserId) {
        throw new Error('You do not have permission to remove collaborators');
      }

      // Remove collaborator
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('user_id', collaboratorUserId);

      if (error) throw error;

      // Track the removal
      await this.analyticsService.trackEvent({
        event_type: 'collaborator_removed',
        user_id: ownerUserId,
        playlist_id: playlistId,
        metadata: { removed_user_id: collaboratorUserId }
      });
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      throw error;
    }
  }

  /**
   * Update playlist sharing settings
   */
  async updateSharingSettings(
    playlistId: string,
    ownerUserId: string,
    settings: Partial<ShareSettings>
  ): Promise<void> {
    try {
      // Verify ownership
      const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id, share_settings')
        .eq('id', playlistId)
        .single();

      if (!playlist || playlist.user_id !== ownerUserId) {
        throw new Error('You do not have permission to modify sharing settings');
      }

      // Update settings
      const { error } = await supabase
        .from('playlists')
        .update({
          share_settings: {
            ...playlist.share_settings,
            ...settings
          }
        })
        .eq('id', playlistId);

      if (error) throw error;

      // Track the settings update
      await this.analyticsService.trackEvent({
        event_type: 'sharing_settings_updated',
        user_id: ownerUserId,
        playlist_id: playlistId,
        metadata: settings
      });
    } catch (error) {
      console.error('Failed to update sharing settings:', error);
      throw error;
    }
  }

  /**
   * Get playlist collaborators
   */
  async getCollaborators(playlistId: string): Promise<Collaborator[]> {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*, users(full_name, avatar_url)')
        .eq('playlist_id', playlistId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get collaborators:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a playlist
   */
  async checkAccess(playlistId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is owner or collaborator
      const { data: access, error } = await supabase.rpc('check_playlist_access', {
        p_playlist_id: playlistId,
        p_user_id: userId
      });

      if (error) throw error;
      return access;
    } catch (error) {
      console.error('Failed to check playlist access:', error);
      return false;
    }
  }
} 