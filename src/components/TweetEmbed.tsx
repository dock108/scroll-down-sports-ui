import { useEffect, useMemo, useRef, useState } from 'react';
import { logUiEvent } from '../utils/uiTelemetry';
import '../styles/tweetMask.css';

interface TweetEmbedProps {
  tweetUrl: string;
  hasVideo: boolean;
  spoilersAllowed: boolean;
}

const REVEAL_DWELL_MS = 700;
const EMBED_TIMEOUT_MS = 2500;

let twitterScriptPromise: Promise<void> | null = null;

const loadTwitterScript = () => {
  if (twitterScriptPromise) {
    return twitterScriptPromise;
  }

  twitterScriptPromise = new Promise((resolve, reject) => {
    const scriptId = 'twitter-widgets-script';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = 'https://platform.twitter.com/widgets.js';
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Twitter widgets failed to load')));
    document.body.appendChild(script);
  });

  return twitterScriptPromise;
};

const TweetEmbed = ({ tweetUrl, hasVideo, spoilersAllowed }: TweetEmbedProps) => {
  const [captionRevealed, setCaptionRevealed] = useState(false);
  const [embedStatus, setEmbedStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [maskHeight, setMaskHeight] = useState(90);
  const revealTimer = useRef<number | null>(null);
  const embedTimeout = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inViewRef = useRef(false);

  const clearRevealTimer = () => {
    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
  };

  const handleRevealIntent = () => {
    if (spoilersAllowed || revealTimer.current || !inViewRef.current) {
      return;
    }
    revealTimer.current = window.setTimeout(() => {
      setCaptionRevealed(true);
      logUiEvent('caption_unmasked');
      revealTimer.current = null;
    }, REVEAL_DWELL_MS);
  };

  const maskVisible = useMemo(
    () => embedStatus === 'ready' && !spoilersAllowed && !captionRevealed,
    [captionRevealed, embedStatus, spoilersAllowed],
  );

  useEffect(() => {
    let isActive = true;
    setEmbedStatus('loading');

    loadTwitterScript()
      .then(() => {
        if (!isActive) {
          return;
        }
        // @ts-expect-error - twitter widgets is a global
        window.twttr?.widgets?.load(containerRef.current ?? undefined);

        if (embedTimeout.current) {
          window.clearTimeout(embedTimeout.current);
        }

        embedTimeout.current = window.setTimeout(() => {
          if (!isActive) {
            return;
          }
          const iframe = containerRef.current?.querySelector('iframe');
          setEmbedStatus(iframe ? 'ready' : 'failed');
        }, EMBED_TIMEOUT_MS);
      })
      .catch(() => {
        if (isActive) {
          setEmbedStatus('failed');
        }
      });

    return () => {
      isActive = false;
      if (embedTimeout.current) {
        window.clearTimeout(embedTimeout.current);
        embedTimeout.current = null;
      }
    };
  }, [tweetUrl]);

  useEffect(() => {
    return () => {
      clearRevealTimer();
    };
  }, []);

  useEffect(() => {
    if (spoilersAllowed) {
      setCaptionRevealed(true);
    } else {
      setCaptionRevealed(false);
    }
  }, [spoilersAllowed]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const handleScroll = () => {
      clearRevealTimer();
      if (!spoilersAllowed && inViewRef.current) {
        setCaptionRevealed(false);
        handleRevealIntent();
      }
    };

    const handleResize = () => {
      clearRevealTimer();
      setCaptionRevealed(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [spoilersAllowed]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inViewRef.current = entry?.isIntersecting ?? false;
        if (!inViewRef.current && !spoilersAllowed) {
          clearRevealTimer();
          setCaptionRevealed(false);
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [spoilersAllowed]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const updateMaskHeight = () => {
      const containerHeight = containerRef.current?.getBoundingClientRect().height ?? 0;
      if (!containerHeight) {
        return;
      }
      const nextHeight = Math.min(160, Math.max(80, containerHeight * 0.28));
      setMaskHeight(nextHeight);
    };

    updateMaskHeight();
    const resizeObserver = new ResizeObserver(updateMaskHeight);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [embedStatus]);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-400">
        <span>{hasVideo ? 'Video Highlight' : 'Moment'}</span>
        <span>Official Team Post</span>
      </div>
      <div
        ref={containerRef}
        className="tweet-shell focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
        onFocus={handleRevealIntent}
        onBlur={clearRevealTimer}
        onClick={handleRevealIntent}
        tabIndex={0}
      >
        <blockquote className="twitter-tweet">
          <a href={tweetUrl}></a>
        </blockquote>
        {embedStatus === 'loading' ? (
          <div className="tweet-skeleton" aria-hidden="true">
            <div className="tweet-skeleton__bar"></div>
            <div className="tweet-skeleton__bar"></div>
            <div className="tweet-skeleton__bar"></div>
          </div>
        ) : null}
        {embedStatus === 'failed' ? (
          <div className="tweet-fallback">
            <p>
              Highlight unavailable —{' '}
              <a href={tweetUrl} target="_blank" rel="noreferrer">
                open on X
              </a>
            </p>
          </div>
        ) : null}
        {maskVisible ? (
          <div className="caption-mask" style={{ height: `${maskHeight}px` }}>
            <span>Pause to preview caption</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TweetEmbed;
