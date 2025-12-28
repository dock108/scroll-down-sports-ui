# Data models

The app uses adapters to normalize data from multiple sources (local JSON for development, Postgres API for production). This allows the UI to tolerate different field names and data shapes.

## Games (`src/data/games.json`)

Each item represents a finished game.

Required fields (normalized by `MockGameAdapter`):

| Normalized field | Accepted keys                                  | Notes                             |
| ---------------- | ---------------------------------------------- | --------------------------------- |
| `id`             | `id`, `game_id`, `gameId`                      | Required for routing.             |
| `date`           | `date`, `game_date`, `start_time`, `startTime` | ISO-8601 string preferred.        |
| `homeTeam`       | `home_team`, `homeTeam`, `home`                | String abbreviation or full name. |
| `awayTeam`       | `away_team`, `awayTeam`, `away`                | String abbreviation or full name. |

Optional fields:

| Normalized field | Accepted keys                             | Notes                                            |
| ---------------- | ----------------------------------------- | ------------------------------------------------ |
| `venue`          | `venue`, `arena`, `location`              | Displayed in lists and headers.                  |
| `attendance`     | `attendance`, `crowd`, `attendance_total` | Numeric attendance.                              |
| `starters`       | `starters`, `lineups`, `starting_lineups` | Object with team keys and array of player names. |

Date filtering is applied in `MockGameAdapter.getGamesByDateRange`. Invalid or missing dates are treated as always-in-range so the game still appears.

## Timeline posts (`src/data/posts.json`)

Each item represents a highlight post that appears in the replay timeline.

Required fields (normalized by `MockPostAdapter`):

| Normalized field | Accepted keys                        | Notes                             |
| ---------------- | ------------------------------------ | --------------------------------- |
| `gameId`         | `game_id`, `gameId`, `game`          | Must match a game `id`.           |
| `tweetUrl`       | `tweet_url`, `tweetUrl`, `url`       | Used for embeds and fallback IDs. |
| `postedAt`       | `posted_at`, `postedAt`, `timestamp` | ISO-8601 string preferred.        |

Optional fields:

| Normalized field | Accepted keys                    | Notes                           |
| ---------------- | -------------------------------- | ------------------------------- |
| `team`           | `team`, `team_id`, `teamId`      | Displayed as metadata.          |
| `hasVideo`       | `has_video`, `hasVideo`, `video` | Used to adjust embed treatment. |

Posts are filtered by `gameId` and sorted by `postedAt` ascending before rendering.

## Game social posts (Postgres: `game_social_posts`)

Links tweets to games. Minimal data—X hosts all media.

| Field       | Type      | Notes                           |
| ----------- | --------- | ------------------------------- |
| `id`        | UUID      | Primary key                     |
| `game_id`   | FK        | References games table          |
| `team_id`   | String    | Team abbreviation               |
| `post_url`  | String    | Full X post URL                 |
| `posted_at` | Timestamp | When the post was made          |
| `has_video` | Boolean   | Optional flag for video content |

**Not stored:** Tweet text, media files, engagement metrics.

Accessed via `SocialPostApiAdapter` or `getSocialPostAdapter()`.

See [X Integration](./x-integration.md) for full details on the Twitter embedding strategy.
