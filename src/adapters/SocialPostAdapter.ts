import { ApiConnectionError } from './SportsApiAdapter';
import { MockPostAdapter, TimelinePost } from './PostAdapter';

const API_BASE = import.meta.env.VITE_SPORTS_API_URL || 'http://localhost:8000';

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
}

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
      console.warn('SocialPostApiAdapter: game id missing.');
      return [];
    }

    try {
      // Use the dedicated game endpoint for cleaner API
      const data = await this.fetchJson(`${API_BASE}/api/social/posts/game/${gameId}`);
      
      // Posts are already sorted by posted_at ascending from the API
      return (data.posts || []).map(this.mapPost);
    } catch (error) {
      if (error instanceof ApiConnectionError) {
        throw error;
      }
      console.warn('SocialPostApiAdapter: failed to load posts.', error);
      return [];
    }
  }

  private async fetchJson(url: string): Promise<any> {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      throw new ApiConnectionError(
        'Unable to connect to social posts API. Is the server running?'
      );
    }

    if (!response.ok) {
      throw new ApiConnectionError(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private mapPost(post: any): TimelinePost {
    return {
      id: String(post.id || post.post_url || post.tweet_url || ''),
      gameId: String(post.game_id || ''),
      team: String(post.team_id || post.team || ''),
      postUrl: String(post.post_url || post.tweet_url || ''),
      postedAt: String(post.posted_at || ''),
      hasVideo: Boolean(post.has_video),
    };
  }
}

/**
 * Factory function to get the appropriate social post adapter
 */
export function getSocialPostAdapter(): SocialPostAdapter {
  const apiUrl = import.meta.env.VITE_SPORTS_API_URL;
  if (apiUrl) {
    return new SocialPostApiAdapter();
  }
  // Fallback to mock adapter for local development
  return new MockPostAdapter();
}

