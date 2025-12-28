import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const normalizeDateParam = (value: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return value;
};

export const DatePicker = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const [startDate, setStartDate] = useState('2024-03-10');
  const [endDate, setEndDate] = useState('2024-03-11');

  const parsedParams = useMemo(() => {
    const parsedStart = normalizeDateParam(startParam);
    const parsedEnd = normalizeDateParam(endParam);
    const hasInvalid =
      (startParam !== null && startParam !== '' && !parsedStart) ||
      (endParam !== null && endParam !== '' && !parsedEnd);
    return { parsedStart, parsedEnd, hasInvalid };
  }, [endParam, startParam]);

  useEffect(() => {
    if (parsedParams.parsedStart) {
      setStartDate(parsedParams.parsedStart);
    }
    if (parsedParams.parsedEnd) {
      setEndDate(parsedParams.parsedEnd);
    }
  }, [parsedParams.parsedEnd, parsedParams.parsedStart]);

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (startDate) {
      params.set('start', startDate);
    }
    if (endDate) {
      params.set('end', endDate);
    }
    navigate(`/games?${params.toString()}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12 sm:px-8">
      <div className="space-y-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Scroll Down Sports</p>
          <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
            Experience finished games spoiler-free
          </h1>
          <p className="max-w-2xl text-base text-gray-600 sm:text-lg">
            Pick a date range to browse completed matchups with no scores shown. Read the game story
            like an article, then reveal the final when you&apos;re ready.
          </p>
        </div>
        {parsedParams.hasInvalid ? (
          <p className="text-sm font-medium text-amber-700">
            Invalid dates detected — defaults loaded.
          </p>
        ) : null}
        <div className="space-y-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex-1 space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Browse games
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
