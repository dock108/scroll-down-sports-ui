import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/tweetMask.css';

interface TweetEmbedProps {
  tweetUrl: string;
  hasVideo: boolean;
  spoilersAllowed: boolean;
}

const TweetEmbed = ({ tweetUrl, hasVideo, spoilersAllowed }: TweetEmbedProps) => {
  const [captionRevealed, setCaptionRevealed] = useState(false);
  const revealTimer = useRef<number | null>(null);

  const handleRevealIntent = () => {
    if (spoilersAllowed || revealTimer.current) {
      return;
    }
    revealTimer.current = window.setTimeout(() => {
      setCaptionRevealed(true);
      revealTimer.current = null;
    }, 600);
  };

  const handleRevealCancel = () => {
    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    if (!spoilersAllowed) {
      setCaptionRevealed(false);
    }
  };

  const maskVisible = useMemo(() => !spoilersAllowed && !captionRevealed, [spoilersAllowed, captionRevealed]);

  useEffect(() => {
    const scriptId = 'twitter-widgets-script';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!existing) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = 'https://platform.twitter.com/widgets.js';
      document.body.appendChild(script);
      script.addEventListener('load', () => {
        // @ts-expect-error - twitter widgets is a global
        window.twttr?.widgets?.load();
      });
    } else {
      // @ts-expect-error - twitter widgets is a global
      window.twttr?.widgets?.load();
    }
  }, [tweetUrl]);

  useEffect(() => {
    return () => {
      if (revealTimer.current) {
        window.clearTimeout(revealTimer.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
        <span>{hasVideo ? 'Video Highlight' : 'Moment'}</span>
        <span>Official Team Post</span>
      </div>
      <div
        className="tweet-shell"
        onMouseEnter={handleRevealIntent}
        onMouseLeave={handleRevealCancel}
        onFocus={handleRevealIntent}
        onBlur={handleRevealCancel}
        onTouchStart={handleRevealIntent}
        onTouchEnd={handleRevealCancel}
      >
        <blockquote className="twitter-tweet">
          <a href={tweetUrl}></a>
        </blockquote>
        {maskVisible ? (
          <div className="caption-mask">
            <span>Pause to preview caption</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TweetEmbed;
