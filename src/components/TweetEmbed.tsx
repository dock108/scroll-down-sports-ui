import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/tweetMask.css';

type TweetVariant = 'default' | 'highlight';

interface TweetEmbedProps {
  tweetId: string;
  variant?: TweetVariant;
  limitHeight?: boolean;
}

const EMBED_TIMEOUT_MS = 6000;

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

const TweetEmbed = ({ tweetId, variant = 'default', limitHeight }: TweetEmbedProps) => {
  const [embedStatus, setEmbedStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const embedTimeout = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isHighlight = variant === 'highlight';
  const shouldLimit = useMemo(() => limitHeight ?? !isHighlight, [limitHeight, isHighlight]);
  const tweetUrl = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : '';

  useEffect(() => {
    let isActive = true;

    setEmbedStatus('loading');
    setIsExpanded(false);
    setIsExpandable(false);

    if (!tweetId) {
      setEmbedStatus('failed');
      return undefined;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    loadTwitterScript()
      .then(() => {
        if (!isActive || !containerRef.current) {
          return undefined;
        }
        // @ts-expect-error - twitter widgets is a global
        const createTweet = window.twttr?.widgets?.createTweet;
        if (!createTweet) {
          throw new Error('Twitter widgets unavailable');
        }

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

        return createTweet(tweetId, containerRef.current, {
          align: 'center',
          conversation: 'none',
          dnt: true,
          width: 550,
        });
      })
      .then(() => {
        if (!isActive) {
          return;
        }
        setEmbedStatus('ready');
        if (embedTimeout.current) {
          window.clearTimeout(embedTimeout.current);
          embedTimeout.current = null;
        }

        if (!shouldLimit) {
          return;
        }

        window.requestAnimationFrame(() => {
          if (!isActive || !wrapperRef.current) {
            return;
          }
          const wrapper = wrapperRef.current;
          const overflow = wrapper.scrollHeight - wrapper.clientHeight > 16;
          setIsExpandable(overflow);
        });
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
  }, [tweetId, shouldLimit]);

  const wrapperClasses = [
    'tweet-wrapper',
    isHighlight ? 'is-highlight' : '',
    shouldLimit && !isExpanded ? 'limited' : '',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'focus-visible:outline-blue-200',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1 mb-2">
      <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
        <span>{isHighlight ? 'Video Highlight' : 'Moment'}</span>
        <span>Official Team Post</span>
      </div>
      <div ref={wrapperRef} className={wrapperClasses}>
        <div ref={containerRef} className={isHighlight ? 'video-frame' : undefined} />
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
              Highlight unavailable{' '}
              {tweetUrl ? (
                <a href={tweetUrl} target="_blank" rel="noreferrer">
                  open on X
                </a>
              ) : null}
            </p>
          </div>
        ) : null}
        {shouldLimit && isExpandable ? (
          <button
            type="button"
            className="tweet-expand"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default TweetEmbed;
