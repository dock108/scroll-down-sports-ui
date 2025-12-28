import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/tweetMask.css';

interface PostEmbedProps {
  postUrl: string;
  hasVideo: boolean;
}

const EMBED_TIMEOUT_MS = 5000;

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

const normalizePostUrl = (url: string) => {
  if (!url) return '';

  let normalized = url.trim();

  // Ensure the URL has a scheme so that URL parsing is reliable
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const urlObj = new URL(normalized);

    // Normalize legacy X URLs to twitter.com based on hostname, not substrings
    if (urlObj.hostname === 'x.com' || urlObj.hostname === 'www.x.com') {
      urlObj.hostname = 'twitter.com';
    }

    return urlObj.toString();
  } catch {
    // If the URL is invalid, return an empty string to avoid emitting a bad href
    return '';
  }
};

const PostEmbed = ({ postUrl, hasVideo }: PostEmbedProps) => {
  const normalizedUrl = useMemo(() => normalizePostUrl(postUrl), [postUrl]);
  const [embedStatus, setEmbedStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [locallyRevealed, setLocallyRevealed] = useState(false);
  const embedTimeout = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevUrlRef = useRef(normalizedUrl);

  // Reset local reveal state when URL changes (new post)
  if (prevUrlRef.current !== normalizedUrl) {
    prevUrlRef.current = normalizedUrl;
    setLocallyRevealed(false);
  }

  // Derive isRevealed directly to avoid one-frame delay
  const isRevealed = spoilersAllowed || locallyRevealed;

  useEffect(() => {
    let isActive = true;
    if (!isRevealed) {
      setEmbedStatus('loading');
      return () => {
        isActive = false;
      };
    }

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
  }, [isRevealed, normalizedUrl]);

  return (
    <div className="space-y-1 mb-2">
      <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
        <span>{hasVideo ? 'Video Highlight' : 'Moment'}</span>
        <span>Official Team Post</span>
      </div>
      {!isRevealed ? (
        <div className="tweet-shell flex flex-col items-center justify-center gap-4 px-6 text-center text-gray-600">
          <div className="rounded-full bg-gray-100 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-gray-500">
            Spoiler Safe
          </div>
          <p className="text-sm">
            This highlight stays hidden until you choose to reveal it.
          </p>
          <button
            type="button"
            onClick={() => setLocallyRevealed(true)}
            className="rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Reveal Highlight
          </button>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
            Scores stay hidden until you tap reveal
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="tweet-shell focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
        >
          <blockquote className="twitter-tweet">
            <a href={normalizedUrl}></a>
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
                <a href={normalizedUrl} target="_blank" rel="noreferrer">
                  open on X
                </a>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PostEmbed;
