import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PlaylistHeader } from './components/PlaylistHeader';
import { PlaylistTable } from './components/PlaylistTable';
import { PlaylistExport } from '../../components/playlist/PlaylistExport';
import type { Playlist, Song } from '../../types/database';

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export function PlaylistResultPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setPlaylist(playlist);
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
      <div className="min-h-screen bg-gradient-to-b from-[var(--dark-bg)] via-[var(--dark-surface)] to-[var(--dark-bg)] flex items-center justify-center">
        <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-200">{error || 'Playlist not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient particles">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particles-container animate-particles" aria-hidden="true">
          {/* Particle elements will be injected by the animation CSS */}
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10 animate-fade-in">
        <PlaylistHeader playlist={playlist} onExportClick={() => setShowExport(true)} />
        
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <PlaylistTable playlist={playlist} />
        </div>

        {showExport && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#282828] rounded-lg max-w-lg w-full p-6 animate-slide-up">
              <PlaylistExport
                playlistId={playlist.id}
                className="animate-fade-in"
                onExportComplete={handleExportComplete}
              />
            </div>
          </div>
        )}

        {exportUrl && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
            Playlist exported successfully!
          </div>
        )}
      </div>
    </div>
  );
} 