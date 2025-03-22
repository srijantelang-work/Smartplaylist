import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  className?: string;
  autoplay?: boolean;
  onEnd?: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          events: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export function VideoPlayer({
  videoId,
  className = '',
  autoplay = false,
  onEnd,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerId = `youtube-player-${videoId}`;

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (!playerRef.current) return;
      playerRef.current.id = playerId;

      new window.YT.Player(playerId, {
        videoId,
        events: {
          onStateChange: (event) => {
            // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            if (event.data === 0 && onEnd) {
              onEnd();
            }
          },
        },
      });
    };

    if (window.YT) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId, onEnd, playerId]);

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
      <div
        ref={playerRef}
        className="absolute inset-0 w-full h-full"
        data-autoplay={autoplay ? '1' : '0'}
      />
    </div>
  );
} 