# Feature Flags & Toggles Inventory

This document tracks all flags, environment toggles, and behavior switches.
Use this to decide what stays, what goes, and what becomes permanent config.

## Table

### VITE_API_URL
Flag Name: `VITE_API_URL`
File / Location: `src/utils/env.ts`, `public/env-config.js`, `docs/architecture.md`, `docs/DEVELOPING.md`
Default Value: `''` (empty string; effectively unset)
Env Overrides: `window.__APP_CONFIG__.VITE_API_URL` (runtime), `import.meta.env.VITE_API_URL` (build-time)
Purpose: Base URL for all live API requests.
MVP or Permanent: Permanent
Classification: PERMANENT_CONFIG
Notes: Required for the frontend to reach the sports admin API.

### VITE_APP_VERSION
Flag Name: `VITE_APP_VERSION`
File / Location: `src/utils/env.ts`, `public/env-config.js`, `src/vite-env.d.ts`
Default Value: `''` (empty string; falls back to `dev` in code)
Env Overrides: `window.__APP_CONFIG__.VITE_APP_VERSION` (runtime), `import.meta.env.VITE_APP_VERSION` (build-time)
Purpose: Surface app version metadata in the UI/logging.
MVP or Permanent: Permanent
Classification: PERMANENT_CONFIG
Notes: `getAppVersion()` returns `dev` when unset.

### VITE_ENABLE_PREVIEW_SCORES
Flag Name: `VITE_ENABLE_PREVIEW_SCORES`
File / Location: `.env`, `.env.example`
Default Value: `false`
Env Overrides: `import.meta.env.VITE_ENABLE_PREVIEW_SCORES` (build-time)
Purpose: Enables preview score display for environments that should allow early score visibility.
MVP or Permanent: MVP
Classification: FEATURE_FLAG
Notes: Set to `true` to allow preview scores in builds where spoiler controls permit it.

### Pre-Game / Timeline / Post-Game Collapsible Sections
Flag Name: `defaultExpanded` (Collapsible section expansion state)
File / Location: `src/components/timeline/CollapsibleSection.tsx`, `src/pages/GameCatchup.tsx`
Default Value: `false` unless specified
Env Overrides: None
Purpose: Controls whether a timeline section loads expanded or collapsed.
MVP or Permanent: Permanent
Classification: PERMANENT_CONFIG
Notes: `GameCatchup` sets Pre-Game to expanded by default; timeline periods and Post-Game default to collapsed.

### Highlight Caption “Show more/less”
Flag Name: `isExpanded` (caption clamp toggle)
File / Location: `src/components/embeds/XHighlight.tsx`
Default Value: `false`
Env Overrides: None
Purpose: Toggles long captions between clamped preview and full text.
MVP or Permanent: Permanent
Classification: PERMANENT_CONFIG
Notes: Clamp applies when caption length exceeds `CAPTION_MAX_CHARS` (140).

### Spoiler-Safe Final Stats Reveal
Flag Name: `statsRevealed` (auto-reveal state)
File / Location: `src/pages/GameCatchup.tsx`, `src/components/scores/FinalStats.tsx`
Default Value: `false`
Env Overrides: None
Purpose: Keeps final scores hidden until the timeline end marker enters the viewport.
MVP or Permanent: Permanent
Classification: PERMANENT_CONFIG
Notes: Auto-reveals via `IntersectionObserver` once the reader scrolls past the timeline.

## Conflicts & Risk Areas
- None identified. Runtime env (`window.__APP_CONFIG__`) overrides build-time env; this is consistent across usages.

## Removal Candidates
- None identified.

## Permanent Config Flags
- `VITE_API_URL`
- `VITE_APP_VERSION`
