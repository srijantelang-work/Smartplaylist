import { useState } from 'react';
import type { Playlist, Song } from '../../../types/database';

interface PlaylistHeaderProps {
  playlist: Playlist & { songs: Song[] };
  onExportClick: () => void;
}

export function PlaylistHeader({ playlist, onExportClick }: PlaylistHeaderProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  return (
    <div className="bg-[#323232] rounded-lg p-6">
      <div className="flex items-start justify-between">
        {/* Playlist Info */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
          <div className="flex items-center space-x-4 text-[#E8E8E8]">
            <span>{playlist.songs.length} songs</span>
            <span>•</span>
            <span>{Math.round(playlist.total_duration / 60)} minutes</span>
          </div>
          {playlist.description && (
            <p className="mt-4 text-[#E8E8E8]">{playlist.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Export Button */}
          <button
            onClick={onExportClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1DB954] text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            <span>Export</span>
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#E8E8E8] text-white rounded-full text-sm font-medium hover:bg-[#323232] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#323232] rounded-lg shadow-lg py-1 z-10">
                <button
                  className="w-full px-4 py-2 text-left text-[#E8E8E8] hover:bg-[#404040] transition"
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