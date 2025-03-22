import { Playlist, Song } from '../../types/database';

interface PlaylistPreviewProps {
  playlist: Playlist & { songs: Song[] };
}

export function PlaylistPreview({ playlist }: PlaylistPreviewProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Playlist Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{playlist.name}</h3>
        <p className="text-[#E8E8E8]">
          {playlist.song_count} songs • {Math.round(playlist.total_duration / 60)} minutes
        </p>
        {playlist.mood && (
          <span className="inline-block px-3 py-1 rounded-full bg-[#323232] text-[#E8E8E8] text-sm mt-2">
            {playlist.mood.charAt(0).toUpperCase() + playlist.mood.slice(1)}
          </span>
        )}
      </div>

      {/* Song List */}
      <div className="space-y-2">
        {playlist.songs.map((song, index) => (
          <div
            key={song.id}
            className="flex items-center p-3 hover:bg-[#323232] rounded-md transition-colors group"
          >
            <div className="w-8 text-[#E8E8E8] text-sm">{index + 1}</div>
            <div className="flex-grow min-w-0">
              <div className="text-white truncate">{song.title}</div>
              <div className="text-[#E8E8E8] text-sm truncate">
                {song.artist} • {song.album}
              </div>
            </div>
            <div className="text-[#E8E8E8] text-sm">
              {formatDuration(song.duration)}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button className="px-6 py-2 bg-[#1DB954] text-white rounded-full font-medium hover:bg-opacity-90 transition">
          Save to Spotify
        </button>
        <button className="px-6 py-2 border border-[#323232] text-white rounded-full font-medium hover:bg-[#323232] transition">
          Share
        </button>
      </div>
    </div>
  );
} 