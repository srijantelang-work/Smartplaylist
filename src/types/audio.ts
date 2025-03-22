export interface AudioAnalysis {
  bpm: number;
  key: string;
  mode: number; // 0 for minor, 1 for major
  danceability: number;
  energy: number;
  acousticness: number;
  instrumentalness: number;
  valence: number;
}

export interface AudioFeatures extends AudioAnalysis {
  confidence?: {
    bpm: number;
    key: number;
    mode: number;
  };
} 