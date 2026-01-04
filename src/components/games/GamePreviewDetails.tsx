import { useEffect, useId, useRef, useState } from 'react';
import { fetchGamePreview } from '../../adapters';
import type { GamePreview } from '../../types';

const DETAILS_TITLE = 'Why this game matters';
const DETAILS_ACTION_LABEL = 'Why this game matters';
const LOAD_ERROR_MESSAGE = 'Details are unavailable right now.';
const EMPTY_NUGGET_MESSAGE = 'More context is coming soon.';
const EMPTY_TAGS_MESSAGE = 'Tags are on the way.';
const LOADING_MESSAGE = 'Loading details...';
const CLOSE_LABEL = 'Close details';
const TAGS_LABEL = 'Tags';

type PreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface GamePreviewDetailsProps {
  gameId: string;
}

export const GamePreviewDetails = ({ gameId }: GamePreviewDetailsProps) => {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [preview, setPreview] = useState<GamePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(null);
    setStatus('idle');
    setError(null);
    isFetchingRef.current = false;
  }, [gameId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || preview || isFetchingRef.current) {
      return;
    }

    let isActive = true;
    isFetchingRef.current = true;
    setStatus('loading');
    setError(null);

    fetchGamePreview(gameId)
      .then((data) => {
        if (!isActive) {
          return;
        }
        setPreview(data);
        setStatus('loaded');
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setError(LOAD_ERROR_MESSAGE);
        setStatus('error');
      })
      .finally(() => {
        if (isActive) {
          isFetchingRef.current = false;
        }
      });

    return () => {
      isActive = false;
      isFetchingRef.current = false;
    };
  }, [gameId, isOpen, preview]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (canHover) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (canHover) {
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    setIsOpen((open) => !open);
  };

  const nuggetContent = (() => {
    if (status === 'loading') {
      return LOADING_MESSAGE;
    }
    if (status === 'error') {
      return error ?? LOAD_ERROR_MESSAGE;
    }
    if (preview?.nugget) {
      return preview.nugget;
    }
    return EMPTY_NUGGET_MESSAGE;
  })();

  const tags = preview?.tags ?? [];
  const showTags = status === 'loaded' && tags.length > 0;
  const isLoading = status === 'loading';

  return (
    <div
      className="relative inline-flex items-center"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={handleToggle}
      >
        {DETAILS_ACTION_LABEL}
      </button>
      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-live="polite"
          className="absolute left-0 top-full z-10 mt-3 w-72 max-w-[80vw] rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {DETAILS_TITLE}
            </p>
            <button
              type="button"
              onClick={handleToggle}
              className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-600"
              aria-label={CLOSE_LABEL}
            >
              ×
            </button>
          </div>
          {isLoading ? (
            <div className="mt-3 space-y-2 animate-pulse" aria-label={LOADING_MESSAGE}>
              <span className="sr-only">{LOADING_MESSAGE}</span>
              <div className="h-3 w-5/6 rounded-full bg-slate-200" />
              <div className="h-3 w-4/6 rounded-full bg-slate-200" />
              <div className="h-3 w-3/5 rounded-full bg-slate-200" />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-700">{nuggetContent}</p>
          )}
          <div className="mt-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              {TAGS_LABEL}
            </p>
            {showTags ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-600"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : isLoading ? (
              <div className="mt-2 flex flex-wrap gap-2 animate-pulse" aria-hidden="true">
                <div className="h-6 w-16 rounded-full bg-slate-200" />
                <div className="h-6 w-20 rounded-full bg-slate-200" />
                <div className="h-6 w-12 rounded-full bg-slate-200" />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                {status === 'loading' ? LOADING_MESSAGE : EMPTY_TAGS_MESSAGE}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
