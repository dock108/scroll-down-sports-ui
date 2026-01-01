import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: object
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

interface TwitterEmbedProps {
  tweetUrl: string;
  tweetId?: string;
}

export function TwitterEmbed({ tweetUrl, tweetId: providedTweetId }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedCreated = useRef(false);

  const tweetId = providedTweetId || tweetUrl.match(/status\/(\d+)/)?.[1];

  useEffect(() => {
    if (!tweetId || !containerRef.current || embedCreated.current) return;

    const embed = () => {
      if (!window.twttr || embedCreated.current || !containerRef.current) return;
      embedCreated.current = true;
      window.twttr.widgets.createTweet(tweetId, containerRef.current, {
        theme: 'dark',
        conversation: 'none',
      });
    };

    if (!window.twttr) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', embed);
      } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = embed;
        document.body.appendChild(script);
      }
    } else {
      embed();
    }
  }, [tweetId]);

  if (!tweetId) {
    return (
      <div className="twitter-embed-fallback">
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
          🎥 Watch video on X →
        </a>
      </div>
    );
  }

  return <div ref={containerRef} className="twitter-embed" style={{ minHeight: 200 }} />;
}

