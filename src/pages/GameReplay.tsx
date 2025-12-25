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

const DWELL_TIME_MS = 1400;
const VELOCITY_THRESHOLD = 0.7;
const END_BUFFER_PX = 240;
const ORIENTATION_LOCK_MS = 1800;

const GameReplay = () => {
  const { gameId } = useParams();
  const { spoilersAllowed, revealSpoilers } = useSpoilerState();
  const [canReveal, setCanReveal] = useState(false);
  const [game, setGame] = useState<GameDetails | null | undefined>(undefined);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const lastScrollY = useRef<number | null>(null);
  const lastScrollTime = useRef<number | null>(null);
  const dwellTimer = useRef<number | null>(null);
  const orientationLockUntil = useRef<number | null>(null);

  const gameAdapter = useMemo(() => new MockGameAdapter(), []);
  const postAdapter = useMemo(() => new MockPostAdapter(), []);

  useEffect(() => {
    let isActive = true;

    const loadGameData = async () => {
      if (!gameId) {
        if (isActive) {
          setGame(null);
          setTimelinePosts([]);
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
      }
    };

    loadGameData().catch((error) => {
      console.warn('Failed to load game data.', error);
      if (isActive) {
        setGame(null);
        setTimelinePosts([]);
      }
    });

    return () => {
      isActive = false;
    };
  }, [gameAdapter, gameId, postAdapter]);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (orientationLockUntil.current && now < orientationLockUntil.current) {
        setCanReveal(false);
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
              setCanReveal(true);
              dwellTimer.current = null;
            }, DWELL_TIME_MS);
          }
        } else {
          setCanReveal(false);
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
      setCanReveal(false);
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
  }, []);

  if (game === undefined) {
    return null;
  }

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
        <p className="text-slate-300">Game not found.</p>
        <Link className="mt-4 inline-flex text-emerald-300" to="/games">
          Back to games
        </Link>
      </main>
    );
  }

  const dateLabel = formatGameDate(game.date);

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-12 px-6 py-12">
      <Link className="text-xs uppercase tracking-[0.3em] text-slate-500" to="/games">
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
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6 text-slate-400">
            No highlights available.
          </div>
        )}
      </section>
      <TimelineDivider />
      <section className="space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
          Final stats are hidden until you reveal the score
        </p>
        <StatsTeaser />
      </section>
      {!spoilersAllowed ? <RevealScoreButton enabled={canReveal} onReveal={revealSpoilers} /> : null}
      {spoilersAllowed ? (
        <FinalStats
          homeTeam={game.homeTeam || 'Home'}
          awayTeam={game.awayTeam || 'Away'}
          attendance={game.attendance ?? 0}
        />
      ) : null}
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
