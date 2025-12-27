import { GameAdapter } from './GameAdapter';
import { MockGameAdapter } from './GameAdapter';
import { SportsApiAdapter, ApiConnectionError } from './SportsApiAdapter';
import { TeamSocialAdapter, MockTeamSocialAdapter } from './TeamSocialAdapter';

export function getGameAdapter(): GameAdapter {
  const apiUrl = import.meta.env.VITE_SPORTS_API_URL;
  if (apiUrl) {
    return new SportsApiAdapter();
  }
  return new MockGameAdapter();
}

export function getTeamSocialAdapter(): TeamSocialAdapter {
  // For now, always use the mock adapter which reads from local JSON
  // This can be swapped for an API adapter when backend integration is ready
  return new MockTeamSocialAdapter();
}

export { ApiConnectionError };
export type { TeamSocialAdapter } from './TeamSocialAdapter';
export { buildTwitterProfileUrl, buildTwitterEmbedUrl, extractTweetId } from './TeamSocialAdapter';
export { getSocialPostAdapter } from './SocialPostAdapter';
export type { SocialPostAdapter, GameSocialPost } from './SocialPostAdapter';

