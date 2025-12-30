# Architecture overview

Scroll Down Sports is a small single-page application built with Vite and React. It uses React Router to move the user from a date picker to a game list, and then into a spoiler-safe replay.

## Entry points

- `src/main.tsx` mounts the React app and attaches `App` to the DOM.
- `src/App.tsx` declares the app routes and page layout wrappers.

## Routes and pages

| Page        | File                       | Notes                                                                     |
| ----------- | -------------------------- | ------------------------------------------------------------------------- |
| Date picker | `src/pages/DatePicker.tsx` | Captures `start`/`end` date filters and redirects to the games list.      |
| Game list   | `src/pages/GameList.tsx`   | Loads game summaries via `getGameAdapter()` and displays filtered results. |
| Game replay | `src/pages/GameReplay.tsx` | Shows timeline posts and auto-reveals final stats after the timeline.     |

## Core UI components

- `GameHeader` (`src/components/scores/GameHeader.tsx`): heading section for the selected game.
- `XHighlight` (`src/components/embeds/XHighlight.tsx`): renders a highlight card with remote media and caption attribution.
- `FinalStats` (`src/components/scores/FinalStats.tsx`): renders player stats, team stats, and final score once revealed.

## Data adapters

Adapters normalize JSON fixtures and keep the UI decoupled from data shape changes.

- `MockGameAdapter` (`src/adapters/GameAdapter.ts`) reads `src/data/games.json`.
- `MockPostAdapter` (`src/adapters/PostAdapter.ts`) reads `src/data/posts.json`.
- `SportsApiAdapter` (`src/adapters/SportsApiAdapter.ts`) loads game data from `VITE_API_URL`.
- `SocialPostApiAdapter` (`src/adapters/SocialPostAdapter.ts`) loads highlight posts from `VITE_API_URL`.

## Spoiler state

Spoiler gating is handled in `GameReplay` with an `IntersectionObserver` watching a marker below the final highlight. When the marker enters view, `FinalStats` animates into view.
