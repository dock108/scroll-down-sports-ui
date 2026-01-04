import type { TimelineEntry } from '../adapters/CatchupAdapter';

export type ResumeData = {
  scrollY: number;
  statsRevealed: boolean;
  updatedAt: number;
};

type ScoreSnapshot = {
  homeScore: number;
  awayScore: number;
};

export const RESUME_STORAGE_PREFIX = 'sds-resume-scroll-';
export const RESUME_DISMISS_PREFIX = 'sds-resume-dismissed-';
export const RESUME_SCROLL_THRESHOLD = 200;
export const RESUME_SAVE_DEBOUNCE_MS = 200;

export const getResumeStorageKey = (gameId: string) => `${RESUME_STORAGE_PREFIX}${gameId}`;
export const getResumeDismissKey = (gameId: string) => `${RESUME_DISMISS_PREFIX}${gameId}`;

export const parseResumeData = (value: string | null): ResumeData | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ResumeData;
    if (
      typeof parsed.scrollY === 'number' &&
      typeof parsed.statsRevealed === 'boolean' &&
      typeof parsed.updatedAt === 'number'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

export const formatGameDate = (value?: string) => {
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

/**
 * Groups timeline entries by period for rendering period dividers.
 */
export const groupByPeriod = (timeline: TimelineEntry[]): Map<number, TimelineEntry[]> => {
  const groups = new Map<number, TimelineEntry[]>();

  for (const entry of timeline) {
    const period = entry.event.period || 0;
    const existing = groups.get(period) || [];
    existing.push(entry);
    groups.set(period, existing);
  }

  return groups;
};

export const getScoreSnapshot = (entries: TimelineEntry[]): ScoreSnapshot | null => {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.event.homeScore !== undefined && entry?.event.awayScore !== undefined) {
      return {
        homeScore: entry.event.homeScore,
        awayScore: entry.event.awayScore,
      };
    }
  }
  return null;
};

export const getPeriodLabel = (period: number) => {
  if (period > 4) {
    return period === 5 ? 'Overtime' : `Overtime ${period - 4}`;
  }

  return ['', '1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'][period] || `Period ${period}`;
};

export const getPeriodShortLabel = (period: number) => {
  if (period > 4) {
    return period === 5 ? 'OT' : `OT${period - 4}`;
  }

  return period ? `Q${period}` : 'Period';
};
