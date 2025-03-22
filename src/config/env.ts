interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  groq: {
    apiKey: string;
    rateLimit: number;
  };
  app: {
    name: string;
    url: string;
    environment: 'development' | 'test' | 'production';
  };
  features: {
    spotifyIntegration: boolean;
    youtubeIntegration: boolean;
  };
  api: {
    spotifyRateLimit: number;
  };
  cache: {
    playlistDuration: number;
    userPreferencesDuration: number;
  };
  debug: {
    enableLogging: boolean;
    mockExternalApis: boolean;
  };
  production: {
    enableErrorReporting: boolean;
    enableAnalytics: boolean;
  };
}

function validateConfig(config: Partial<EnvironmentConfig>): asserts config is EnvironmentConfig {
  const { supabase, groq, app } = config;

  if (!supabase?.url || !supabase?.anonKey) {
    throw new Error('Missing required Supabase configuration');
  }

  if (!groq?.apiKey) {
    throw new Error('Missing required Groq configuration');
  }

  if (!app?.url) {
    throw new Error('Missing required application URL');
  }
}

function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsed = value ? parseInt(value, 10) : defaultValue;
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getConfig(): EnvironmentConfig {
  const config: Partial<EnvironmentConfig> = {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    groq: {
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      rateLimit: parseNumber(import.meta.env.VITE_GROQ_RATE_LIMIT, 60),
    },
    app: {
      name: import.meta.env.VITE_APP_NAME || 'SmartPlaylist',
      url: import.meta.env.VITE_APP_URL,
      environment: (import.meta.env.MODE as EnvironmentConfig['app']['environment']) || 'development',
    },
    features: {
      spotifyIntegration: parseBoolean(import.meta.env.VITE_ENABLE_SPOTIFY_INTEGRATION),
      youtubeIntegration: parseBoolean(import.meta.env.VITE_ENABLE_YOUTUBE_INTEGRATION),
    },
    api: {
      spotifyRateLimit: parseNumber(import.meta.env.VITE_SPOTIFY_RATE_LIMIT, 100),
    },
    cache: {
      playlistDuration: parseNumber(import.meta.env.VITE_PLAYLIST_CACHE_DURATION, 60),
      userPreferencesDuration: parseNumber(import.meta.env.VITE_USER_PREFERENCES_CACHE_DURATION, 1440),
    },
    debug: {
      enableLogging: parseBoolean(import.meta.env.VITE_ENABLE_DEBUG_LOGGING),
      mockExternalApis: parseBoolean(import.meta.env.VITE_MOCK_EXTERNAL_APIS),
    },
    production: {
      enableErrorReporting: parseBoolean(import.meta.env.VITE_ENABLE_ERROR_REPORTING),
      enableAnalytics: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS),
    },
  };

  validateConfig(config);
  return config;
}

export const config = getConfig(); 