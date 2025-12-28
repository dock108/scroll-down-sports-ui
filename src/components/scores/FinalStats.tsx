import { useMemo } from 'react';
import type { PlayerStat, StatRecord, StatValue, TeamStat } from '../../adapters/GameAdapter';

interface FinalStatsProps {
  homeTeam: string;
  awayTeam: string;
  attendance: number;
  revealed: boolean;
  homeScore?: number;
  awayScore?: number;
  teamStats?: TeamStat[];
  playerStats?: PlayerStat[];
}

// Get minutes from raw_stats (could be "minutes", "min", "minutes_played", etc.)
const getMinutes = (raw: StatRecord): number => {
  const keys = ['minutes', 'min', 'minutes_played', 'mins', 'mp'];
  for (const key of keys) {
    const val = raw[key];
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string') {
      // Handle "MM:SS" format
      const parts = val.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10) || 0;
        if (!isNaN(mins)) return mins + secs / 60;
      }
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return 0;
};

// Format stat value - round minutes to 2 decimal places
const formatStatValue = (key: string, val: StatValue): string => {
  if (val === undefined || val === null) return '—';
  const lowerKey = key.toLowerCase();
  // Check if this is a minutes field
  if (['minutes', 'min', 'mins', 'mp', 'minutes_played'].includes(lowerKey)) {
    // If it's a number, round to 2 decimal places
    if (typeof val === 'number') {
      return val.toFixed(2);
    }
    // If it's MM:SS format, convert to decimal minutes
    if (typeof val === 'string' && val.includes(':')) {
      const parts = val.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        return (mins + secs / 60).toFixed(2);
      }
    }
  }
  return String(val);
};

// Format stat label for display
const formatStatLabel = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// Exclude points from team stats (it's in final score) and metadata fields
const TEAM_STAT_EXCLUDES = [
  'points',
  'pts',
  'score',
  'source',
  'updated_at',
  'game_score',
  'plus_minus',
];

export const FinalStats = ({
  homeTeam,
  awayTeam,
  attendance,
  revealed,
  homeScore,
  awayScore,
  teamStats,
  playerStats,
}: FinalStatsProps) => {
  // Get all stat keys from player raw_stats (union of all players)
  const allPlayerStatKeys = useMemo(() => {
    if (!playerStats?.length) return [];
    const keySet = new Set<string>();
    playerStats.forEach((p) => {
      Object.keys(p.raw_stats || {}).forEach((k) => keySet.add(k));
    });
    // Prioritize common stats first
    const priority = [
      'minutes',
      'min',
      'mp',
      'pts',
      'points',
      'reb',
      'rebounds',
      'ast',
      'assists',
      'stl',
      'steals',
      'blk',
      'blocks',
      'tov',
      'to',
      'turnovers',
      'fg',
      'fga',
      'fg_pct',
      'fg3',
      '3p',
      'fg3a',
      '3pa',
      'fg3_pct',
      '3p_pct',
      'ft',
      'fta',
      'ft_pct',
      'orb',
      'drb',
      'trb',
      'pf',
    ];
    const keys = Array.from(keySet);
    return keys.sort((a, b) => {
      const aIdx = priority.indexOf(a.toLowerCase());
      const bIdx = priority.indexOf(b.toLowerCase());
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [playerStats]);

  // Filter players: only those with >= 1 minute played, sorted by points
  const filteredPlayers = useMemo(() => {
    if (!playerStats?.length) return [];
    return [...playerStats]
      .filter((p) => getMinutes(p.raw_stats || {}) >= 1)
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  }, [playerStats]);

  // Split players by team
  const awayTeamName = teamStats?.find((t) => !t.is_home)?.team;
  const homeTeamName = teamStats?.find((t) => t.is_home)?.team;

  const awayPlayers = useMemo(() => {
    if (!awayTeamName) return filteredPlayers.filter((p) => p.team !== homeTeamName);
    return filteredPlayers.filter((p) => p.team === awayTeamName);
  }, [filteredPlayers, awayTeamName, homeTeamName]);

  const homePlayers = useMemo(() => {
    if (!homeTeamName) return filteredPlayers.filter((p) => p.team !== awayTeamName);
    return filteredPlayers.filter((p) => p.team === homeTeamName);
  }, [filteredPlayers, homeTeamName, awayTeamName]);

  // Separate team stats by home/away
  const awayTeamStats = teamStats?.find((t) => !t.is_home);
  const homeTeamStats = teamStats?.find((t) => t.is_home);

  // Filter out points and metadata from team stats, include all numeric-like values
  const filterTeamStats = (stats: StatRecord) => {
    return Object.entries(stats || {}).filter(([key, v]) => {
      // Exclude points and metadata fields
      if (TEAM_STAT_EXCLUDES.includes(key.toLowerCase())) return false;
      // Include numbers
      if (typeof v === 'number' && Number.isFinite(v)) return true;
      // Include non-empty strings (stats like "29", ".414")
      if (typeof v === 'string' && v.trim() !== '') return true;
      return false;
    });
  };

  // Render a box score table for a team
  const renderBoxScore = (players: PlayerStat[], teamName: string, label: string) => {
    if (!players.length) return null;
    return (
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-semibold text-gray-800">{teamName}</p>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">{label}</span>
        </div>
        <div className="relative overflow-x-auto rounded-xl border border-gray-200">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/90 to-transparent sm:hidden" />
          <table className="w-full text-sm text-gray-800 whitespace-nowrap">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.15em] text-gray-500">
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-gray-50 px-3 py-2 text-left">Player</th>
                {allPlayerStatKeys.map((key) => (
                  <th
                    key={key}
                    className="sticky top-0 z-20 bg-gray-50 px-2 py-2 text-right tabular-nums"
                  >
                    {formatStatLabel(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => (
                <tr
                  key={`${p.player_name}-${idx}`}
                  className="group border-t border-gray-100 odd:bg-gray-50/60 hover:bg-gray-50/80"
                >
                  <td className="sticky left-0 z-10 bg-white group-odd:bg-gray-50 px-3 py-2 font-medium">
                    {p.player_name}
                  </td>
                  {allPlayerStatKeys.map((key) => (
                    <td key={key} className="px-2 py-2 text-right tabular-nums">
                      {formatStatValue(key, p.raw_stats?.[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`grid transition-all duration-700 ease-out ${
        revealed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
      aria-hidden={!revealed}
    >
      <div
        className={`overflow-hidden rounded-2xl bg-white transition-all duration-700 ease-out ${
          revealed
            ? 'translate-y-0 border border-gray-200 p-6 shadow-sm'
            : 'translate-y-4 border border-transparent p-0'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">
          Player Stats + Team Stats + Final Score
        </p>

        {/* 1. PLAYER STATS - Box score by team */}
        {(awayPlayers.length > 0 || homePlayers.length > 0) && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Box Score</p>
            {renderBoxScore(awayPlayers, awayTeamStats?.team || awayTeam, 'Away')}
            {renderBoxScore(homePlayers, homeTeamStats?.team || homeTeam, 'Home')}
          </div>
        )}

        {/* 2. TEAM STATS - Full display for each team (excluding points) */}
        {(awayTeamStats || homeTeamStats) && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Team Stats</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Away Team */}
              {awayTeamStats && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="text-lg font-semibold text-gray-800">{awayTeamStats.team}</div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Away</span>
                  </div>
                  <dl className="space-y-2">
                    {filterTeamStats(awayTeamStats.stats).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <dt className="text-gray-500">{formatStatLabel(label)}</dt>
                        <dd className="font-semibold text-gray-800">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {/* Home Team */}
              {homeTeamStats && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="text-lg font-semibold text-gray-800">{homeTeamStats.team}</div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Home</span>
                  </div>
                  <dl className="space-y-2">
                    {filterTeamStats(homeTeamStats.stats).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <dt className="text-gray-500">{formatStatLabel(label)}</dt>
                        <dd className="font-semibold text-gray-800">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final score appears last to preserve the spoiler-safe flow. */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Final Score</p>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div className="text-xl font-semibold text-gray-800">{awayTeam}</div>
            <div className="text-4xl font-bold text-gray-900">
              {Number.isFinite(awayScore ?? NaN) ? awayScore : '—'}
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="text-xl font-semibold text-gray-800">{homeTeam}</div>
            <div className="text-4xl font-bold text-gray-900">
              {Number.isFinite(homeScore ?? NaN) ? homeScore : '—'}
            </div>
          </div>
        </div>

        {/* Attendance */}
        {attendance > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {attendance.toLocaleString()}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">Attendance</div>
          </div>
        )}
      </div>
    </div>
  );
};
