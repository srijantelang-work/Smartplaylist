interface UserStatsData {
  totalPlaylists: number;
  totalSongs: number;
  favoriteGenres: { genre: string; count: number }[];
  totalDuration: number; // in minutes
  lastActive: string;
}

interface UserStatsProps {
  stats: UserStatsData | null;
}

export function UserStats({ stats }: UserStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Metrics */}
      <div className="space-y-4">
        <div>
          <div className="text-[#E8E8E8] text-sm">Total Playlists</div>
          <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
        </div>
        <div>
          <div className="text-[#E8E8E8] text-sm">Total Songs</div>
          <div className="text-2xl font-bold">{stats.totalSongs}</div>
        </div>
        <div>
          <div className="text-[#E8E8E8] text-sm">Total Duration</div>
          <div className="text-2xl font-bold">
            {Math.round(stats.totalDuration / 60)} hours
          </div>
        </div>
        <div>
          <div className="text-[#E8E8E8] text-sm">Last Active</div>
          <div className="text-2xl font-bold">
            {new Date(stats.lastActive).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Favorite Genres */}
      <div>
        <div className="text-[#E8E8E8] text-sm mb-4">Top Genres</div>
        <div className="space-y-2">
          {stats.favoriteGenres.map(({ genre, count }) => (
            <div key={genre} className="flex items-center">
              <div className="flex-1">
                <div className="text-sm font-medium">{genre}</div>
                <div className="h-2 bg-black rounded-full mt-1">
                  <div
                    className="h-full bg-[#1DB954] rounded-full"
                    style={{
                      width: `${(count / Math.max(...stats.favoriteGenres.map(g => g.count))) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm text-[#E8E8E8]">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 