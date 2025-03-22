import { supabase } from '../lib/supabase';
import type { Song } from '../types/database';
import { AudioAnalysisService } from './audioAnalysisService';

export interface PlaylistStats {
  totalDuration: number;
  averageBpm: number;
  bpmRange: { min: number; max: number };
  keyDistribution: Record<string, number>;
  genreDistribution: Record<string, number>;
  artistDiversity: number;
  moodProfile: {
    energy: number;
    danceability: number;
    valence: number;
  };
  tempoDistribution: Record<string, number>;
  yearDistribution: Record<string, number>;
  moodProgression: Array<{
    position: number;
    energy: number;
    valence: number;
  }>;
}

interface FilterOptions {
  bpmRange?: { min: number; max: number };
  genres?: string[];
  excludedGenres?: string[];
  minArtistDiversity?: number;
  keys?: string[];
  moods?: string[];
  duration?: { min: number; max: number };
  tempoVariation?: { min: number; max: number };
  releaseYearRange?: { start: number; end: number };
  artistFrequency?: { min: number; max: number };
}

interface SongWithAnalysis extends Song {
  genres?: string[];
  energy?: number;
  danceability?: number;
  valence?: number;
  analysis?: {
    bpm: number;
    key: string;
    mode: number;
    segments: Array<{
      start: number;
      duration: number;
      loudness: number;
    }>;
  };
}

export class PlaylistAnalyticsService {
  private static instance: PlaylistAnalyticsService;
  private audioAnalysisService: AudioAnalysisService;

  private constructor() {
    this.audioAnalysisService = AudioAnalysisService.getInstance();
  }

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
    const { data: songs } = await supabase
      .from('songs')
      .select('*')
      .eq('playlist_id', playlistId);

    if (!songs || songs.length === 0) {
      throw new Error('No songs found in playlist');
    }

    const songsWithAnalysis = await this.analyzeSongs(songs);
    
    // Calculate basic stats
    const totalDuration = songs.reduce((sum, song) => sum + song.duration, 0);
    const bpms = songsWithAnalysis.map(song => song.analysis?.bpm || 0).filter(bpm => bpm > 0);
    const averageBpm = bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length;

    // Calculate distributions
    const keyDist: Record<string, number> = {};
    const genreDist: Record<string, number> = {};
    const tempoDist: Record<string, number> = {};
    const yearDist: Record<string, number> = {};

    songsWithAnalysis.forEach(song => {
      // Key distribution
      if (song.analysis?.key) {
        keyDist[song.analysis.key] = (keyDist[song.analysis.key] || 0) + 1;
      }

      // Genre distribution
      song.genres?.forEach(genre => {
        genreDist[genre] = (genreDist[genre] || 0) + 1;
      });

      // Tempo distribution
      const bpmRange = this.getBpmRange(song.analysis?.bpm || 0);
      tempoDist[bpmRange] = (tempoDist[bpmRange] || 0) + 1;

      // Year distribution
      if (song.year) {
        const decade = Math.floor(song.year / 10) * 10;
        yearDist[decade] = (yearDist[decade] || 0) + 1;
      }
    });

    // Calculate artist diversity
    const artistCounts = new Map<string, number>();
    songs.forEach(song => {
      artistCounts.set(song.artist, (artistCounts.get(song.artist) || 0) + 1);
    });
    const artistDiversity = 1 - (Math.max(...Array.from(artistCounts.values())) / songs.length);

    // Calculate mood progression
    const moodProgression = songsWithAnalysis.map((song, index) => ({
      position: index,
      energy: song.energy || 0,
      valence: song.valence || 0,
    }));

    return {
      totalDuration,
      averageBpm,
      bpmRange: {
        min: Math.min(...bpms),
        max: Math.max(...bpms),
      },
      keyDistribution: keyDist,
      genreDistribution: genreDist,
      artistDiversity,
      moodProfile: {
        energy: songsWithAnalysis.reduce((sum, song) => sum + (song.energy || 0), 0) / songs.length,
        danceability: songsWithAnalysis.reduce((sum, song) => sum + (song.danceability || 0), 0) / songs.length,
        valence: songsWithAnalysis.reduce((sum, song) => sum + (song.valence || 0), 0) / songs.length,
      },
      tempoDistribution: tempoDist,
      yearDistribution: yearDist,
      moodProgression,
    };
  }

  /**
   * Filter songs based on advanced criteria
   */
  async filterSongs(songs: SongWithAnalysis[], options: FilterOptions): Promise<SongWithAnalysis[]> {
    let filteredSongs = [...songs];

    if (options.bpmRange) {
      filteredSongs = filteredSongs.filter(song => {
        const bpm = song.analysis?.bpm || 0;
        return bpm >= options.bpmRange!.min && bpm <= options.bpmRange!.max;
      });
    }

    if (options.genres?.length) {
      filteredSongs = filteredSongs.filter(song =>
        song.genres?.some(genre => options.genres!.includes(genre))
      );
    }

    if (options.excludedGenres?.length) {
      filteredSongs = filteredSongs.filter(song =>
        !song.genres?.some(genre => options.excludedGenres!.includes(genre))
      );
    }

    if (options.keys?.length) {
      filteredSongs = filteredSongs.filter(song =>
        options.keys!.includes(song.analysis?.key || '')
      );
    }

    if (options.duration) {
      filteredSongs = filteredSongs.filter(song =>
        song.duration >= options.duration!.min && song.duration <= options.duration!.max
      );
    }

    if (options.releaseYearRange) {
      filteredSongs = filteredSongs.filter(song =>
        song.year &&
        song.year >= options.releaseYearRange!.start &&
        song.year <= options.releaseYearRange!.end
      );
    }

    if (options.artistFrequency) {
      const artistCounts = new Map<string, number>();
      filteredSongs.forEach(song => {
        artistCounts.set(song.artist, (artistCounts.get(song.artist) || 0) + 1);
      });

      filteredSongs = filteredSongs.filter(song => {
        const count = artistCounts.get(song.artist) || 0;
        return count >= options.artistFrequency!.min && count <= options.artistFrequency!.max;
      });
    }

    return filteredSongs;
  }

  /**
   * Optimize artist diversity in a playlist
   */
  async optimizeArtistDiversity(songs: Song[], targetDiversity: number): Promise<Song[]> {
    const artists = new Map<string, number>();
    const result: Song[] = [];
    
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
  async getRecommendations(playlistId: string): Promise<Song[]> {
    const stats = await this.analyzePlaylist(playlistId);
    
    // Query songs with similar characteristics
    const { data: recommendations, error } = await supabase
      .from('songs')
      .select('*')
      .gte('bpm', stats.bpmRange.min * 0.9)
      .lte('bpm', stats.bpmRange.max * 1.1)
      .limit(50);

    if (error) throw error;
    return recommendations;
  }

  private async analyzeSongs(songs: Song[]): Promise<SongWithAnalysis[]> {
    return Promise.all(
      songs.map(async song => {
        if (!song.preview_url) return { ...song };

        try {
          const analysis = await this.audioAnalysisService.analyzeAudio(song.preview_url);
          return {
            ...song,
            analysis: {
              bpm: analysis.bpm,
              key: analysis.key,
              mode: analysis.mode,
              segments: [],
            },
            energy: analysis.energy,
            danceability: analysis.danceability,
            valence: analysis.valence,
          };
        } catch (error) {
          console.error(`Error analyzing song ${song.id}:`, error);
          return { ...song };
        }
      })
    );
  }

  private getBpmRange(bpm: number): string {
    const ranges = [
      { max: 60, label: 'Very Slow' },
      { max: 90, label: 'Slow' },
      { max: 120, label: 'Moderate' },
      { max: 150, label: 'Fast' },
      { max: Infinity, label: 'Very Fast' },
    ];

    const range = ranges.find(r => bpm <= r.max);
    return range ? range.label : 'Unknown';
  }
} 