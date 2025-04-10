import { useState, useEffect } from 'react';
import { SpotifyService } from '../../services/spotifyService';
import { PlaylistExportService } from '../../services/playlistExportService';
import { useAuth } from '../../contexts/AuthContext';

interface PlaylistExportProps {
  playlistId: string;
  className?: string;
  onExportComplete?: (result: { success: boolean; url?: string }) => void;
}

export function PlaylistExport({ playlistId, className = '', onExportComplete }: PlaylistExportProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check URL parameters for export status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exportStatus = params.get('export');
    const exportUrl = params.get('url');

    if (exportStatus === 'success' && exportUrl) {
      onExportComplete?.({ success: true, url: exportUrl });
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [onExportComplete]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      // Initialize Spotify service
      const spotifyService = SpotifyService.getInstance();

      // Check if user has Spotify tokens
      const hasSpotifyTokens = user?.user_metadata?.spotify_tokens;

      if (!hasSpotifyTokens) {
        // Store current path and playlist details before redirecting
        const exportDetails = {
          playlistId,
          isPublic,
          description: undefined,
          returnPath: `/playlist/${playlistId}`,
          state: crypto.randomUUID()
        };

        // Store export state in sessionStorage
        sessionStorage.setItem('playlist_export_state', JSON.stringify({
          isExporting: true,
          playlistId,
          isPublic
        }));

        // Start Spotify authorization process
        await spotifyService.authorize(exportDetails);
        return; // Return early as we're redirecting
      }

      // User is already connected to Spotify, proceed with export
      const exportService = PlaylistExportService.getInstance();
      const result = await exportService.exportPlaylist(
        playlistId,
        'spotify',
        {
          isPublic,
          includeDescription: true
        }
      );

      if (result.success) {
        onExportComplete?.({ success: true, url: result.url });
      } else {
        throw new Error(result.error || 'Failed to export playlist');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start export');
      onExportComplete?.({ success: false });
    } finally {
      setIsExporting(false);
      // Clean up export state
      sessionStorage.removeItem('playlist_export_state');
    }
  };

  // Restore export state if returning from OAuth flow
  useEffect(() => {
    const storedState = sessionStorage.getItem('playlist_export_state');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        if (state.playlistId === playlistId) {
          setIsExporting(state.isExporting);
          setIsPublic(state.isPublic);
        }
      } catch (e) {
        console.error('Failed to parse stored export state:', e);
      }
    }
  }, [playlistId]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        {/* Privacy Setting */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Privacy Setting
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              disabled={isExporting}
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Make playlist public
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium ${
            isExporting
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[#1DB954] text-white hover:bg-[#1ed760] transition-colors'
          }`}
        >
          {isExporting ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Connecting to Spotify...
            </div>
          ) : (
            <>
              {/* Spotify Logo */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Export to Spotify
            </>
          )}
        </button>
      </div>
    </div>
  );
} 