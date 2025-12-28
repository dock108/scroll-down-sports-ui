import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import PostEmbed from '../components/PostEmbed';
import TimelineDivider from '../components/TimelineDivider';
import StatsTeaser from '../components/StatsTeaser';
import RevealScoreButton from '../components/RevealScoreButton';
import FinalStats from '../components/FinalStats';
import DataError from '../components/DataError';
import PageLayout from '../components/PageLayout';
import useSpoilerState from '../hooks/useSpoilerState';
import { GameDetails } from '../adapters/GameAdapter';
import { TimelinePost } from '../adapters/PostAdapter';
import { getGameAdapter, getSocialPostAdapter, ApiConnectionError } from '../adapters';
import { logUiEvent } from '../utils/uiTelemetry';

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

const GameReplay = () => {
  const { gameId } = useParams();
  const { spoilersAllowed, revealSpoilers } = useSpoilerState();
  const [game, setGame] = useState<GameDetails | null | undefined>(undefined);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
            <div key={`timeline-skeleton-${index}`} className="tweet-shell">
              <div className="tweet-skeleton">
                <div className="tweet-skeleton__bar"></div>
                <div className="tweet-skeleton__bar"></div>
                <div className="tweet-skeleton__bar"></div>
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
            <PostEmbed
              key={post.id}
              postUrl={post.postUrl}
              hasVideo={post.hasVideo ?? false}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-gray-500">
            This game has no highlight posts available yet.
          </div>
        )}
      </section>
      <TimelineDivider />
      {!spoilersAllowed ? (
        <section className="space-y-6 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Final stats are hidden — reveal when ready</p>
          </div>
          <StatsTeaser />
          <RevealScoreButton
            onReveal={() => {
              revealSpoilers();
              logUiEvent('reveal_clicked');
            }}
          />
        </section>
      ) : null}
      <FinalStats
        revealed={spoilersAllowed}
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

export default GameReplay;
