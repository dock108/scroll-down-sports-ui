export interface TimelinePost {
  id: string;
  gameId: string;
  team: string;
  postUrl: string;
  tweetId: string;
  postedAt: string;
  hasVideo: boolean;
  mediaType: 'video' | 'image' | 'none';
  mediaTypeRaw?: string | null;
  videoUrl: string;
  imageUrl: string;
  sourceHandle: string;
  tweetText: string;
}

export interface PostAdapter {
  getPostsForGame(gameId: string): Promise<TimelinePost[]>;
}

// TODO: Backend should enforce allowed media_type values; UI normalizes defensively for now.
export function normalizeMediaType(
  mediaType: string | null,
  videoUrl?: string | null,
  imageUrl?: string | null,
): 'video' | 'image' | 'none' {
  if (mediaType === 'video' || (!!videoUrl && mediaType !== 'image')) return 'video';
  if (mediaType === 'image' || !!imageUrl) return 'image';
  return 'none';
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
