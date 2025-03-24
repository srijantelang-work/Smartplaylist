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

      try {
        // Parse the generated songs and add them to the playlist
        const songs = JSON.parse(generatedSongs);
        
        if (!Array.isArray(songs)) {
          throw new Error('Generated songs must be an array');
        }
        
        // Process each song, sanitizing data to prevent errors
        for (const songData of songs) {
          // Ensure the song has required fields
          if (!songData.title || !songData.artist) {
            console.warn('Skipping song with missing required fields:', songData);
            continue;
          }
          
          // Normalize the song data to prevent unexpected fields
          const sanitizedSong = {
            title: String(songData.title).trim(),
            artist: String(songData.artist).trim(),
            album: songData.album ? String(songData.album).trim() : null,
            duration: songData.duration ? Number(songData.duration) : undefined,
            year: songData.year ? Number(songData.year) : null,
            bpm: songData.bpm ? Number(songData.bpm) : null,
            key: songData.key ? String(songData.key).trim() : null,
            genre: songData.genre ? String(songData.genre).trim() : undefined
          };
          
          // Add the sanitized song to the playlist
          await playlistService.addSongToPlaylist(playlist.id, sanitizedSong);
        }
      } catch (parseError) {
        console.error('Error parsing or processing generated songs:', parseError);
        throw new Error('Failed to process generated songs. Please try again.');
      }

      navigate(`/playlist-result/${playlist.id}`);
    } catch (err) {
      console.error('Error generating playlist:', err);
      setError(
        err instanceof Error 
          ? err.message
          : 'Failed to generate playlist. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-[var(--dark-bg)] via-[var(--dark-surface)] to-[var(--dark-bg)]">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-6">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                What music inspires you?
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Create personalized playlists with AI-powered music recommendations.
              </p>
            </div>

            {/* Main Form Section */}
            <div className="card backdrop-blur-sm bg-[var(--dark-card)]/90 p-8 rounded-2xl border border-[var(--dark-accent)]/10">
              <PlaylistForm
                initialData={initialFormData}
                onSubmit={handleSubmit}
                loading={loading}
              />
              {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 backdrop-blur-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[var(--dark-accent)] rounded-full animate-spin">
                      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-[var(--primary-color)] rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-xl font-medium text-gray-200">Crafting your perfect playlist...</p>
                  <p className="text-sm text-gray-400">This might take a moment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 