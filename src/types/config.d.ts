declare interface ImportMetaEnv {
  // Application
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;

  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Groq
  readonly VITE_GROQ_API_KEY: string;

  // Feature Flags
  readonly VITE_ENABLE_SPOTIFY_INTEGRATION: string;
  readonly VITE_ENABLE_YOUTUBE_INTEGRATION: string;

  // API Rate Limits
  readonly VITE_GROQ_RATE_LIMIT: string;
  readonly VITE_SPOTIFY_RATE_LIMIT: string;

  // Cache Configuration
  readonly VITE_PLAYLIST_CACHE_DURATION: string;
  readonly VITE_USER_PREFERENCES_CACHE_DURATION: string;

  // Development Settings
  readonly VITE_ENABLE_DEBUG_LOGGING?: string;
  readonly VITE_MOCK_EXTERNAL_APIS?: string;

  // Production Settings
  readonly VITE_ENABLE_ERROR_REPORTING?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 