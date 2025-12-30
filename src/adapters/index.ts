import { GameAdapter } from './GameAdapter';
import { MockGameAdapter } from './GameAdapter';
import { SportsApiAdapter, ApiConnectionError } from './SportsApiAdapter';
import { getApiBaseUrl, useMockAdapters } from '../utils/env';
import { logger } from '../utils/logger';

export function getGameAdapter(): GameAdapter {
  if (useMockAdapters()) {
    logger.info('Using mock game adapter (feature flag enabled).');
    return new MockGameAdapter();
  }

  const apiUrl = getApiBaseUrl();
  if (!apiUrl) {
    logger.warn('API URL missing; falling back to mock game adapter.');
    return new MockGameAdapter();
  }

  return new SportsApiAdapter();
}

export { ApiConnectionError };
export { getSocialPostAdapter } from './SocialPostAdapter';
export type { SocialPostAdapter, GameSocialPost } from './SocialPostAdapter';
