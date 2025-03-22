import { useEffect, useRef, useCallback } from 'react';
import { PlaylistCard } from './PlaylistCard';
import type { Playlist } from '../../../types/database';

interface PlaylistGridProps {
  playlists: Playlist[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function PlaylistGrid({ playlists, loading, hasMore, onLoadMore }: PlaylistGridProps) {
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPlaylistRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, onLoadMore]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  if (playlists.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <p className="text-[#E8E8E8] text-lg">No playlists found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {playlists.map((playlist, index) => (
        <div
          key={playlist.id}
          ref={index === playlists.length - 1 ? lastPlaylistRef : undefined}
        >
          <PlaylistCard playlist={playlist} />
        </div>
      ))}
      {loading && (
        <div className="col-span-full flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#1DB954] border-r-2"></div>
        </div>
      )}
    </div>
  );
} 