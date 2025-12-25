import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import TweetEmbed from '../components/TweetEmbed';
import TimelineDivider from '../components/TimelineDivider';
import StatsTeaser from '../components/StatsTeaser';
import RevealScoreButton from '../components/RevealScoreButton';
import FinalStats from '../components/FinalStats';
import useSpoilerState from '../hooks/useSpoilerState';
import { GameDetails, MockGameAdapter } from '../adapters/GameAdapter';
import { MockPostAdapter, TimelinePost } from '../adapters/PostAdapter';
import { logUiEvent } from '../utils/uiTelemetry';

const DWELL_TIME_MS = 1400;
const VELOCITY_THRESHOLD = 0.7;
const END_BUFFER_PX = 240;
const ORIENTATION_LOCK_MS = 1800;

const GameReplay = () => {
  const { gameId } = useParams();
  const { spoilersAllowed, revealSpoilers } = useSpoilerState();
  const [revealUnlocked, setRevealUnlocked] = useState(false);
  const [game, setGame] = useState<GameDetails | null | undefined>(undefined);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastScrollY = useRef<number | null>(null);
  const lastScrollTime = useRef<number | null>(null);
  const dwellTimer = useRef<number | null>(null);
  const orientationLockUntil = useRef<number | null>(null);

  const gameAdapter = useMemo(() => new MockGameAdapter(), []);
  const postAdapter = useMemo(() => new MockPostAdapter(), []);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    const loadGameData = async () => {
      if (!gameId) {
        if (isActive) {
          setGame(null);
          setTimelinePosts([]);
          setIsLoading(false);
        }
        return;
      }

      const [gameResult, postResult] = await Promise.all([
        gameAdapter.getGameById(gameId),
        postAdapter.getPostsForGame(gameId),
      ]);

      if (isActive) {
        setGame(gameResult);
        setTimelinePosts(postResult);
        setIsLoading(false);
      }
    };

    loadGameData().catch((error) => {
      console.warn('Failed to load game data.', error);
      if (isActive) {
        setGame(null);
        setTimelinePosts([]);
        setIsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [gameAdapter, gameId, postAdapter]);

  useEffect(() => {
    const handleScroll = () => {
      if (revealUnlocked || spoilersAllowed) {
        return;
      }
      const now = Date.now();
      if (orientationLockUntil.current && now < orientationLockUntil.current) {
        return;
      }
      const currentY = window.scrollY;
      const lastY = lastScrollY.current;
      const lastTime = lastScrollTime.current;

      if (lastY !== null && lastTime !== null) {
        const deltaY = Math.abs(currentY - lastY);
        const deltaT = Math.max(now - lastTime, 1);
        const velocity = deltaY / deltaT;
        const nearEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - END_BUFFER_PX;

        if (velocity < VELOCITY_THRESHOLD && nearEnd) {
          if (!dwellTimer.current) {
            dwellTimer.current = window.setTimeout(() => {
              setRevealUnlocked(true);
              logUiEvent('scroll_boundary_reached');
              dwellTimer.current = null;
            }, DWELL_TIME_MS);
          }
        } else {
          if (dwellTimer.current) {
            window.clearTimeout(dwellTimer.current);
            dwellTimer.current = null;
          }
        }
      }

      lastScrollY.current = currentY;
      lastScrollTime.current = now;
    };

    const handleOrientationChange = () => {
      orientationLockUntil.current = Date.now() + ORIENTATION_LOCK_MS;
      if (dwellTimer.current) {
        window.clearTimeout(dwellTimer.current);
        dwellTimer.current = null;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (dwellTimer.current) {
        window.clearTimeout(dwellTimer.current);
        dwellTimer.current = null;
      }
    };
  }, [revealUnlocked, spoilersAllowed]);

  useEffect(() => {
    setRevealUnlocked(false);
  }, [gameId]);

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 rounded-full bg-gray-200"></div>
          <div className="h-8 w-3/4 rounded-full bg-gray-200"></div>
          <div className="h-5 w-2/3 rounded-full bg-gray-200"></div>
        </div>
        <div className="mt-10 space-y-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`timeline-skeleton-${index}`} className="tweet-shell">
              <div className="tweet-skeleton">
                <div className="tweet-skeleton__bar"></div>
                <div className="tweet-skeleton__bar"></div>
                <div className="tweet-skeleton__bar"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <p className="text-gray-600">Game not found.</p>
        <Link className="mt-4 inline-flex text-blue-600 underline" to="/games">
          Back to games
        </Link>
      </main>
    );
  }

  const dateLabel = formatGameDate(game.date);
  const showRevealButton = revealUnlocked && !spoilersAllowed;

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-12 px-6 pb-28 pt-10">
      <Link className="text-xs uppercase tracking-[0.3em] text-gray-500" to="/games">
        Back to games
      </Link>
      <GameHeader
        awayTeam={game.awayTeam || 'Away'}
        homeTeam={game.homeTeam || 'Home'}
        venue={game.venue ?? 'Venue TBD'}
        dateLabel={dateLabel}
      />
      <section className="space-y-10">
        {timelinePosts.length ? (
          timelinePosts.map((post) => (
            <TweetEmbed
              key={post.id}
              tweetUrl={post.tweetUrl}
              hasVideo={post.hasVideo ?? false}
              spoilersAllowed={spoilersAllowed}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-gray-500">
            This game has no highlight posts available yet.
          </div>
        )}
      </section>
      <TimelineDivider />
      <section className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Final stats (hidden)</p>
          <p className="text-sm text-gray-600">Reveal when you’re ready.</p>
        </div>
        <StatsTeaser />
      </section>
      {showRevealButton ? (
        <RevealScoreButton
          onReveal={() => {
            revealSpoilers();
            logUiEvent('reveal_clicked');
          }}
        />
      ) : null}
      <FinalStats
        revealed={spoilersAllowed}
        homeTeam={game.homeTeam || 'Home'}
        awayTeam={game.awayTeam || 'Away'}
        attendance={game.attendance ?? 0}
      />
    </main>
  );
};

export default GameReplay;

const formatGameDate = (value?: string) => {
  if (!value) {
    return 'Date TBD';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
