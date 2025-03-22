import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpotifyService } from '../../services/spotifyService';
import { TrackSearch } from '../../components/spotify/TrackSearch';
import { Spacing } from '../../components/layout/Spacing';
import { supabase } from '../../lib/supabase';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
}

export function CreatePlaylist() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<SpotifyTrack[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackSelect = (track: SpotifyTrack) => {
    setSelectedTracks(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      }
      return [...prev, track];
    });
  };

  const handleCreatePlaylist = async () => {
    if (!name.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    if (selectedTracks.length === 0) {
      setError('Please select at least one track');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const spotifyService = SpotifyService.getInstance();
      
      // Create the playlist
      const playlist = await spotifyService.createPlaylist(
        user.id,
        name,
        description,
        isPublic
      );

      // Add tracks to the playlist
      await spotifyService.addTracksToPlaylist(
        playlist.id,
        selectedTracks.map(track => `spotify:track:${track.id}`)
      );

      // Navigate to the playlist page
      navigate(`/playlists/${playlist.id}`);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Create New Playlist</h1>

        <Spacing size={6}>
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              className="w-full px-4 py-3 bg-[#323232] text-white rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#1DB954]
                placeholder-[#E8E8E8]"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Playlist description (optional)"
              rows={3}
              className="w-full px-4 py-3 bg-[#323232] text-white rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#1DB954]
                placeholder-[#E8E8E8] resize-none"
            />

            <label className="flex items-center space-x-2 text-[#E8E8E8]">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="form-checkbox h-5 w-5 text-[#1DB954] rounded
                  focus:ring-[#1DB954] focus:ring-offset-0 bg-[#323232]
                  border-transparent"
              />
              <span>Make playlist public</span>
            </label>
          </div>

          <div className="border-t border-[#323232] pt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add Tracks</h2>
            <TrackSearch
              onTrackSelect={handleTrackSelect}
              selectedTracks={new Set(selectedTracks.map(t => t.id))}
            />
          </div>

          {selectedTracks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Selected Tracks ({selectedTracks.length})
              </h3>
              <Spacing size={2}>
                {selectedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-4 bg-[#323232] rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={track.album.images[2]?.url || track.album.images[0]?.url}
                        alt={`${track.album.name} cover`}
                        className="w-10 h-10 rounded"
                      />
                      <div>
                        <p className="text-white font-medium">{track.name}</p>
                        <p className="text-[#E8E8E8] text-sm">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTrackSelect(track)}
                      className="text-[#E8E8E8] hover:text-white p-2
                        transition-colors duration-200"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </Spacing>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm" role="alert">
              {error}
            </div>
          )}

          <button
            onClick={handleCreatePlaylist}
            disabled={isLoading}
            className={`
              w-full py-4 rounded-lg font-medium
              transition-all duration-200
              ${
                isLoading
                  ? 'bg-[#1DB954] bg-opacity-50 cursor-not-allowed'
                  : 'bg-[#1DB954] hover:bg-opacity-90'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                <span>Creating playlist...</span>
              </div>
            ) : (
              'Create Playlist'
            )}
          </button>
        </Spacing>
      </div>
    </div>
  );
} 