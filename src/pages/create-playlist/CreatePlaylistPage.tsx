import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaylistForm } from './PlaylistForm';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { MoodType } from '../../types/database';
import { playlistService } from '../../services/playlistService';
import { useAuth } from '../../contexts/AuthContext';

interface PlaylistFormData {
  prompt: string;
  songCount: number;
  mood: MoodType | null;
  genres: string[];
  isPublic: boolean;
}

const initialFormData: PlaylistFormData = {
  prompt: '',
  songCount: 20,
  mood: 'chill',
  genres: [],
  isPublic: false,
};

export function CreatePlaylistPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PlaylistFormData) => {
    if (!user) {
      setError('You must be logged in to create a playlist');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First create the playlist
      const playlist = await playlistService.createPlaylist({
        name: `Generated Playlist: ${data.prompt.slice(0, 50)}...`,
        description: data.prompt,
        prompt: data.prompt,
        mood: data.mood,
        is_public: data.isPublic
      });

      if (!playlist || !playlist.id) {
        throw new Error('Failed to create playlist');
      }

      // Generate songs with diversity options
      const generatedSongs = await playlistService.generatePlaylist(
        {
          prompt: data.prompt,
          mood: data.mood || undefined,
          songCount: data.songCount,
        },
        // Add diversity options to ensure a better mix of artists
        {
          maxSongsPerArtist: 2,  // Maximum 2 songs per artist
          minUniqueArtists: Math.max(5, Math.floor(data.songCount / 3)) // At least 1/3 of playlist as unique artists
        }
      );

      // Parse the generated songs JSON
      const songs = JSON.parse(generatedSongs);
      
      // Add each song to the playlist
      for (const song of songs) {
        await playlistService.addSongToPlaylist(playlist.id, {
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          year: song.year,
          bpm: song.bpm,
          key: song.key
        });
      }

      // Navigate to the result page
      navigate(`/playlist-result/${playlist.id}`);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen animated-gradient particles relative overflow-hidden">
        {/* Animated background overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        
        {/* Main content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-12">
          <div className="space-y-12 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-6">
              <h1 className="text-6xl font-extralight gradient-text tracking-wider animate-slide-in">
                What music inspires you?
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto font-extralight tracking-wider animate-slide-in" style={{ animationDelay: '0.2s' }}>
                Create personalized playlists with AI-powered music recommendations.
              </p>
            </div>

            {/* Main Form Section */}
            <div className="glass-card depth-3 p-8 rounded-2xl card-hover transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <PlaylistForm
                initialData={initialFormData}
                onSubmit={handleSubmit}
                loading={loading}
              />
              {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 glass-dark animate-fade-in">
                  <div className="font-extralight tracking-wider">
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="glass-card p-8 rounded-xl text-center space-y-4 max-w-md mx-auto animate-scale">
                  <div className="loading-pulse inline-block">
                    <div className="w-16 h-16 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-light text-gray-200">Creating your perfect playlist...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 