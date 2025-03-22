import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playlistService } from '../../../services/playlistService';
import type { Playlist } from '../../../types/database';

interface RecommendationsProps {
  userId: string | undefined;
}

export function Recommendations({ userId }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) return;
      try {
        // In a real app, this would call a recommendations service
        const playlists = await playlistService.getUserPlaylists(userId);
        setRecommendations(playlists.slice(0, 3));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-[#000000] rounded"></div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-4 text-[#E8E8E8]">
        No recommendations available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((playlist) => (
        <Link
          key={playlist.id}
          to={`/playlist/${playlist.id}`}
          className="block bg-black hover:bg-[#000000] rounded-lg p-4 transition"
        >
          <div className="flex items-center space-x-4">
            {/* Playlist Cover */}
            <div className="w-12 h-12 bg-[#323232] rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>

            {/* Playlist Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{playlist.name}</div>
              <div className="text-sm text-[#E8E8E8] truncate">
                {playlist.song_count} songs • {Math.round(playlist.total_duration / 60)} min
              </div>
            </div>

            {/* Play Button */}
            <button className="p-2 text-[#1DB954] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
} 