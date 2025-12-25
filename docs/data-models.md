# Data models

The app relies on mock JSON data stored under `src/data`. Adapters normalize the data so the UI can tolerate different field names.

## Games (`src/data/games.json`)

Each item represents a finished game.

Required fields (normalized by `MockGameAdapter`):

| Normalized field | Accepted keys | Notes |
| --- | --- | --- |
| `id` | `id`, `game_id`, `gameId` | Required for routing. |
| `date` | `date`, `game_date`, `start_time`, `startTime` | ISO-8601 string preferred. |
| `homeTeam` | `home_team`, `homeTeam`, `home` | String abbreviation or full name. |
| `awayTeam` | `away_team`, `awayTeam`, `away` | String abbreviation or full name. |

Optional fields:

| Normalized field | Accepted keys | Notes |
| --- | --- | --- |
| `venue` | `venue`, `arena`, `location` | Displayed in lists and headers. |
| `attendance` | `attendance`, `crowd`, `attendance_total` | Numeric attendance. |
| `starters` | `starters`, `lineups`, `starting_lineups` | Object with team keys and array of player names. |

Date filtering is applied in `MockGameAdapter.getGamesByDateRange`. Invalid or missing dates are treated as always-in-range so the game still appears.

## Timeline posts (`src/data/posts.json`)

Each item represents a highlight post that appears in the replay timeline.

Required fields (normalized by `MockPostAdapter`):

| Normalized field | Accepted keys | Notes |
| --- | --- | --- |
| `gameId` | `game_id`, `gameId`, `game` | Must match a game `id`. |
| `tweetUrl` | `tweet_url`, `tweetUrl`, `url` | Used for embeds and fallback IDs. |
| `postedAt` | `posted_at`, `postedAt`, `timestamp` | ISO-8601 string preferred. |

Optional fields:

| Normalized field | Accepted keys | Notes |
| --- | --- | --- |
| `team` | `team`, `team_id`, `teamId` | Displayed as metadata. |
| `hasVideo` | `has_video`, `hasVideo`, `video` | Used to adjust embed treatment. |

Posts are filtered by `gameId` and sorted by `postedAt` ascending before rendering.
