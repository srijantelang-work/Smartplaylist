import { useState, useEffect } from 'react';
import { PlaylistExportService } from '../../services/playlistExportService';
import { SpotifyService } from '../../services/spotifyService';
import { supabase } from '../../lib/supabase';

interface PlaylistExportProps {
  playlistId: string;
  className?: string;
  onExportComplete?: (result: { success: boolean; url?: string }) => void;
}

export function PlaylistExport({ playlistId, className = '', onExportComplete }: PlaylistExportProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState<boolean>(false);

  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsSpotifyConnected(!!user?.user_metadata?.spotify_tokens);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (!isSpotifyConnected) {
        // Initiate Spotify connection if not connected
        const spotifyService = SpotifyService.getInstance();
        await spotifyService.authorize({
          playlistId,
          isPublic,
         
        });
        return; // The auth flow will redirect to callback
      }

      const exportService = PlaylistExportService.getInstance();
      const result = await exportService.exportPlaylist(
        playlistId,
        'spotify',
        {
          isPublic,
          includeDescription: true,
    
        }
      );

      if (result.success) {
        onExportComplete?.({
          success: true,
          url: result.url
        });
      } else {
        setError(result.error || 'Export failed');
        onExportComplete?.({ success: false });
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      onExportComplete?.({ success: false });
    } finally {
      setIsExporting(false);
    }
  };

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
          className={`w-full py-2 px-4 rounded-lg font-medium ${
            isExporting
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[#1DB954] text-white hover:bg-[#1ed760]'
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
              Exporting...
            </div>
          ) : (
            'Export to Spotify'
          )}
        </button>
      </div>
    </div>
  );
} 