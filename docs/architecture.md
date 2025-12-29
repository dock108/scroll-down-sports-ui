# Architecture overview

Scroll Down Sports is a small single-page application built with Vite and React. It uses React Router to move the user from a date picker to a game list, and then into a spoiler-safe replay.

## Entry points

- `src/main.tsx` mounts the React app and attaches `App` to the DOM.
- `src/App.tsx` declares the app routes and page layout wrappers.

## Routes and pages

| Page        | File                       | Notes                                                                     |
| ----------- | -------------------------- | ------------------------------------------------------------------------- |
| Date picker | `src/pages/DatePicker.tsx` | Captures `start`/`end` date filters and redirects to the games list.      |
| Game list   | `src/pages/GameList.tsx`   | Loads game summaries via `MockGameAdapter` and displays filtered results. |
| Game replay | `src/pages/GameReplay.tsx` | Shows timeline posts, spoiler controls, and final stats.                  |

## Core UI components

- `GameHeader` (`src/components/GameHeader.tsx`): heading section for the selected game.
- `XHighlight` (`src/components/embeds/XHighlight.tsx`): renders a highlight card with remote media and caption attribution.
- `StatsTeaser`, `FinalStats`, `RevealScoreButton`: manage teaser and reveal UI for the final score.

## Data adapters

Adapters normalize JSON fixtures and keep the UI decoupled from data shape changes.

- `MockGameAdapter` (`src/adapters/GameAdapter.ts`) reads `src/data/games.json`.
- `MockPostAdapter` (`src/adapters/PostAdapter.ts`) reads `src/data/posts.json`.

## Spoiler state

Spoiler gating is handled by `useSpoilerState` (`src/hooks/useSpoilerState.ts`), which stores a `spoilersAllowed` boolean. The replay page toggles this state after the user scrolls near the end of the timeline.
