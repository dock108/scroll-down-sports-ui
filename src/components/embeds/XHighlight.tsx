import { useEffect, useRef, useState } from 'react';
import type { TimelinePost } from '../../adapters/PostAdapter';

type MediaType = 'video' | 'image' | 'none';

// Heuristic pattern for spoiler scores, e.g. "102-98" or "120 - 115".
// Note: This may occasionally match non-score digit ranges, which is acceptable
// for our spoiler-filter use case. If we need stricter detection in the future,
// we can refine this to include more contextual cues (team names, sport keywords, etc.).
const SCORE_PATTERN = /\b\d{2,3}\s*-\s*\d{2,3}\b/;
const CAPTION_MAX_CHARS = 140;

const getHandleFromUrl = (postUrl: string) => {
  if (!postUrl) return '';
  let normalized = postUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const parsed = new URL(normalized);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (!segments.length || segments[0] === 'i') {
      return '';
    }
    return segments[0];
  } catch {
    return '';
  }
};

const normalizeHandle = (handle?: string, postUrl?: string) => {
  const cleaned = (handle || '').replace(/^@/, '').trim();
  if (cleaned) return cleaned;
  const fromUrl = getHandleFromUrl(postUrl || '');
  return fromUrl || 'x';
};

const applySpoilerFilter = (text: string) => {
  const match = text.match(SCORE_PATTERN);
  if (!match || match.index === undefined) return text;
  const trimmed = text.slice(0, match.index).trimEnd();
  if (!trimmed) return '…';
  return `${trimmed}…`;
};

const XIcon = () => (
  <svg
    className="x-highlight__icon"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M18.9 2H22l-7.5 8.6L23.4 22h-6.8l-5.3-6.5L5.7 22H2.6l8.1-9.3L.8 2h6.9l4.8 6.1L18.9 2zm-1.2 18h1.7L7.1 3.9H5.3L17.7 20z"
      fill="currentColor"
    />
  </svg>
);

export const XHighlight = ({ post }: { post: TimelinePost }) => {
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaType: MediaType = post.mediaType;

  const handle = normalizeHandle(post.sourceHandle, post.postUrl);
  const rawText = post.tweetText.trim();
  const spoilerSafeText = applySpoilerFilter(rawText);
  const hasCaptionText = Boolean(spoilerSafeText);
  const shouldClamp = hasCaptionText && spoilerSafeText.length > CAPTION_MAX_CHARS;

  useEffect(() => {
    if (!mediaRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(mediaRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMediaLoaded(false);
    setMediaFailed(false);
  }, [post.id, post.videoUrl, post.imageUrl, mediaType]);

  useEffect(() => {
    const rawValue = post.mediaTypeRaw;
    if (!rawValue) return;
    if (rawValue !== 'video' && rawValue !== 'image' && rawValue !== 'none' && rawValue !== mediaType) {
      console.warn('[SocialPost] Unexpected media_type value, normalized:', rawValue);
    }
  }, [mediaType, post.mediaTypeRaw]);

  const hasVideo = mediaType === 'video' && Boolean(post.videoUrl);
  const hasImage = mediaType === 'image' && Boolean(post.imageUrl);
  const shouldLoadMedia = isInView && (hasVideo || hasImage);
  const showFallback =
    mediaType !== 'none' && ((!hasVideo && !hasImage) || mediaFailed);
  const showSkeleton = mediaType !== 'none' && !showFallback && !mediaLoaded;

  const captionTextClasses = [
    'x-highlight__caption-text',
    shouldClamp && !isExpanded ? 'x-highlight__caption-text--clamped' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const captionInner = (
    <>
      <span className="x-highlight__caption-handle">
        <XIcon />@{handle}
      </span>
      {hasCaptionText ? <span className={captionTextClasses}>{`: ${spoilerSafeText}`}</span> : null}
    </>
  );

  const captionLink = post.postUrl ? (
    <a
      href={post.postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="x-highlight__caption-link"
    >
      {captionInner}
    </a>
  ) : (
    <div className="x-highlight__caption-link">{captionInner}</div>
  );

  const captionContent = (
    <div className="x-highlight__caption">
      {captionLink}
      {shouldClamp ? (
        <button
          type="button"
          className="x-highlight__caption-toggle"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );

  const cardClasses = [
    'x-highlight__card',
    mediaType === 'none' ? 'x-highlight__card--caption-only' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className="x-highlight">
      <div className="x-highlight__meta">
        <span>{mediaType === 'video' ? 'Video Highlight' : 'Moment'}</span>
        <span>Official Team Post</span>
      </div>
      <div className={cardClasses}>
        {mediaType !== 'none' ? (
          <div ref={mediaRef} className="x-highlight__media">
            {showSkeleton ? <div className="x-highlight__media-skeleton" aria-hidden="true" /> : null}
            {showFallback ? (
              <div className="x-highlight__fallback">
                <p>
                  {mediaType === 'video'
                    ? 'Clip unavailable'
                    : mediaType === 'image'
                    ? 'Image unavailable'
                    : 'Media unavailable'}{' '}
                  —{' '}
                  {post.postUrl ? (
                    <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                      view post on X
                    </a>
                  ) : (
                    'view post on X'
                  )}
                </p>
              </div>
            ) : null}
            {shouldLoadMedia && hasVideo ? (
              <video
                className="x-highlight__video"
                controls
                playsInline
                preload="metadata"
                poster={post.imageUrl || undefined}
                onLoadedData={() => setMediaLoaded(true)}
                onError={() => setMediaFailed(true)}
              >
                <source src={post.videoUrl} type="video/mp4" />
              </video>
            ) : null}
            {shouldLoadMedia && !hasVideo && hasImage ? (
              <img
                className="x-highlight__image"
                src={post.imageUrl}
                alt={hasCaptionText ? spoilerSafeText : `X post from ${handle}`}
                loading="lazy"
                decoding="async"
                onLoad={() => setMediaLoaded(true)}
                onError={() => setMediaFailed(true)}
              />
            ) : null}
          </div>
        ) : null}
        {captionContent}
      </div>
    </article>
  );
};
