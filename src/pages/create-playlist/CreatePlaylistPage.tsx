import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaylistForm } from './PlaylistForm';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { MoodType } from '../../types/database';
import { playlistService } from '../../services/playlistService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PlaylistFormData) => {
    if (!user) {
      setError('You must be logged in to create a playlist');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ step: 'Creating playlist...', percent: 10 });

    try {
      // Verify authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please log in again to continue');
      }

      // First create the playlist
      setProgress({ step: 'Initializing playlist...', percent: 20 });
      const playlist = await playlistService.createPlaylist({
        name: `Generated Playlist: ${data.prompt.slice(0, 50)}...`,
        description: data.prompt,
        prompt: data.prompt,
        mood: data.mood,
        is_public: data.isPublic
      }).catch(error => {
        if (error.message.includes('authentication')) {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw error;
      });

      if (!playlist || !playlist.id) {
        throw new Error('Failed to create playlist');
      }

      // Generate songs with diversity options
      setProgress({ step: 'Generating songs...', percent: 40 });
      const generatedSongs = await playlistService.generatePlaylist(
        {
          prompt: data.prompt,
          mood: data.mood || undefined,
          songCount: data.songCount,
        },
        // Add diversity options to ensure a better mix of artists
        {
          maxSongsPerArtist: 2,
          minUniqueArtists: Math.max(5, Math.floor(data.songCount / 3))
        }
      ).catch(error => {
        if (error.message.includes('authentication') || error.message.includes('authorization')) {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw error;
      });

      // Parse the generated songs JSON
      setProgress({ step: 'Processing songs...', percent: 70 });
      const songs = JSON.parse(generatedSongs);
      
      // Add each song to the playlist
      setProgress({ step: 'Adding songs to playlist...', percent: 85 });
      const addSongPromises = songs.map((song: {
        title: string;
        artist: string;
        album: string;
        duration: number;
        year: number;
        bpm: number;
        key?: string;
      }) => 
        playlistService.addSongToPlaylist(playlist.id, {
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          year: song.year,
          bpm: song.bpm,
          key: song.key
        }).catch(error => {
          if (error.message.includes('authentication')) {
            throw new Error('Your session has expired. Please log in again.');
          }
          throw error;
        })
      );

      await Promise.all(addSongPromises);
      setProgress({ step: 'Finalizing...', percent: 95 });

      // Navigate to the result page
      navigate(`/playlist-result/${playlist.id}`);
    } catch (err) {
      console.error('Error creating playlist:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create playlist';
      
      if (errorMessage.includes('session') || errorMessage.includes('log in')) {
        // Handle authentication errors
        setError(`${errorMessage} Please try logging in again.`);
        // Optionally redirect to login page
        navigate('/login', { state: { returnTo: '/create-playlist' } });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setProgress(null);
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
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              {progress && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{progress.step}</span>
                    <span className="text-sm font-medium">{progress.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
              <PlaylistForm
                initialData={initialFormData}
                onSubmit={handleSubmit}
                loading={loading}
              />
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