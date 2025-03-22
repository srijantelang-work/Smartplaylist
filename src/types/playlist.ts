export interface PlaylistGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  /** @deprecated Kept for backward compatibility but not currently used */
  allowExplicit?: boolean;
  /** @deprecated Kept for backward compatibility but not currently used */
  familiarityBias?: number;
}

export interface SongSuggestion {
  title: string;
  artist: string;
  album?: string;
  year?: number;
  bpm?: number;
  duration?: number;
} 