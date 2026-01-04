import { ApiConnectionError } from './SportsApiAdapter';
import { getApiBaseUrl } from '../utils/env';
import { logger } from '../utils/logger';

const getApiBase = () => getApiBaseUrl() || 'http://localhost:8000';

/**
 * Play-by-play event as stored in the database
 */
export interface PbpEvent {
  id: string;
  gameId: string;
  period: number;
  gameClock: string;
  elapsedSeconds: number;
  eventType: string;
  description: string;
  team?: string;
  playerName?: string;
  homeScore?: number;
  awayScore?: number;
}

/**
 * API response shape for PBP events
 */
type ApiPbpEvent = {
  id?: string | number;
  game_id?: string | number;
  period?: number;
  game_clock?: string;
  elapsed_seconds?: number;
  event_type?: string;
  description?: string;
  team?: string;
  team_id?: string;
  player_name?: string;
  player_id?: string | number;
  home_score?: number;
  away_score?: number;
};

type ApiPbpResponse = {
  events?: ApiPbpEvent[];
};

export interface PbpAdapter {
  getEventsForGame(gameId: string): Promise<PbpEvent[]>;
  getEventsForMoment(momentId: string): Promise<PbpEvent[]>;
}

/**
 * API adapter for play-by-play events stored in Postgres
 *
 * API endpoints:
 * - GET /api/pbp/game/{gameId} - Get PBP events for a specific game
 */
export class PbpApiAdapter implements PbpAdapter {
  async getEventsForGame(gameId: string): Promise<PbpEvent[]> {
    if (!gameId) {
      logger.warn('PbpApiAdapter: game id missing.');
      return [];
    }

    try {
      const data = await this.fetchJson<ApiPbpResponse>(
        `${getApiBase()}/api/pbp/game/${gameId}`,
      );

      // Events are already sorted by elapsed_seconds ascending from the API.
      return (data.events || []).map(this.mapEvent);
    } catch (error) {
      if (error instanceof ApiConnectionError) {
        throw error;
      }
      logger.warn('PbpApiAdapter: failed to load events.', { error: String(error) });
      return [];
    }
  }

  async getEventsForMoment(momentId: string): Promise<PbpEvent[]> {
    if (!momentId) {
      logger.warn('PbpApiAdapter: moment id missing.');
      return [];
    }

    try {
      const data = await this.fetchJson<ApiPbpResponse>(
        `${getApiBase()}/compact/${momentId}/pbp`,
        { cache: 'no-store' },
      );

      return (data.events || []).map(this.mapEvent);
    } catch (error) {
      if (error instanceof ApiConnectionError) {
        throw error;
      }
      logger.warn('PbpApiAdapter: failed to load moment events.', { error: String(error) });
      return [];
    }
  }

  private async fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    const headers = {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    };

    try {
      response = await fetch(url, {
        ...init,
        headers,
      });
    } catch {
      throw new ApiConnectionError('Unable to connect to PBP API. Is the server running?');
    }

    if (!response.ok) {
      throw new ApiConnectionError(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  private mapEvent(event: ApiPbpEvent): PbpEvent {
    return {
      id: String(event.id || ''),
      gameId: String(event.game_id || ''),
      period: event.period ?? 0,
      gameClock: event.game_clock || '',
      elapsedSeconds: event.elapsed_seconds ?? 0,
      eventType: event.event_type || '',
      description: event.description || '',
      team: event.team || event.team_id,
      playerName: event.player_name,
      homeScore: event.home_score,
      awayScore: event.away_score,
    };
  }
}

export function getPbpAdapter(): PbpAdapter {
  return new PbpApiAdapter();
}
