import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GameSummary } from '../adapters/GameAdapter';
import { getGameAdapter, ApiConnectionError } from '../adapters';
import DataError from '../components/DataError';
import PageLayout from '../components/PageLayout';

const getDateLabel = (value?: string) => {
  if (!value) {
    return 'Date TBD';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const parseQueryDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const GameList = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const start = query.get('start');
  const end = query.get('end');
  const adapter = useMemo(() => getGameAdapter(), []);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoize parsed dates to prevent infinite re-renders
  const startDate = useMemo(() => parseQueryDate(start), [start]);
  const endDate = useMemo(() => parseQueryDate(end), [end]);

  const hasInvalidParams =
    (start && !startDate) || (end && !endDate) || (!!startDate && !!endDate && startDate > endDate);

  useEffect(() => {
    let isActive = true;

    const loadGames = async () => {
      setIsLoading(true);
      setError(null);

      const hasRangeIssue = !!startDate && !!endDate && startDate > endDate;
      const filteredStart = hasRangeIssue ? null : startDate;
      const filteredEnd = hasRangeIssue ? null : endDate;

      try {
        const results = await adapter.getGamesByDateRange(
          filteredStart ?? new Date('invalid'),
          filteredEnd ?? new Date('invalid'),
        );

        if (isActive) {
          setGames(results.filter((game) => game.id));
          setIsLoading(false);
        }
      } catch (err) {
        if (isActive) {
          if (err instanceof ApiConnectionError) {
            setError(err.message);
          } else {
            setError('Failed to load games');
          }
          setGames([]);
          setIsLoading(false);
        }
      }
    };

    loadGames();

    return () => {
      isActive = false;
    };
  }, [adapter, startDate, endDate, retryCount]);

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

  return (
    <PageLayout>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Games</p>
        <h1 className="text-3xl font-semibold">Choose a game to replay</h1>
        {start || end ? (
          <p className="text-gray-600">
            Showing games {start ? `from ${start}` : ''} {end ? `to ${end}` : ''}
          </p>
        ) : (
          <p className="text-gray-600">Select a date range to load games.</p>
        )}
        {hasInvalidParams ? (
          <p className="text-sm text-amber-700">
            Invalid date range supplied. Showing all available games.
          </p>
        ) : null}
      </div>
      <div>
        {isLoading ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={`skeleton-${index}`} className="py-4 border-b border-gray-200">
              <div className="space-y-3 animate-pulse">
                <div className="h-3 w-32 rounded-full bg-gray-200"></div>
                <div className="h-6 w-2/3 rounded-full bg-gray-200"></div>
                <div className="h-4 w-1/3 rounded-full bg-gray-200"></div>
              </div>
            </div>
          ))
        ) : games.length ? (
          games.map((game) => (
            <Link
              key={game.id}
              to={`/game/${game.id}`}
              className="block w-full text-left py-4 border-b border-gray-200 transition hover:bg-gray-50"
            >
              <div className="font-medium">
                {game.awayTeam || 'Away'} at {game.homeTeam || 'Home'}
              </div>
              <div className="text-sm text-gray-600">
                {getDateLabel(game.date)} — {game.venue ?? 'Venue TBD'}
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-gray-500">
            No finished games in this range.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default GameList;
