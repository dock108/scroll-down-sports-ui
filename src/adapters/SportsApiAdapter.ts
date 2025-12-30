import { GameAdapter, GameSummary, GameDetails } from './GameAdapter';
import { getApiBaseUrl } from '../utils/env';
import { buildApiUrl, fetchJson } from '../utils/http';

type ApiGameSummary = {
  id: string | number;
  game_date?: string;
  home_team?: string;
  away_team?: string;
};

type ApiGameDetails = {
  game: ApiGameSummary & {
    home_score?: number;
    away_score?: number;
  };
  team_stats?: GameDetails['teamStats'];
  player_stats?: GameDetails['playerStats'];
};

export class ApiConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConnectionError';
  }
}

export class SportsApiAdapter implements GameAdapter {
  async getGamesByDateRange(start: Date, end: Date): Promise<GameSummary[]> {
    const params = new URLSearchParams();

    if (start && !isNaN(start.getTime())) {
      params.append('startDate', start.toISOString().split('T')[0]);
    }
    if (end && !isNaN(end.getTime())) {
      params.append('endDate', end.toISOString().split('T')[0]);
    }
    params.append('limit', '100');

    const apiUrl = buildApiUrl(getApiBaseUrl(), `/api/admin/sports/games?${params}`);
    const data = await this.fetchJson<{ games: ApiGameSummary[] }>(apiUrl);
    return data.games.map(this.mapGameSummary);
  }

  async getGameById(id: string): Promise<GameDetails | null> {
    const apiUrl = buildApiUrl(getApiBaseUrl(), `/api/admin/sports/games/${id}`);
    const data = await this.fetchJson<ApiGameDetails>(apiUrl);
    return this.mapGameDetails(data);
  }

  private async fetchJson<T>(url: string): Promise<T> {
    try {
      return await fetchJson<T>(url);
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiConnectionError(error.message);
      }
      throw new ApiConnectionError('Unable to connect to sports data API. Is the server running?');
    }
  }

  private mapGameSummary(game: ApiGameSummary): GameSummary {
    return {
      id: String(game.id),
      date: game.game_date,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      venue: undefined,
    };
  }

  private mapGameDetails(data: ApiGameDetails): GameDetails {
    const game = data.game;
    return {
      id: String(game.id),
      date: game.game_date,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      venue: undefined,
      homeScore: game.home_score,
      awayScore: game.away_score,
      teamStats: data.team_stats,
      playerStats: data.player_stats,
    };
  }
}
