import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PlaylistHeader } from './components/PlaylistHeader';
import { PlaylistTable } from './components/PlaylistTable';
import { PlaylistExport } from '../../components/playlist/PlaylistExport';
import type { Playlist, Song, Track } from '../../types/database';

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
  tracks: Track[];
}

export function PlaylistResultPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform songs to tracks format
  const transformSongsToTracks = (songs: Song[]): Track[] => {
    return songs.map(song => ({
      id: song.id,
      name: song.title,
      artists: [song.artist], // Convert single artist to array format
      album: song.album || '',
      duration_ms: song.duration * 1000, // Convert seconds to milliseconds
      preview_url: song.preview_url,
      spotify_id: song.spotify_id
    }));
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        if (!id) return;

        const { data: playlist, error } = await supabase
          .from('playlists')
          .select('*, songs(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!playlist) throw new Error('Playlist not found');

        // Transform the songs to tracks format
        const playlistWithTracks: PlaylistWithSongs = {
          ...playlist,
          songs: playlist.songs,
          tracks: transformSongsToTracks(playlist.songs)
        };

        setPlaylist(playlistWithTracks);
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  const handleExportComplete = (result: { success: boolean; url?: string }) => {
    if (result.success && result.url) {
      setExportUrl(result.url);
    }
    setShowExport(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--dark-bg)] via-[var(--dark-surface)] to-[var(--dark-bg)] flex items-center justify-center">
        <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[var(--dark-accent)] rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-[var(--primary-color)] rounded-full"></div>
            </div>
          </div>
          <p className="text-xl font-medium text-gray-200">Loading your playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--dark-bg)] via-[var(--dark-surface)] to-[var(--dark-bg)] flex flex-col items-center justify-center p-4">
        <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Playlist</h2>
          <p className="text-gray-300">{error || 'Playlist not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient particles relative overflow-hidden pt-20">
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <PlaylistHeader
            playlist={playlist}
            onExportClick={() => setShowExport(true)}
          />

          {/* Export Success Message */}
          {exportUrl && (
            <div className="glass-card border-[var(--primary-color)]/20 p-4 rounded-xl flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--primary-color)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg text-gray-200">Playlist exported successfully!</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary-color)] hover:text-[var(--primary-color)]/80 font-medium transition-colors"
                >
                  View Playlist
                </a>
                <button
                  onClick={() => setExportUrl(null)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="glass-card rounded-2xl depth-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <PlaylistTable playlist={{ ...playlist, tracks: playlist.tracks }} />
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full depth-3 animate-scale">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light tracking-wider gradient-text">Export Playlist</h2>
              <button
                onClick={() => setShowExport(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PlaylistExport
              playlistId={playlist.id}
              onExportComplete={handleExportComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
} 