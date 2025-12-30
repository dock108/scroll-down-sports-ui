import { ApiConnectionError } from './SportsApiAdapter';
import { MockPostAdapter, TimelinePost } from './PostAdapter';
import { getApiBaseUrl, useMockAdapters } from '../utils/env';
import { buildApiUrl, fetchJson } from '../utils/http';
import { logger } from '../utils/logger';

/**
 * Social post as stored in the database
 * Minimal data - X hosts all media
 */
export interface GameSocialPost {
  id: string;
  gameId: string;
  teamId: string;
  postUrl: string;
  postedAt: string;
  hasVideo?: boolean;
  mediaType?: 'video' | 'image' | 'none';
  videoUrl?: string;
  imageUrl?: string;
  sourceHandle?: string;
  tweetText?: string;
}

type ApiPostResponse = {
  posts?: ApiSocialPost[];
};

type ApiSocialPost = {
  id?: string | number;
  game_id?: string | number;
  team_id?: string;
  team?: string;
  post_url?: string;
  tweet_url?: string;
  tweet_id?: string | number;
  posted_at?: string;
  has_video?: boolean;
  media_type?: 'video' | 'image' | 'none';
  video_url?: string;
  image_url?: string;
  source_handle?: string;
  tweet_text?: string;
};
export interface SocialPostAdapter {
  getPostsForGame(gameId: string): Promise<TimelinePost[]>;
}

/**
 * API adapter for social posts stored in Postgres
 *
 * API endpoints:
 * - GET /api/social/posts/game/{gameId} - Get posts for a specific game
 * - GET /api/social/posts?team_id={teamId}&start_date={}&end_date={} - Filter posts
 */
export class SocialPostApiAdapter implements SocialPostAdapter {
  async getPostsForGame(gameId: string): Promise<TimelinePost[]> {
    if (!gameId) {
      logger.warn('SocialPostApiAdapter: game id missing.');
      return [];
    }

    try {
      // Use the dedicated game endpoint for cleaner API
      const apiUrl = buildApiUrl(getApiBaseUrl(), `/api/social/posts/game/${gameId}`);
      const data = await this.fetchJson<ApiPostResponse>(apiUrl);

      // Posts are already sorted by posted_at ascending from the API.
      const mappedPosts = (data.posts || []).map(this.mapPost);
      return mappedPosts;
    } catch (error) {
      if (error instanceof ApiConnectionError) {
        throw error;
      }
      logger.warn('SocialPostApiAdapter: failed to load posts.', { error: String(error) });
      return [];
    }
  }

  private async fetchJson<T>(url: string): Promise<T> {
    try {
      return await fetchJson<T>(url);
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiConnectionError(error.message);
      }
      throw new ApiConnectionError('Unable to connect to social posts API. Is the server running?');
    }
  }

  private mapPost(post: ApiSocialPost): TimelinePost {
    const postUrl = String(post.post_url || post.tweet_url || '');
    const idCandidate = String(post.tweet_id || post.id || '');
    return {
      id: String(post.id || post.post_url || post.tweet_url || ''),
      gameId: String(post.game_id || ''),
      team: String(post.team_id || post.team || ''),
      postUrl,
      tweetId: extractTweetId(postUrl) || (isTweetId(idCandidate) ? idCandidate : ''),
      postedAt: String(post.posted_at || ''),
      hasVideo: Boolean(post.has_video),
      mediaType: post.media_type,
      videoUrl: post.video_url,
      imageUrl: post.image_url,
      sourceHandle: post.source_handle,
      tweetText: post.tweet_text,
    };
  }
}

const isTweetId = (value: string) => /^\d+$/.test(value.trim());

const extractTweetId = (url: string) => {
  if (!url) {
    return '';
  }
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const parsed = new URL(normalized);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const statusIndex = segments.findIndex((segment) => segment === 'status');
    if (statusIndex >= 0 && segments[statusIndex + 1]) {
      const idCandidate = segments[statusIndex + 1].split('?')[0];
      return isTweetId(idCandidate) ? idCandidate : '';
    }
  } catch {
    return '';
  }
  return '';
};

/**
 * Factory function to get the appropriate social post adapter
 */
export function getSocialPostAdapter(): SocialPostAdapter {
  if (useMockAdapters()) {
    logger.info('Using mock social post adapter (feature flag enabled).');
    return new MockPostAdapter();
  }

  const apiUrl = getApiBaseUrl();
  if (!apiUrl) {
    logger.warn('API URL missing; falling back to mock social post adapter.');
    return new MockPostAdapter();
  }

  return new SocialPostApiAdapter();
}
