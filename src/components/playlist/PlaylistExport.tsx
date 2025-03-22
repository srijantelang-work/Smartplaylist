import  { useState } from 'react';
import { PlaylistExportService, type ExportPlatform } from '../../services/playlistExportService';

interface PlaylistExportProps {
  playlistId: string;
  className?: string;
  onExportComplete?: (result: { success: boolean; url?: string }) => void;
}

export function PlaylistExport({ playlistId, className = '', onExportComplete }: PlaylistExportProps) {
  const [platform, setPlatform] = useState<ExportPlatform>('spotify');
  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const exportService = PlaylistExportService.getInstance();
      const result = await exportService.exportPlaylist(
        playlistId,
        platform,
        {
          isPublic,
          includeDescription: true,
          description: description || undefined
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
        <h3 className="text-xl font-semibold">Export Playlist</h3>
        
        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Export to Platform
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPlatform('spotify')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                platform === 'spotify'
                  ? 'bg-[#1DB954] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Spotify
            </button>
            <button
              type="button"
              onClick={() => setPlatform('youtube')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                platform === 'youtube'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </button>
          </div>
        </div>

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

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description to your exported playlist..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
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
              : platform === 'spotify'
              ? 'bg-[#1DB954] text-white hover:bg-[#1ed760]'
              : 'bg-red-600 text-white hover:bg-red-700'
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
            `Export to ${platform === 'spotify' ? 'Spotify' : 'YouTube'}`
          )}
        </button>
      </div>
    </div>
  );
} 