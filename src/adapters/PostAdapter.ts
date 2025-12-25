import posts from '../data/posts.json';

type FlexibleRecord = Record<string, unknown>;

const getStringValue = (record: FlexibleRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const getBooleanValue = (record: FlexibleRecord, keys: string[]): boolean | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
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

export interface TimelinePost {
  id: string;
  gameId: string;
  team: string;
  tweetUrl: string;
  postedAt: string;
  hasVideo?: boolean;
}

export interface PostAdapter {
  getPostsForGame(gameId: string): Promise<TimelinePost[]>;
}

export class MockPostAdapter implements PostAdapter {
  async getPostsForGame(gameId: string): Promise<TimelinePost[]> {
    if (!gameId) {
      console.warn('MockPostAdapter: game id missing.');
      return [];
    }

    try {
      const normalized = posts.map((post, index) => this.normalizePost(post as FlexibleRecord, index));
      const filtered = normalized.filter((post) => post.gameId === gameId && post.tweetUrl);

      if (!filtered.length) {
        console.warn(`MockPostAdapter: no posts found for game ${gameId}.`);
        return [];
      }

      return filtered
        .slice()
        .sort((a, b) => {
          const aTime = parseFlexibleDate(a.postedAt)?.getTime() ?? 0;
          const bTime = parseFlexibleDate(b.postedAt)?.getTime() ?? 0;
          return aTime - bTime;
        });
    } catch (error) {
      console.warn('MockPostAdapter: failed to load posts.', error);
      return [];
    }
  }

  private normalizePost(post: FlexibleRecord, index: number): TimelinePost {
    const tweetUrl = getStringValue(post, ['tweet_url', 'tweetUrl', 'url']) ?? '';
    const fallbackId = tweetUrl || `post-${index}`;
    return {
      id: getStringValue(post, ['id', 'post_id', 'tweet_id', 'tweetId']) ?? fallbackId,
      gameId: getStringValue(post, ['game_id', 'gameId', 'game']) ?? '',
      tweetUrl,
      postedAt: getStringValue(post, ['posted_at', 'postedAt', 'timestamp']) ?? '',
      hasVideo: getBooleanValue(post, ['has_video', 'hasVideo', 'video']),
      team: getStringValue(post, ['team', 'team_id', 'teamId']) ?? '',
    };
  }
}
