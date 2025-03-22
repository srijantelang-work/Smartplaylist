import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Playlist } from '../../../types/database';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Implement export functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#323232] rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition-transform">
      {/* Playlist Cover */}
      <div className="relative aspect-square bg-black">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#000000]">
            <svg className="w-12 h-12 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <Link
          to={`/playlist/${playlist.id}`}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </Link>
      </div>

      {/* Playlist Info */}
      <div className="p-4">
        <Link to={`/playlist/${playlist.id}`} className="block">
          <h3 className="font-bold text-white truncate hover:text-[#1DB954] transition-colors">
            {playlist.name}
          </h3>
        </Link>
        
        <div className="mt-1 text-sm text-[#E8E8E8] space-y-1">
          <div className="flex items-center justify-between">
            <span>{playlist.song_count} songs</span>
            <span>{formatDuration(playlist.total_duration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {playlist.mood && (
              <span className="px-2 py-0.5 bg-black rounded-full text-xs">
                {playlist.mood}
              </span>
            )}
            <span className="text-xs">
              {formatDate(playlist.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-between">
          <Link
            to={`/playlist/${playlist.id}`}
            className="px-3 py-1 bg-[#1DB954] text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition"
          >
            View
          </Link>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-3 py-1 border border-[#E8E8E8] text-white rounded-full text-sm font-medium hover:bg-[#E8E8E8] hover:text-black transition disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
} 