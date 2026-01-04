import { ApiConnectionError } from './SportsApiAdapter';
import { getApiBaseUrl } from '../utils/env';
import { logger } from '../utils/logger';

const getApiBase = () => getApiBaseUrl() || 'http://localhost:8000';

type ApiSummaryResponse = {
  summary?: string | null;
};

export interface AiSummaryAdapter {
  getSummaryForMoment(momentId: string): Promise<string | null>;
}

export class AiSummaryApiAdapter implements AiSummaryAdapter {
  async getSummaryForMoment(momentId: string): Promise<string | null> {
    if (!momentId) {
      logger.warn('AiSummaryApiAdapter: moment id missing.');
      return null;
    }

    try {
      const data = await this.fetchJson<ApiSummaryResponse>(
        `${getApiBase()}/compact/${momentId}/summary`,
        { cache: 'no-store' },
      );
      return data.summary?.trim() || null;
    } catch (error) {
      if (error instanceof ApiConnectionError) {
        throw error;
      }
      logger.warn('AiSummaryApiAdapter: failed to load summary.', { error: String(error) });
      return null;
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
      throw new ApiConnectionError('Unable to connect to summary API. Is the server running?');
    }

    if (!response.ok) {
      throw new ApiConnectionError(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}

export function getAiSummaryAdapter(): AiSummaryAdapter {
  return new AiSummaryApiAdapter();
}
