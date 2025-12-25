import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GameSummary, MockGameAdapter } from '../adapters/GameAdapter';

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

const GameList = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const start = query.get('start');
  const end = query.get('end');
  const adapter = useMemo(() => new MockGameAdapter(), []);
  const [games, setGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    let isActive = true;

    const loadGames = async () => {
      const startDate = parseQueryDate(start);
      const endDate = parseQueryDate(end);
      const results = await adapter.getGamesByDateRange(
        startDate ?? new Date('invalid'),
        endDate ?? new Date('invalid'),
      );

      if (isActive) {
        setGames(results.filter((game) => game.id));
      }
    };

    loadGames().catch((error) => {
      console.warn('Failed to load games.', error);
      if (isActive) {
        setGames([]);
      }
    });

    return () => {
      isActive = false;
    };
  }, [adapter, end, start]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Games</p>
        <h1 className="text-3xl font-semibold">Choose a game to replay</h1>
        {start || end ? (
          <p className="text-slate-400">
            Showing games {start ? `from ${start}` : ''} {end ? `to ${end}` : ''}
          </p>
        ) : (
          <p className="text-slate-500">Select a date range to load mock games.</p>
        )}
      </div>
      <div className="mt-8 grid gap-4">
        {games.length ? (
          games.map((game) => (
            <Link
              key={game.id}
              to={`/game/${game.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    {getDateLabel(game.date)}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {game.awayTeam || 'Away'} at {game.homeTeam || 'Home'}
                  </h2>
                </div>
                <div className="text-sm text-slate-400">{game.venue ?? 'Venue TBD'}</div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-slate-400">
            No games found in this range yet.
          </div>
        )}
      </div>
    </main>
  );
};

export default GameList;

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
