import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Playlist, Song } from '../../../types/database';
import { playlistService } from '../../../services/playlistService';

interface PlaylistHeaderProps {
  playlist: Playlist & { songs: Song[] };
  onExportClick: () => void;
}

export function PlaylistHeader({ playlist, onExportClick }: PlaylistHeaderProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await playlistService.deletePlaylist(playlist.id);
      navigate('/playlists');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-card p-8 rounded-2xl depth-3 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Playlist Info */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text tracking-wider animate-slide-in">
            {playlist.name}
          </h1>
          <div className="flex items-center space-x-4 text-gray-300 font-light tracking-wide">
            <span className="text-lg">{playlist.songs.length} songs</span>
            <span className="text-gray-500">•</span>
            <span className="text-lg">{Math.round(playlist.total_duration / 60)} minutes</span>
          </div>
          {playlist.description && (
            <p className="text-gray-300 font-light tracking-wide max-w-2xl">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl text-base font-medium transition-all duration-300 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onExportClick}
            className="flex items-center space-x-2 px-6 py-3 bg-[var(--primary-color)] text-white rounded-xl text-base font-medium transition-all duration-300 hover-lift ripple depth-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            <span>Export</span>
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center space-x-2 px-6 py-3 glass-dark text-gray-300 rounded-xl text-base font-medium transition-all duration-300 hover-lift ripple"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-dark rounded-xl shadow-lg py-2 z-10 depth-2">
                <button
                  className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowShareMenu(false);
                  }}
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 