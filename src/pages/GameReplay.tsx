import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { XHighlight } from '../components/embeds/XHighlight';
import { DataError } from '../components/feedback/DataError';
import { PageLayout } from '../components/layout/PageLayout';
import { FinalStats } from '../components/scores/FinalStats';
import { GameHeader } from '../components/scores/GameHeader';
import { TimelineDivider } from '../components/timeline/TimelineDivider';
import { GameDetails } from '../adapters/GameAdapter';
import { TimelinePost } from '../adapters/PostAdapter';
import { getGameAdapter, getSocialPostAdapter, ApiConnectionError } from '../adapters';

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

export const GameReplay = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameDetails | null | undefined>(undefined);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [statsRevealed, setStatsRevealed] = useState(false);

  // Trigger auto-reveal once the reader scrolls past the last highlight.
  const statsRevealTriggerRef = useRef<HTMLDivElement | null>(null);

  const gameAdapter = useMemo(() => getGameAdapter(), []);
  const postAdapter = useMemo(() => getSocialPostAdapter(), []);

  useEffect(() => {
    let isActive = true;

    const loadGameData = async () => {
      setIsLoading(true);
      setError(null);

      if (!gameId) {
        setGame(null);
        setTimelinePosts([]);
        setIsLoading(false);
        return;
      }

      try {
        const [gameResult, postResult] = await Promise.all([
          gameAdapter.getGameById(gameId),
          postAdapter.getPostsForGame(gameId),
        ]);

        if (isActive) {
          setGame(gameResult);
          setTimelinePosts(postResult);
          setIsLoading(false);
        }
      } catch (err) {
        if (isActive) {
          if (err instanceof ApiConnectionError) {
            setError(err.message);
          } else {
            setError('Failed to load game');
          }
          setGame(null);
          setTimelinePosts([]);
          setIsLoading(false);
        }
      }
    };

    loadGameData();

    return () => {
      isActive = false;
    };
  }, [gameAdapter, gameId, postAdapter, retryCount]);

  // Auto-reveal stats only after the timeline is finished to avoid spoilers.
  useEffect(() => {
    if (statsRevealed || !statsRevealTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setStatsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(statsRevealTriggerRef.current);

    return () => observer.disconnect();
  }, [statsRevealed, isLoading]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  if (error) {
    return (
      <PageLayout contentClassName="space-y-0">
        <DataError message={error} onRetry={handleRetry} />
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout contentClassName="space-y-0">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 rounded-full bg-gray-200"></div>
          <div className="h-8 w-3/4 rounded-full bg-gray-200"></div>
          <div className="h-5 w-2/3 rounded-full bg-gray-200"></div>
        </div>
        <div className="mt-10 space-y-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`timeline-skeleton-${index}`} className="x-highlight__loading-card">
              <div className="x-highlight__loading-media" aria-hidden="true">
                <div className="x-highlight__media-skeleton" />
              </div>
              <div className="x-highlight__caption-skeleton">
                <div className="x-highlight__caption-bar"></div>
                <div className="x-highlight__caption-bar x-highlight__caption-bar--short"></div>
              </div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (!game) {
    return (
      <PageLayout contentClassName="space-y-0">
        <p className="text-gray-600">Game not found.</p>
        <Link className="mt-4 inline-flex text-blue-600 underline" to="/games">
          Back to games
        </Link>
      </PageLayout>
    );
  }

  const dateLabel = formatGameDate(game.date);

  return (
    <PageLayout className="pt-10 pb-28" contentClassName="space-y-12">
      <Link className="text-xs uppercase tracking-[0.3em] text-gray-500" to="/games">
        Back to games
      </Link>
      <GameHeader
        awayTeam={game.awayTeam || 'Away'}
        homeTeam={game.homeTeam || 'Home'}
        venue={game.venue ?? 'Venue TBD'}
        dateLabel={dateLabel}
      />
      <section className="space-y-8">
        {timelinePosts.length ? (
          timelinePosts.map((post) => (
            <XHighlight key={post.id} post={post} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-gray-500">
            This game has no highlight posts available yet.
          </div>
        )}
      </section>
      <TimelineDivider />
      {/* This invisible marker triggers the spoiler-safe reveal once reached. */}
      <div ref={statsRevealTriggerRef} aria-hidden="true" />
      <FinalStats
        revealed={statsRevealed}
        homeTeam={game.homeTeam || 'Home'}
        awayTeam={game.awayTeam || 'Away'}
        attendance={game.attendance ?? 0}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
        teamStats={game.teamStats}
        playerStats={game.playerStats}
      />
    </PageLayout>
  );
};
