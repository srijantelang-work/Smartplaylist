import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { PlaylistStats } from '../../services/playlistAnalyticsService';

interface PlaylistAnalyticsProps {
  stats: PlaylistStats;
  className?: string;
}

export function PlaylistAnalytics({ stats, className = '' }: PlaylistAnalyticsProps) {
  // Convert distributions to chart data
  const keyData = Object.entries(stats.keyDistribution).map(([key, count]) => ({
    name: key,
    count,
  }));

  const genreData = Object.entries(stats.genreDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre, count]) => ({
      name: genre,
      count,
    }));

  const tempoData = Object.entries(stats.tempoDistribution).map(([range, count]) => ({
    name: range,
    count,
  }));

  const yearData = Object.entries(stats.yearDistribution)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({
      name: `${year}s`,
      count,
    }));

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Summary Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Playlist Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Duration</p>
              <p className="text-2xl font-bold">
                {Math.floor(stats.totalDuration / 60)}:{String(stats.totalDuration % 60).padStart(2, '0')}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Average BPM</p>
              <p className="text-2xl font-bold">{Math.round(stats.averageBpm)}</p>
            </div>
            <div>
              <p className="text-gray-400">Artist Diversity</p>
              <p className="text-2xl font-bold">{Math.round(stats.artistDiversity * 100)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Mood Score</p>
              <p className="text-2xl font-bold">
                {Math.round((stats.moodProfile.energy + stats.moodProfile.valence) * 50)}
              </p>
            </div>
          </div>
        </div>

        {/* Mood Profile */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Mood Profile</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400">Energy</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${stats.moodProfile.energy * 100}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-gray-400">Danceability</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-purple-500 h-2.5 rounded-full"
                  style={{ width: `${stats.moodProfile.danceability * 100}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-gray-400">Valence</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${stats.moodProfile.valence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="space-y-8">
        {/* Genre Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Top Genres</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Key Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tempo Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Tempo Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Progression */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Mood Progression</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.moodProgression}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="energy" stroke="#8884d8" />
                <Line type="monotone" dataKey="valence" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Year Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 