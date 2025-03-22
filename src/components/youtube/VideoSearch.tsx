import { useState, useCallback } from 'react';
import { YouTubeService } from '../../services/youtubeService';
import { SearchBar } from '../../pages/playlists/components/SearchBar';

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
}

interface VideoSearchProps {
  onVideoSelect?: (video: YouTubeVideo) => void;
  selectedVideos?: Set<string>;
}

export function VideoSearch({ onVideoSelect, selectedVideos = new Set() }: VideoSearchProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setVideos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const youtubeService = YouTubeService.getInstance();
      const results = await youtubeService.searchVideos(query);
      setVideos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search videos');
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <SearchBar
        onSearch={handleSearch}
        isLoading={isLoading}
        error={error || ''}
        className="w-full"
      />

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => onVideoSelect?.(video)}
            className={`group relative aspect-video rounded-lg overflow-hidden transition-transform hover:scale-105 ${
              selectedVideos.has(video.id)
                ? 'ring-2 ring-[#1DB954]'
                : 'hover:ring-2 hover:ring-white/50'
            }`}
          >
            {/* Thumbnail */}
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-full h-full object-cover"
            />

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-sm rounded">
              {YouTubeService.formatDuration(video.contentDetails.duration)}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
              <div>
                <h3 className="text-white font-medium line-clamp-2 text-left">
                  {video.snippet.title}
                </h3>
                <p className="text-[#E8E8E8] text-sm mt-1 text-left">
                  {video.snippet.channelTitle}
                </p>
              </div>

              {selectedVideos.has(video.id) ? (
                <div className="flex items-center text-[#1DB954]">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selected
                </div>
              ) : (
                <div className="text-white">Click to select</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {!isLoading && videos.length === 0 && (
        <div className="text-center py-8 text-[#E8E8E8]">
          {error ? 'No results found' : 'Search for YouTube videos to add to your playlist'}
        </div>
      )}
    </div>
  );
} 