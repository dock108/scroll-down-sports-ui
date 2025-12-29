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
  postUrl: string;
  tweetId: string;
  postedAt: string;
  hasVideo?: boolean;
  mediaType?: 'video' | 'image' | 'none';
  videoUrl?: string;
  imageUrl?: string;
  sourceHandle?: string;
  tweetText?: string;
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
      const normalized = posts.map((post, index) =>
        this.normalizePost(post as FlexibleRecord, index),
      );
      const filtered = normalized.filter((post) => post.gameId === gameId && post.postUrl);

      if (!filtered.length) {
        console.warn(`MockPostAdapter: no posts found for game ${gameId}.`);
        return [];
      }

      // Timeline stays chronological so the replay mirrors game flow.
      return filtered.slice().sort((a, b) => {
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
    const postUrl = getStringValue(post, ['post_url', 'tweet_url', 'tweetUrl', 'url']) ?? '';
    const fallbackId = postUrl || `post-${index}`;
    const idCandidate = getStringValue(post, ['tweet_id', 'tweetId', 'id', 'post_id']) ?? '';
    const parsedTweetId = extractTweetId(postUrl);
    const tweetId = parsedTweetId || (isTweetId(idCandidate) ? idCandidate : '');
    const mediaType = getStringValue(post, ['media_type', 'mediaType']) as
      | 'video'
      | 'image'
      | 'none'
      | undefined;
    return {
      id: getStringValue(post, ['id', 'post_id', 'tweet_id', 'tweetId']) ?? fallbackId,
      gameId: getStringValue(post, ['game_id', 'gameId', 'game']) ?? '',
      postUrl,
      tweetId,
      postedAt: getStringValue(post, ['posted_at', 'postedAt', 'timestamp']) ?? '',
      hasVideo: getBooleanValue(post, ['has_video', 'hasVideo', 'video']),
      mediaType,
      videoUrl: getStringValue(post, ['video_url', 'videoUrl']),
      imageUrl: getStringValue(post, ['image_url', 'imageUrl']),
      sourceHandle: getStringValue(post, ['source_handle', 'sourceHandle', 'handle']),
      tweetText: getStringValue(post, ['tweet_text', 'tweetText', 'text']),
      team: getStringValue(post, ['team', 'team_id', 'teamId']) ?? '',
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
