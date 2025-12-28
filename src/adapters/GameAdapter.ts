import games from '../data/games.json';

type FlexibleRecord = Record<string, unknown>;

type StartersValue = Record<string, string[]> | undefined;

const getStringValue = (record: FlexibleRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const getNumberValue = (record: FlexibleRecord, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
};

const getStartersValue = (record: FlexibleRecord, keys: string[]): StartersValue => {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const starters = Object.entries(value as Record<string, unknown>).reduce<
        Record<string, string[]>
      >((acc, [team, roster]) => {
        if (Array.isArray(roster) && roster.every((player) => typeof player === 'string')) {
          acc[team] = roster as string[];
        }
        return acc;
      }, {});
      return Object.keys(starters).length ? starters : undefined;
    }
  }
  return undefined;
};

const parseFlexibleDate = (value?: string) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const isValidDate = (value: Date | undefined) =>
  value instanceof Date && !Number.isNaN(value.getTime());

export interface GameSummary {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  attendance?: number;
}

export type StatValue = string | number | null | undefined;

export type StatRecord = Record<string, StatValue>;

export interface TeamStat {
  team: string;
  is_home: boolean;
  stats: StatRecord;
}

export interface PlayerStat {
  team: string;
  player_name: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  raw_stats: StatRecord;
}

export interface GameDetails extends GameSummary {
  starters?: Record<string, string[]>;
  homeScore?: number;
  awayScore?: number;
  teamStats?: TeamStat[];
  playerStats?: PlayerStat[];
}

export interface GameAdapter {
  getGamesByDateRange(start: Date, end: Date): Promise<GameSummary[]>;
  getGameById(id: string): Promise<GameDetails | null>;
}

export class MockGameAdapter implements GameAdapter {
  async getGamesByDateRange(start: Date, end: Date): Promise<GameSummary[]> {
    try {
      const startDate = isValidDate(start) ? start : null;
      const endDate = isValidDate(end) ? end : null;

      return games
        .map((game) => this.normalizeGame(game as FlexibleRecord))
        .filter((game) => {
          const gameDate = parseFlexibleDate(game.date);

          if (!gameDate) {
            return true;
          }

          if (startDate && gameDate < startDate) {
            return false;
          }

          if (endDate && gameDate > endDate) {
            return false;
          }

          return true;
        });
    } catch (error) {
      console.warn('MockGameAdapter: failed to load games.', error);
      return [];
    }
  }

  async getGameById(id: string): Promise<GameDetails | null> {
    if (!id) {
      console.warn('MockGameAdapter: game id missing.');
      return null;
    }

    try {
      const matched = games
        .map((game) => this.normalizeGame(game as FlexibleRecord))
        .find((game) => game.id === id);

      if (!matched) {
        console.warn(`MockGameAdapter: game not found for id ${id}.`);
        return null;
      }

      return matched;
    } catch (error) {
      console.warn('MockGameAdapter: failed to load game.', error);
      return null;
    }
  }

  private normalizeGame(game: FlexibleRecord): GameDetails {
    return {
      id: getStringValue(game, ['id', 'game_id', 'gameId']) ?? '',
      date: getStringValue(game, ['date', 'game_date', 'start_time', 'startTime']) ?? '',
      homeTeam: getStringValue(game, ['home_team', 'homeTeam', 'home']) ?? '',
      awayTeam: getStringValue(game, ['away_team', 'awayTeam', 'away']) ?? '',
      venue: getStringValue(game, ['venue', 'arena', 'location']),
      attendance: getNumberValue(game, ['attendance', 'crowd', 'attendance_total']),
      starters: getStartersValue(game, ['starters', 'lineups', 'starting_lineups']),
    };
  }
}
