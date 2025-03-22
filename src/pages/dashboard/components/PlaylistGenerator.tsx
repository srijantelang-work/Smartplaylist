interface PlaylistGeneratorProps {
  onCreatePlaylist: () => void;
}

export function PlaylistGenerator({ onCreatePlaylist }: PlaylistGeneratorProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Create New Playlist</h2>
      <div className="text-[#E8E8E8] mb-6">
        Get started with a new AI-generated playlist based on your preferences.
      </div>
      <button
        onClick={onCreatePlaylist}
        className="w-full bg-[#1DB954] text-white py-3 rounded-full font-semibold hover:bg-opacity-90 transition flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Create New Playlist</span>
      </button>
    </div>
  );
} 