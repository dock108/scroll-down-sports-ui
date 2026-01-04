import { useEffect, useId, useMemo, useState } from 'react';
import { ApiConnectionError, getAiSummaryAdapter, getPbpAdapter } from '../../adapters';
import type { PbpEvent } from '../../adapters/PbpAdapter';
import type { TimelineEntry } from '../../adapters/CatchupAdapter';
import { XHighlight } from '../embeds/XHighlight';
import { PbpEventRow } from './PbpEventRow';

interface ExpandableMomentCardProps {
  entry: TimelineEntry;
  index: number;
  showPbpScore?: boolean;
}

const buildMetaLabel = (entry: TimelineEntry) => {
  const parts: string[] = [];
  if (entry.event.period) {
    parts.push(`Q${entry.event.period}`);
  }
  if (entry.event.gameClock) {
    parts.push(entry.event.gameClock);
  }
  if (entry.event.team) {
    parts.push(entry.event.team);
  }
  return parts.join(' • ');
};

const SUMMARY_MAX_LENGTH = 200;
const SUMMARY_FALLBACK = 'AI summary unavailable right now.';
const SUMMARY_EMPTY = 'AI summary coming soon.';

const redactScores = (value: string) =>
  value
    .replace(/\b\d{1,3}\s*[-–—]\s*\d{1,3}\b/g, 'score redacted')
    .replace(/\b\d{1,3}\s+to\s+\d{1,3}\b/gi, 'score redacted')
    .replace(/final score[^.]*\./gi, 'Final score redacted.');

const formatSummary = (value: string) => {
  const compact = redactScores(value.replace(/\s+/g, ' ').trim());
  if (compact.length <= SUMMARY_MAX_LENGTH) {
    return compact;
  }
  const slice = compact.slice(0, SUMMARY_MAX_LENGTH);
  const cutoff = slice.lastIndexOf(' ');
  const trimmed = cutoff > 80 ? slice.slice(0, cutoff) : slice;
  return `${trimmed.trim()}…`;
};

export const ExpandableMomentCard = ({
  entry,
  index,
  showPbpScore = false,
}: ExpandableMomentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pbpEvents, setPbpEvents] = useState<PbpEvent[] | null>(null);
  const [pbpError, setPbpError] = useState<string | null>(null);
  const [isPbpLoading, setIsPbpLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const contentId = useId();
  const pbpAdapter = useMemo(() => getPbpAdapter(), []);
  const summaryAdapter = useMemo(() => getAiSummaryAdapter(), []);
  const metaLabel = useMemo(() => buildMetaLabel(entry), [entry]);
  const hasHighlights = entry.highlights.length > 0;
  const hasPbpContent =
    (pbpEvents && pbpEvents.length > 0) ||
    entry.event.description ||
    entry.event.eventType !== 'highlight';

  useEffect(() => {
    setSummary(null);
    setSummaryError(false);
    setIsSummaryLoading(false);
  }, [entry.momentId]);

  useEffect(() => {
    if (!isExpanded) return;

    let isActive = true;

    const loadMomentPbp = async () => {
      if (!entry.momentId) return;
      setIsPbpLoading(true);
      setPbpError(null);

      try {
        const events = await pbpAdapter.getEventsForMoment(entry.momentId);
        if (isActive) {
          setPbpEvents(events);
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof ApiConnectionError
              ? error.message
              : 'Unable to load play-by-play details.';
          setPbpError(message);
          setPbpEvents([]);
        }
      } finally {
        if (isActive) {
          setIsPbpLoading(false);
        }
      }
    };

    loadMomentPbp();
    const interval = window.setInterval(loadMomentPbp, 15000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [entry.momentId, isExpanded, pbpAdapter]);

  useEffect(() => {
    if (!isExpanded || !entry.momentId || summary || isSummaryLoading) return;

    let isActive = true;

    const loadSummary = async () => {
      setIsSummaryLoading(true);
      setSummaryError(false);

      try {
        const response = await summaryAdapter.getSummaryForMoment(entry.momentId);
        if (isActive) {
          setSummary(response);
        }
      } catch {
        if (isActive) {
          setSummaryError(true);
          setSummary(null);
        }
      } finally {
        if (isActive) {
          setIsSummaryLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isActive = false;
    };
  }, [entry.momentId, isExpanded, isSummaryLoading, summary, summaryAdapter]);

  const summaryText = summary ? formatSummary(summary) : null;
  const summaryMessage = summaryError ? SUMMARY_FALLBACK : SUMMARY_EMPTY;

  return (
    <article className="moment-card">
      <button
        type="button"
        className="moment-card__button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="moment-card__header">
          <div className="moment-card__label">Moment {index + 1}</div>
          {metaLabel && <div className="moment-card__meta">{metaLabel}</div>}
          <div className="moment-card__cta">Click to expand</div>
        </div>
        <span className={`moment-card__chevron ${isExpanded ? 'moment-card__chevron--open' : ''}`}>
          ▼
        </span>
      </button>

      <div
        id={contentId}
        className={`moment-card__content ${isExpanded ? 'moment-card__content--expanded' : ''}`}
      >
        <div className="moment-card__inner">
          <section className="moment-card__section">
            <h3 className="moment-card__section-title">AI summary</h3>
            {isSummaryLoading && !summaryText ? (
              <div className="moment-card__summary-loading" aria-label="Loading summary">
                <span className="moment-card__summary-bar" />
                <span className="moment-card__summary-bar moment-card__summary-bar--short" />
              </div>
            ) : (
              <p className="moment-card__summary">{summaryText || summaryMessage}</p>
            )}
          </section>

          <section className="moment-card__section">
            <h3 className="moment-card__section-title">PBP list</h3>
            {isPbpLoading && !pbpEvents?.length ? (
              <p className="moment-card__empty">Loading play-by-play...</p>
            ) : pbpError ? (
              <p className="moment-card__empty">{pbpError}</p>
            ) : hasPbpContent ? (
              <div className="moment-card__pbp-list">
                {(pbpEvents && pbpEvents.length > 0 ? pbpEvents : [entry.event]).map((event) => (
                  <PbpEventRow
                    key={`${entry.momentId}-${event.id}-${event.elapsedSeconds}`}
                    event={event}
                    showScore={showPbpScore}
                  />
                ))}
              </div>
            ) : (
              <p className="moment-card__empty">No play-by-play details yet.</p>
            )}
          </section>

          <section className="moment-card__section">
            <h3 className="moment-card__section-title">Posts</h3>
            {hasHighlights ? (
              <div className="moment-card__posts">
                {entry.highlights.map((highlight) => (
                  <XHighlight key={highlight.id} post={highlight} />
                ))}
              </div>
            ) : (
              <p className="moment-card__empty">No posts linked to this moment yet.</p>
            )}
          </section>
        </div>
      </div>
    </article>
  );
};
