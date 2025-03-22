import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playlistService } from '../../../services/playlistService';
import type { Playlist } from '../../../types/database';

interface ActivityFeedProps {
  userId: string | undefined;
}

type Activity = {
  id: string;
  type: 'create' | 'export' | 'share';
  playlist: Playlist;
  timestamp: string;
};

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      try {
        const userPlaylists = await playlistService.getUserPlaylists(userId);
        // Transform playlists into activities (simplified for demo)
        const recentActivities = userPlaylists.slice(0, 5).map(playlist => ({
          id: playlist.id,
          type: 'create' as const,
          playlist,
          timestamp: playlist.created_at,
        }));
        setActivities(recentActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-[#000000] rounded"></div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-[#E8E8E8]">
        No recent activity to show
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Link
          key={activity.id}
          to={`/playlist/${activity.playlist.id}`}
          className="block bg-black hover:bg-[#000000] rounded-lg p-4 transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{activity.playlist.name}</div>
              <div className="text-sm text-[#E8E8E8]">
                {activity.type === 'create' && 'Created new playlist'}
                {activity.type === 'export' && 'Exported to Spotify'}
                {activity.type === 'share' && 'Shared playlist'}
              </div>
            </div>
            <div className="text-sm text-[#E8E8E8]">
              {new Date(activity.timestamp).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 