import { GameAdapter, GameSummary, GameDetails } from './GameAdapter';

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

const API_BASE = import.meta.env.VITE_SPORTS_API_URL || 'http://localhost:8000';

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

    const data = await this.fetchJson<{ games: ApiGameSummary[] }>(
      `${API_BASE}/api/admin/sports/games?${params}`,
    );
    return data.games.map(this.mapGameSummary);
  }

  async getGameById(id: string): Promise<GameDetails | null> {
    const data = await this.fetchJson<ApiGameDetails>(`${API_BASE}/api/admin/sports/games/${id}`);
    return this.mapGameDetails(data);
  }

  private async fetchJson<T>(url: string): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      throw new ApiConnectionError('Unable to connect to sports data API. Is the server running?');
    }

    if (!response.ok) {
      throw new ApiConnectionError(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
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
