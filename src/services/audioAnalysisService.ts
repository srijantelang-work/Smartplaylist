import { apiService } from './apiService';
import { supabase } from '../lib/supabase';
import type { Song } from '../types/database';

interface AudioFeatures {
  bpm: number;
  key: string;
  mode: number; // 0 for minor, 1 for major
  danceability: number;
  energy: number;
  acousticness: number;
  instrumentalness: number;
  valence: number;
}

interface BeatInfo {
  bpm: number;
  confidence: number;
  beats: Array<{
    start: number;
    duration: number;
    confidence: number;
  }>;
}

interface KeyInfo {
  key: string;
  mode: number;
  confidence: number;
}

interface PlaylistStats {
  totalDuration: number;
  averageBpm: number;
  bpmRange: { min: number; max: number };
  keyDistribution: Record<string, number>;
  genreDistribution: Record<string, number>;
  artistDiversity: number; // 0-1 score
  moodProfile: {
    energy: number;
    danceability: number;
    valence: number;
  };
}

interface FilterOptions {
  bpmRange?: { min: number; max: number };
  genres?: string[];
  excludedGenres?: string[];
  minArtistDiversity?: number;
  keys?: string[];
  moods?: string[];
  duration?: { min: number; max: number };
}

interface SongWithGenres extends Song {
  genres?: string[];
  energy?: number;
  danceability?: number;
  valence?: number;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export class AudioAnalysisService {
  private static instance: AudioAnalysisService;
  private readonly sampleRate = 44100;
  private readonly windowSize = 2048;

  private constructor() {}

  static getInstance(): AudioAnalysisService {
    if (!AudioAnalysisService.instance) {
      AudioAnalysisService.instance = new AudioAnalysisService();
    }
    return AudioAnalysisService.instance;
  }

  /**
   * Analyzes audio features using AI through the backend proxy
   */
  async analyzeAudio(audioUrl: string): Promise<AudioFeatures> {
    try {
      // Use backend proxy for AI analysis
      const response = await apiService.analyzeAudio(audioUrl);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('No analysis generated');
      }

      const initialAnalysis = response.data;

      // Refine BPM and key detection using signal processing
      const beatInfo = await this.detectBPM(audioUrl);
      const keyInfo = await this.detectKey(audioUrl);

      // Combine AI and signal processing results
      return {
        ...initialAnalysis,
        bpm: beatInfo.confidence > 0.8 ? beatInfo.bpm : initialAnalysis.bpm,
        key: keyInfo.confidence > 0.8 ? keyInfo.key : initialAnalysis.key,
        mode: keyInfo.confidence > 0.8 ? keyInfo.mode : initialAnalysis.mode,
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw error;
    }
  }

  /**
   * Detects BPM using onset detection and autocorrelation
   */
  private async detectBPM(audioUrl: string): Promise<BeatInfo> {
    try {
      // 1. Load and decode audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      // 2. Apply onset detection and autocorrelation
      if (audioData.length === 0) {
        throw new Error('No audio data available');
      }

      // Detect onsets in the audio signal
      const onsets = this.detectOnsets(audioData);
      if (onsets.length < 2) {
        throw new Error('Not enough beats detected');
      }

      // Calculate intervals between onsets
      const intervals = new Float32Array(onsets.length - 1);
      for (let i = 0; i < onsets.length - 1; i++) {
        intervals[i] = onsets[i + 1] - onsets[i];
      }

      // Use autocorrelation to find the dominant period
      const correlatedSignal = this.autocorrelate(intervals);
      
      // Find the highest correlation peak (excluding lag 0)
      let maxCorrelation = 0;
      let dominantPeriod = 0;
      for (let lag = 1; lag < correlatedSignal.length / 2; lag++) {
        if (correlatedSignal[lag] > maxCorrelation) {
          maxCorrelation = correlatedSignal[lag];
          dominantPeriod = lag;
        }
      }

      // Convert period to BPM
      const averageInterval = dominantPeriod / this.sampleRate;
      const estimatedBpm = Math.round(60 / averageInterval);
      
      // Calculate confidence based on correlation strength
      const confidence = Math.min(maxCorrelation / correlatedSignal[0], 1);

      // Ensure BPM is in a reasonable range (40-220 BPM)
      const normalizedBpm = estimatedBpm < 40 ? estimatedBpm * 2 : 
                          estimatedBpm > 220 ? estimatedBpm / 2 : 
                          estimatedBpm;

      return {
        bpm: normalizedBpm,
        confidence,
        beats: onsets.map(start => ({
          start,
          duration: 60 / normalizedBpm,
          confidence,
        })),
      };
    } catch (error) {
      console.error('Error detecting BPM:', error);
      // Fallback to placeholder data if analysis fails
      return {
        bpm: 120,
        confidence: 0.5,
        beats: [],
      };
    }
  }

  /**
   * Detects musical key using chromagram analysis
   */
  private async detectKey(audioUrl: string): Promise<KeyInfo> {
    try {
      // 1. Load and decode audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      // 2. Analyze key using chromagram
      if (audioData.length === 0) {
        throw new Error('No audio data available');
      }

      // Compute chromagram for key detection
      const chromagram = await this.computeChromagram(audioData);
      
      // Average the chromagram frames to get overall pitch class distribution
      const averageChroma = new Float32Array(12).fill(0);
      for (const frame of chromagram) {
        for (let i = 0; i < 12; i++) {
          averageChroma[i] += frame[i];
        }
      }
      for (let i = 0; i < 12; i++) {
        averageChroma[i] /= chromagram.length;
      }

      // Simple key detection using pitch class weights
      // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
      const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
      const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

      let maxCorrelation = -1;
      let bestKey = 0;
      let bestMode = 1; // 1 for major, 0 for minor

      // Test correlation with all possible keys
      for (let key = 0; key < 12; key++) {
        // Test major key correlation
        let majorCorr = 0;
        let minorCorr = 0;
        for (let i = 0; i < 12; i++) {
          const idx = (i + key) % 12;
          majorCorr += averageChroma[i] * majorProfile[idx];
          minorCorr += averageChroma[i] * minorProfile[idx];
        }

        if (majorCorr > maxCorrelation) {
          maxCorrelation = majorCorr;
          bestKey = key;
          bestMode = 1;
        }
        if (minorCorr > maxCorrelation) {
          maxCorrelation = minorCorr;
          bestKey = key;
          bestMode = 0;
        }
      }

      // Convert numeric key to string representation
      const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const confidence = Math.max(0.5, maxCorrelation / Math.max(...averageChroma));

      return {
        key: keyNames[bestKey],
        mode: bestMode,
        confidence,
      };
    } catch (error) {
      console.error('Error detecting key:', error);
      // Fallback to placeholder data if analysis fails
      return {
        key: 'C',
        mode: 1,
        confidence: 0.5,
      };
    }
  }

  /**
   * Computes the chromagram for key detection
   */
  private async computeChromagram(audioData: Float32Array): Promise<Float32Array[]> {
    // In a real implementation, this would:
    // 1. Apply Short-Time Fourier Transform
    const frameCount = Math.floor(audioData.length / this.windowSize);
    const chromagram: Float32Array[] = [];

    for (let i = 0; i < frameCount; i++) {
      // 2. Map frequencies to pitch classes
      // 3. Aggregate energy in each pitch class
      chromagram.push(new Float32Array(12).fill(0));
    }

    return chromagram;
  }

  /**
   * Performs onset detection for beat tracking
   */
  private detectOnsets(audioData: Float32Array): number[] {
    // In a real implementation, this would:
    // 1. Compute spectral flux
    const frameCount = Math.floor(audioData.length / this.windowSize);
    const onsets: number[] = [];

    for (let i = 0; i < frameCount; i++) {
      // 2. Apply adaptive thresholding
      // 3. Find onset positions
      if (i % 100 === 0) { // Placeholder onset detection
        onsets.push(i * this.windowSize / this.sampleRate);
      }
    }

    return onsets;
  }

  /**
   * Calculates autocorrelation for periodicity detection
   */
  private autocorrelate(signal: Float32Array): Float32Array {
    // In a real implementation, this would:
    // 1. Compute autocorrelation function
    const result = new Float32Array(signal.length);

    // Simple placeholder implementation
    for (let lag = 0; lag < signal.length; lag++) {
      let sum = 0;
      for (let i = 0; i < signal.length - lag; i++) {
        sum += signal[i] * signal[i + lag];
      }
      result[lag] = sum;
    }

    return result;
  }
}

export class PlaylistAnalyticsService {
  private static instance: PlaylistAnalyticsService;

  private constructor() {}

  static getInstance(): PlaylistAnalyticsService {
    if (!PlaylistAnalyticsService.instance) {
      PlaylistAnalyticsService.instance = new PlaylistAnalyticsService();
    }
    return PlaylistAnalyticsService.instance;
  }

  /**
   * Generate comprehensive statistics for a playlist
   */
  async analyzePlaylist(playlistId: string): Promise<PlaylistStats> {
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('playlist_id', playlistId);

    if (error) throw error;
    if (!songs.length) throw new Error('No songs found in playlist');

    const songsWithGenres = songs as SongWithGenres[];

    // Calculate basic stats
    const totalDuration = songsWithGenres.reduce((sum, song) => sum + song.duration, 0);
    const validBpms = songsWithGenres.filter(song => song.bpm).map(song => song.bpm!);
    const averageBpm = validBpms.length ? 
      validBpms.reduce((sum, bpm) => sum + bpm, 0) / validBpms.length : 0;

    // Calculate BPM range
    const bpmRange = {
      min: Math.min(...validBpms),
      max: Math.max(...validBpms)
    };

    // Analyze key distribution
    const keyDistribution: Record<string, number> = {};
    songsWithGenres.forEach(song => {
      if (song.key) {
        keyDistribution[song.key] = (keyDistribution[song.key] || 0) + 1;
      }
    });

    // Analyze genre distribution
    const genreDistribution: Record<string, number> = {};
    songsWithGenres.forEach(song => {
      if (song.genres) {
        song.genres.forEach((genre: string) => {
          genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
        });
      }
    });

    // Calculate artist diversity (unique artists / total songs)
    const uniqueArtists = new Set(songsWithGenres.map(song => song.artist)).size;
    const artistDiversity = uniqueArtists / songsWithGenres.length;

    // Calculate average mood profile
    const moodProfile = {
      energy: songsWithGenres.reduce((sum, song) => sum + (song.energy || 0), 0) / songsWithGenres.length,
      danceability: songsWithGenres.reduce((sum, song) => sum + (song.danceability || 0), 0) / songsWithGenres.length,
      valence: songsWithGenres.reduce((sum, song) => sum + (song.valence || 0), 0) / songsWithGenres.length,
    };

    return {
      totalDuration,
      averageBpm,
      bpmRange,
      keyDistribution,
      genreDistribution,
      artistDiversity,
      moodProfile,
    };
  }

  /**
   * Filter songs based on advanced criteria
   */
  async filterSongs(songs: SongWithGenres[], options: FilterOptions): Promise<SongWithGenres[]> {
    return songs.filter(song => {
      // BPM range filter
      if (options.bpmRange && song.bpm) {
        if (song.bpm < options.bpmRange.min || song.bpm > options.bpmRange.max) {
          return false;
        }
      }

      // Genre filters
      if (options.genres?.length && song.genres) {
        if (!song.genres.some(genre => options.genres!.includes(genre))) {
          return false;
        }
      }

      if (options.excludedGenres?.length && song.genres) {
        if (song.genres.some(genre => options.excludedGenres!.includes(genre))) {
          return false;
        }
      }

      // Key filter
      if (options.keys?.length && song.key) {
        if (!options.keys.includes(song.key)) {
          return false;
        }
      }

      // Duration filter
      if (options.duration) {
        if (song.duration < options.duration.min || song.duration > options.duration.max) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Optimize artist diversity in a playlist
   */
  async optimizeArtistDiversity(songs: SongWithGenres[], targetDiversity: number): Promise<SongWithGenres[]> {
    const artists = new Map<string, number>();
    const result: SongWithGenres[] = [];
    
    // First pass: count artists
    songs.forEach(song => {
      artists.set(song.artist, (artists.get(song.artist) || 0) + 1);
    });

    // Sort songs by artist frequency (prefer less frequent artists)
    const sortedSongs = [...songs].sort((a, b) => {
      const freqA = artists.get(a.artist) || 0;
      const freqB = artists.get(b.artist) || 0;
      return freqA - freqB;
    });

    // Second pass: build optimized playlist
    const targetUniqueArtists = Math.ceil(songs.length * targetDiversity);
    const selectedArtists = new Set<string>();

    for (const song of sortedSongs) {
      if (result.length >= songs.length) break;

      if (selectedArtists.size < targetUniqueArtists || selectedArtists.has(song.artist)) {
        result.push(song);
        selectedArtists.add(song.artist);
      }
    }

    return result;
  }

  /**
   * Generate playlist recommendations based on analysis
   */
  async getRecommendations(playlistId: string): Promise<SongWithGenres[]> {
    const stats = await this.analyzePlaylist(playlistId);
    
    // Query songs with similar characteristics
    const { data: recommendations, error } = await supabase
      .from('songs')
      .select('*')
      .gte('bpm', stats.bpmRange.min * 0.9)
      .lte('bpm', stats.bpmRange.max * 1.1)
      .limit(50);

    if (error) throw error;
    return recommendations as SongWithGenres[];
  }
} 