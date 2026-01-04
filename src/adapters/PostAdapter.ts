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
  containsScore?: boolean;
}

export interface PostAdapter {
  getPostsForGame(gameId: string): Promise<TimelinePost[]>;
}

// Note: Backend should enforce allowed media_type values; UI normalizes defensively for now.
export function normalizeMediaType(
  mediaType: string | null,
  videoUrl?: string | null,
  imageUrl?: string | null,
  hasVideoFlag?: boolean,
): 'video' | 'image' | 'none' {
  if (mediaType === 'video') return 'video';
  if (mediaType === 'image') return 'image';
  const hasVideo = Boolean(videoUrl);
  const hasImage = Boolean(imageUrl);
  // When both URLs exist but there is no valid explicit backend mediaType, prefer video.
  if (hasVideo) return 'video';
  // If has_video flag is true but no URL, still mark as video for proper fallback display
  if (hasVideoFlag && !hasVideo) return 'video';
  if (hasImage) return 'image';
  return 'none';
}
