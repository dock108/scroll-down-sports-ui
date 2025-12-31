# Architecture overview

Scroll Down Sports is a single-page application built with Vite and React. It uses React Router to move the user from a date picker to a game list, and then into a spoiler-safe game catchup experience with play-by-play and social highlights.

## Entry points

- `src/main.tsx` mounts the React app and attaches `App` to the DOM.
- `src/App.tsx` declares the app routes and page layout wrappers.

## Routes and pages

| Page         | File                        | Notes                                                                      |
| ------------ | --------------------------- | -------------------------------------------------------------------------- |
| Date picker  | `src/pages/DatePicker.tsx`  | Captures `start`/`end` date filters and redirects to the games list.       |
| Game list    | `src/pages/GameList.tsx`    | Loads game summaries via `getGameAdapter()` and displays filtered results. |
| Game catchup | `src/pages/GameCatchup.tsx` | Full catchup with PBP, social highlights, stats, and spoiler-safe reveal.  |

## Core UI components

### Layout & Navigation

- `PageLayout` (`src/components/layout/PageLayout.tsx`): wrapper for page content.

### Game Display

- `GameHeader` (`src/components/scores/GameHeader.tsx`): heading section with teams, date, venue.
- `FinalStats` (`src/components/scores/FinalStats.tsx`): player/team stats and final score.

### Timeline Components

- `XHighlight` (`src/components/embeds/XHighlight.tsx`): social media highlight card with video/image.
- `TimelineSection` (`src/components/timeline/TimelineSection.tsx`): PBP event + attached highlights.
- `PbpEventRow` (`src/components/timeline/PbpEventRow.tsx`): single play-by-play event display.
- `CollapsibleSection` (`src/components/timeline/CollapsibleSection.tsx`): expandable/collapsible section.
- `TimelineDivider` (`src/components/timeline/TimelineDivider.tsx`): end of timeline marker.

### Feedback

- `DataError` (`src/components/feedback/DataError.tsx`): error display with retry.

## Data adapters

Adapters normalize API responses and keep the UI decoupled from data shape changes.
All adapters fetch from the live API (`VITE_API_URL`). No mock adapters are used.

### Game Data

- `SportsApiAdapter` (`src/adapters/SportsApiAdapter.ts`) loads game list from `/api/admin/sports/games`.

### Social Posts

- `SocialPostApiAdapter` (`src/adapters/SocialPostAdapter.ts`) - types for social posts.

### Play-by-Play

- `PbpApiAdapter` (`src/adapters/PbpAdapter.ts`) - types for PBP events.

### Integrated Catchup

- `CatchupApiAdapter` (`src/adapters/CatchupAdapter.ts`) loads full game data from `/api/admin/sports/games/:id`.
  - Maps game, PBP, social posts, player stats, and team stats
  - Distributes social posts: 20% to pre-game, 80% woven into timeline

## Social post distribution

Since accurate game start times aren't available, posts are distributed proportionally:

1. **Pre-Game**: First 20% of posts (by timestamp) appear in the "Pre-Game" section.
2. **In-Game**: Remaining 80% are distributed evenly across PBP events.
3. **Post-Game**: Planned last posts after game end once timestamps are reliable.

## Spoiler state

Spoiler gating is handled in `GameCatchup`:

- `FinalStats` receives a `revealed={false}` state until scroll trigger fires.
- An `IntersectionObserver` watches a marker below the timeline.
- When the marker enters view, stats and final score animate into view.

## Page layout order

```
[ Game Header ]
[ Pre-Game (collapsible, expanded by default) ]
[ 1st Quarter (collapsible, collapsed by default) ]
[ 2nd Quarter (collapsible, collapsed by default) ]
[ 3rd Quarter (collapsible, collapsed by default) ]
[ 4th Quarter (collapsible, collapsed by default) ]
[ Timeline Divider ]
[ Stats Reveal Trigger ]
[ Player Stats + Team Stats + Final Score ]
[ Post-Game (collapsible, collapsed by default) ]
```
