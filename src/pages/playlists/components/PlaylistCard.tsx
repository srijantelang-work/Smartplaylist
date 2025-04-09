import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Playlist } from '../../../types/database';
import { playlistService } from '../../../services/playlistService';

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: () => void;
}

export function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await playlistService.deletePlaylist(playlist.id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    } finally {
      setIsDeleting(false);
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
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
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
          
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete playlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 