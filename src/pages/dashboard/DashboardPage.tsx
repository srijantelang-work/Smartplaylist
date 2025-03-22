import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { PlaylistGenerator } from './components/PlaylistGenerator';
import { UserStats } from './components/UserStats';
import { ActivityFeed } from './components/ActivityFeed';
import { QuickActions } from './components/QuickActions';
import { Recommendations } from './components/Recommendations';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import type { UserStats as UserStatsType } from '../../types/database';

// Mapper function to transform database type to component type
function mapUserStatsToData(stats: UserStatsType) {
  return {
    totalPlaylists: stats.total_playlists,
    totalSongs: stats.total_songs,
    favoriteGenres: stats.favorite_genres,
    totalDuration: stats.total_duration,
    lastActive: stats.last_active,
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      try {
        const userStats = await userService.getUserStats(user.id);
        setStats(userStats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const handleCreatePlaylist = () => {
    navigate('/create-playlist');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.user_metadata.full_name || 'User'}
            </h1>
            <p className="text-[#E8E8E8]">
              Create AI-powered playlists and manage your music
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Playlist Generator */}
              <div className="bg-[#323232] rounded-lg p-6">
                <PlaylistGenerator onCreatePlaylist={handleCreatePlaylist} />
              </div>

              {/* User Statistics */}
              <div className="bg-[#323232] rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Your Statistics</h2>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-[#000000] rounded w-1/4"></div>
                    <div className="h-32 bg-[#000000] rounded"></div>
                  </div>
                ) : (
                  <UserStats stats={stats ? mapUserStatsToData(stats) : null} />
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-[#323232] rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <ActivityFeed userId={user?.id} />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-[#323232] rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <QuickActions onCreatePlaylist={handleCreatePlaylist} />
              </div>

              {/* Recommendations */}
              <div className="bg-[#323232] rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
                <Recommendations userId={user?.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 