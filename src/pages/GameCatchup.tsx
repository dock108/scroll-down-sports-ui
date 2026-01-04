import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataError } from '../components/feedback/DataError';
import { PageLayout } from '../components/layout/PageLayout';
import { FinalStats } from '../components/scores/FinalStats';
import { GameHeader } from '../components/scores/GameHeader';
import { GameSubNav } from '../components/navigation/GameSubNav';
import { GameOverview } from '../components/sections/GameOverview';
import { TimelineDivider } from '../components/timeline/TimelineDivider';
import { TimelineSection } from '../components/timeline/TimelineSection';
import { CollapsibleSection } from '../components/timeline/CollapsibleSection';
import { ScoreChips } from '../components/timeline/ScoreChips';
import { TimelineSkeleton } from '../components/timeline/TimelineSkeleton';
import { XHighlight } from '../components/embeds/XHighlight';
import {
  getGameAdapter,
  getSocialPostAdapter,
  getPbpAdapter,
  getCatchupAdapter,
  ApiConnectionError,
} from '../adapters';
import type { CatchupResponse } from '../adapters/CatchupAdapter';
import {
  RESUME_SAVE_DEBOUNCE_MS,
  RESUME_SCROLL_THRESHOLD,
  formatGameDate,
  getPeriodLabel,
  getPeriodShortLabel,
  getResumeDismissKey,
  getResumeStorageKey,
  getScoreSnapshot,
  groupByPeriod,
  parseResumeData,
} from './GameCatchupUtils';
import type { ResumeData } from './GameCatchupUtils';

export const GameCatchup = () => {
  const { gameId } = useParams();
  const [catchup, setCatchup] = useState<CatchupResponse | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [statsRevealed, setStatsRevealed] = useState(false);
  const [activePeriod, setActivePeriod] = useState<number | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('sds-compact-mode') === 'true';
    } catch {
      return false;
    }
  });

  // Trigger auto-reveal once the reader scrolls past the timeline
  const statsRevealTriggerRef = useRef<HTMLDivElement | null>(null);
  const periodRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const resumeSaveTimeoutRef = useRef<number | null>(null);

  // Create adapters
  const gameAdapter = useMemo(() => getGameAdapter(), []);
  const postAdapter = useMemo(() => getSocialPostAdapter(), []);
  const pbpAdapter = useMemo(() => getPbpAdapter(), []);
  const catchupAdapter = useMemo(
    () => getCatchupAdapter(gameAdapter, postAdapter, pbpAdapter),
    [gameAdapter, postAdapter, pbpAdapter],
  );

  useEffect(() => {
    let isActive = true;

    const loadCatchupData = async () => {
      setIsLoading(true);
      setError(null);

      if (!gameId) {
        setCatchup(null);
        setIsLoading(false);
        return;
      }

      try {
        const result = await catchupAdapter.getCatchupForGame(gameId);

        if (isActive) {
          setCatchup(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isActive) {
          if (err instanceof ApiConnectionError) {
            setError(err.message);
          } else {
            setError('Failed to load game catchup');
          }
          setCatchup(null);
          setIsLoading(false);
        }
      }
    };

    loadCatchupData();

    return () => {
      isActive = false;
    };
  }, [catchupAdapter, gameId, retryCount]);

  useEffect(() => {
    if (typeof window === 'undefined' || !gameId) return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, [gameId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !gameId || isLoading) return;
    try {
      const stored = window.localStorage.getItem(getResumeStorageKey(gameId));
      const dismissed = window.sessionStorage.getItem(getResumeDismissKey(gameId)) === 'true';
      const parsed = parseResumeData(stored);
      setResumeData(parsed);
      setShowResumePrompt(Boolean(parsed && parsed.scrollY >= RESUME_SCROLL_THRESHOLD && !dismissed));
    } catch {
      setResumeData(null);
      setShowResumePrompt(false);
    }
  }, [gameId, isLoading]);

  // Auto-reveal stats only after the timeline is finished to avoid spoilers
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('sds-compact-mode', String(isCompactMode));
    } catch {
      return;
    }
  }, [isCompactMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !gameId) return;

    const saveResumeData = () => {
      try {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const scrollY = Math.min(Math.max(window.scrollY, 0), maxScroll);
        const nextData: ResumeData = {
          scrollY,
          statsRevealed,
          updatedAt: Date.now(),
        };
        window.localStorage.setItem(getResumeStorageKey(gameId), JSON.stringify(nextData));
        setResumeData(nextData);
      } catch {
        return;
      }
    };

    const handleScroll = () => {
      if (resumeSaveTimeoutRef.current) {
        window.clearTimeout(resumeSaveTimeoutRef.current);
      }
      resumeSaveTimeoutRef.current = window.setTimeout(saveResumeData, RESUME_SAVE_DEBOUNCE_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (resumeSaveTimeoutRef.current) {
        window.clearTimeout(resumeSaveTimeoutRef.current);
      }
    };
  }, [gameId, statsRevealed]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  const handleResume = () => {
    if (!resumeData || typeof window === 'undefined') return;
    setShowResumePrompt(false);
    setStatsRevealed(resumeData.statsRevealed);
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
    const targetScroll = Math.min(resumeData.scrollY, maxScroll);
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  const handleDismissResume = () => {
    if (typeof window === 'undefined' || !gameId) return;
    setShowResumePrompt(false);
    try {
      window.sessionStorage.setItem(getResumeDismissKey(gameId), 'true');
    } catch {
      return;
    }
  };

  // Group timeline by period for rendering
  const periodGroups = useMemo(() => {
    if (!catchup?.timeline) return new Map();
    return groupByPeriod(catchup.timeline);
  }, [catchup?.timeline]);

  const sortedPeriods = useMemo(() => {
    return Array.from(periodGroups.keys()).sort((a, b) => a - b);
  }, [periodGroups]);

  const periodDisplayData = useMemo(() => {
    return sortedPeriods.map((period) => {
      const entries = periodGroups.get(period) || [];
      const scoreSnapshot = getScoreSnapshot(entries);
      return {
        period,
        label: getPeriodLabel(period),
        shortLabel: getPeriodShortLabel(period),
        scoreSnapshot,
      };
    });
  }, [periodGroups, sortedPeriods]);

  useEffect(() => {
    if (!periodDisplayData.length) return;
    if (!activePeriod || !periodDisplayData.some((item) => item.period === activePeriod)) {
      setActivePeriod(periodDisplayData[0].period);
    }
  }, [activePeriod, periodDisplayData]);

  useEffect(() => {
    if (!periodDisplayData.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const periodValue = Number((entry.target as HTMLElement).dataset.period);
          if (!Number.isNaN(periodValue)) {
            setActivePeriod(periodValue);
          }
        });
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0,
      },
    );

    periodRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [periodDisplayData]);

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
          <div className="h-4 w-32 rounded-full bg-gray-200" />
          <div className="h-8 w-3/4 rounded-full bg-gray-200" />
          <div className="h-5 w-2/3 rounded-full bg-gray-200" />
        </div>
        <div className="mt-10">
          <TimelineSkeleton />
        </div>
      </PageLayout>
    );
  }

  if (!catchup) {
    return (
      <PageLayout contentClassName="space-y-0">
        <p className="text-gray-600">Game not found.</p>
        <Link className="mt-4 inline-flex text-blue-600 underline" to="/games">
          Back to games
        </Link>
      </PageLayout>
    );
  }

  const { game, preGamePosts, timeline, postGamePosts, playerStats, teamStats, finalDetails } = catchup;
  const dateLabel = formatGameDate(game.date);
  const hasTimeline = timeline.length > 0;
  const hasPreGame = preGamePosts && preGamePosts.length > 0;
  const hasPostGame = postGamePosts && postGamePosts.length > 0;
  const hasPeriodStructure = sortedPeriods.some((p) => p > 0);
  const layoutClassName = isCompactMode ? 'pt-4 pb-24' : 'pt-6 pb-28';
  const activePeriodData = periodDisplayData.find((item) => item.period === activePeriod) ?? periodDisplayData[0];
  const scoreLabel = activePeriodData?.scoreSnapshot
    ? `${activePeriodData.scoreSnapshot.awayScore}\u2013${activePeriodData.scoreSnapshot.homeScore}`
    : '--\u2013--';

  return (
    <PageLayout className={layoutClassName} contentClassName="space-y-0">
      {/* Back navigation */}
      <Link className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 inline-block" to="/games">
        ← Back to games
      </Link>

      {showResumePrompt && (
        <div className="resume-banner" role="status" aria-live="polite">
          <p className="resume-banner__text">Resume where you left off?</p>
          <div className="resume-banner__actions">
            <button type="button" className="resume-banner__button" onClick={handleResume}>
              Resume
            </button>
            <button type="button" className="resume-banner__button resume-banner__button--ghost" onClick={handleDismissResume}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. HEADER - Game Details (spoiler-safe) */}
      <GameHeader
        awayTeam={game.awayTeam || 'Away'}
        homeTeam={game.homeTeam || 'Home'}
        venue={game.venue ?? 'Venue TBD'}
        dateLabel={dateLabel}
        compactMode={isCompactMode}
        onCompactModeChange={setIsCompactMode}
      />

      {/* Sticky Sub-Nav */}
      <GameSubNav />

      {hasTimeline && hasPeriodStructure && activePeriodData && (
        <div className="score-pill" role="status" aria-live="polite">
          <span className="score-pill__label">Viewing:</span>
          <span className="score-pill__period">{activePeriodData.shortLabel}</span>
          <span className="score-pill__divider" aria-hidden="true">
            |
          </span>
          <span className="score-pill__score">{scoreLabel}</span>
        </div>
      )}

      {/* OVERVIEW SECTION */}
      <GameOverview
        homeTeam={game.homeTeam || 'Home'}
        awayTeam={game.awayTeam || 'Away'}
      />

      {/* PRE-GAME - Expanded by default */}
      {hasPreGame && (
        <CollapsibleSection
          title="Pre-Game"
          icon="🏟️"
          count={preGamePosts.length}
          defaultExpanded={true}
        >
          <div className="game-phase-thread__posts">
            {preGamePosts.map((post) => (
              <XHighlight key={post.id} post={post} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* 2. MAIN SECTION - Play-by-Play Timeline */}
      <section id="timeline" className="game-timeline">
        <h2 className="section-header">Timeline</h2>
        {hasTimeline ? (
          hasPeriodStructure ? (
            // Render each period in a collapsed section
            sortedPeriods.map((period, periodIndex) => {
              const entries = periodGroups.get(period) || [];
              const periodLabel = getPeriodLabel(period);
              const scoreSnapshot = getScoreSnapshot(entries);
              const shouldShowScore = Boolean(scoreSnapshot) && periodIndex < sortedPeriods.length - 1;

              return (
                <div
                  key={`period-${period}`}
                  ref={(node) => {
                    if (node) {
                      periodRefs.current.set(period, node);
                    } else {
                      periodRefs.current.delete(period);
                    }
                  }}
                  data-period={period}
                  className="timeline-period"
                >
                  <CollapsibleSection
                    title={periodLabel}
                    icon="🏀"
                    count={entries.length}
                    defaultExpanded={false}
                  >
                    {entries.map((entry, index) => (
                      <TimelineSection key={entry.event.id} entry={entry} index={index} />
                    ))}
                  </CollapsibleSection>
                  {shouldShowScore && scoreSnapshot && (
                    <ScoreChips
                      periodLabel={periodLabel}
                      homeTeam={game.homeTeam || 'Home'}
                      awayTeam={game.awayTeam || 'Away'}
                      homeScore={scoreSnapshot.homeScore}
                      awayScore={scoreSnapshot.awayScore}
                    />
                  )}
                </div>
              );
            })
          ) : (
            // No period structure - wrap all in one section
            <CollapsibleSection
              title="Play-by-Play"
              icon="🏀"
              count={timeline.length}
              defaultExpanded={false}
            >
              {timeline.map((entry, index) => (
                <TimelineSection key={entry.event.id} entry={entry} index={index} />
              ))}
            </CollapsibleSection>
          )
        ) : (
          <div className="game-timeline__empty">
            <p>This game has no timeline events available yet.</p>
            <p className="mt-2 text-sm">Check back later for highlights.</p>
          </div>
        )}
      </section>

      {/* Timeline end marker */}
      <TimelineDivider />

      {/* This invisible marker triggers the spoiler-safe reveal once reached */}
      <div ref={statsRevealTriggerRef} aria-hidden="true" />

      {/* FINAL STATS SECTION - Player Stats + Team Stats + Final Score */}
      <section id="final-score">
        <h2 className="section-header">Final Stats</h2>
        <FinalStats
          revealed={statsRevealed}
          homeTeam={game.homeTeam || 'Home'}
          awayTeam={game.awayTeam || 'Away'}
          attendance={finalDetails.attendance ?? 0}
          homeScore={finalDetails.homeScore}
          awayScore={finalDetails.awayScore}
          teamStats={teamStats}
          playerStats={playerStats}
          compactMode={isCompactMode}
        />
      </section>

      {/* POST-GAME THREAD - After final details (collapsed by default) */}
      {hasPostGame && (
        <CollapsibleSection
          title="Post-Game"
          icon="🏆"
          count={postGamePosts.length}
          defaultExpanded={false}
        >
          <div className="game-phase-thread__posts">
            {postGamePosts.map((post) => (
              <XHighlight key={post.id} post={post} />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </PageLayout>
  );
};
