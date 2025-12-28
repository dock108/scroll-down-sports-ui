import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const DatePicker = () => {
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
    <PageLayout className="flex flex-col justify-center">
      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Scroll Down Sports</p>
        <h1 className="text-4xl font-semibold">Pick your spoiler-safe date range</h1>
        <p className="text-gray-600">
          Browse finished games without scores. Highlights scroll like an article. Reveal the final score only when you say so.
        </p>
        {parsedParams.hasInvalid ? (
          <p className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-700">
            Invalid dates detected — defaults loaded.
          </p>
        ) : null}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="text-xs uppercase tracking-[0.3em] text-gray-500">Date range</label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary btn-primary--md btn-primary--pill btn-shadow-sm mt-5"
          >
            Load games
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default DatePicker;

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
