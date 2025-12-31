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

// Note: Backend should enforce allowed media_type values; UI normalizes defensively for now.
export function normalizeMediaType(
  mediaType: string | null,
  videoUrl?: string | null,
  imageUrl?: string | null,
): 'video' | 'image' | 'none' {
  if (mediaType === 'video') return 'video';
  if (mediaType === 'image') return 'image';
  const hasVideo = Boolean(videoUrl);
  const hasImage = Boolean(imageUrl);
  // When both URLs exist but there is no valid explicit backend mediaType, prefer video.
  if (hasVideo) return 'video';
  if (hasImage) return 'image';
  return 'none';
}
