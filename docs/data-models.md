# Data models

The app uses adapters to normalize API responses. This allows the UI to tolerate different field names and data shapes from the backend.

## Games (API: `SportsApiAdapter`)

Games are loaded from the sports admin API.

### Summary endpoint (`GET /api/admin/sports/games`)

| Field       | Notes                 |
| ----------- | --------------------- |
| `id`        | Required for routing. |
| `game_date` | ISO-8601 string.      |
| `home_team` | Team name.            |
| `away_team` | Team name.            |

### Detail endpoint (`GET /api/admin/sports/games/:id`)

Returns a nested response with game details, stats, PBP, and social posts.

| Field          | Notes                                         |
| -------------- | --------------------------------------------- |
| `game`         | Game metadata (teams, date, venue, score)     |
| `team_stats`   | Array of team stat records                    |
| `player_stats` | Array of player stat records with `raw_stats` |
| `plays`        | Array of play-by-play events                  |
| `social_posts` | Array of social media posts                   |

## Social posts

Each post represents a tweet/X post linked to a game.

| Field               | Type      | Notes                           |
| ------------------- | --------- | ------------------------------- |
| `id`                | Number    | Primary key                     |
| `post_url`          | String    | Full X post URL                 |
| `posted_at`         | Timestamp | When the post was made          |
| `has_video`         | Boolean   | Flag for video content          |
| `team_abbreviation` | String    | Team abbreviation (e.g., "IND") |
| `tweet_text`        | Text      | Caption text for the post       |
| `video_url`         | Text      | Remote video URL (optional)     |
| `image_url`         | Text      | Remote image URL (optional)     |
| `source_handle`     | Text      | X handle for attribution        |
| `media_type`        | String    | `video`, `image`, or `none`     |

**Note:** Some games may have incomplete social post data (null `tweet_text`, etc.) depending on scraper status.

## Play-by-play events

Each event represents a single play in the game.

| Field               | Type   | Notes                              |
| ------------------- | ------ | ---------------------------------- |
| `play_index`        | Number | Event order within game            |
| `quarter`           | Number | 1-4 for regulation, 5+ for OT      |
| `game_clock`        | String | Time remaining in period (MM:SS)   |
| `play_type`         | String | Event classification (nullable)    |
| `team_abbreviation` | String | Team that made the play (nullable) |
| `player_name`       | String | Player involved (nullable)         |
| `description`       | String | Human-readable description         |
| `home_score`        | Number | Running home score (nullable)      |
| `away_score`        | Number | Running away score (nullable)      |

## Catchup response (frontend model)

The `CatchupApiAdapter` transforms the API response into a frontend-friendly format:

```typescript
interface CatchupResponse {
  game: CatchupGameHeader; // Spoiler-safe header (no score)
  preGamePosts: TimelinePost[]; // First 20% of posts chronologically
  timeline: TimelineEntry[]; // PBP events + distributed highlights
  postGamePosts: TimelinePost[]; // Planned: post-game tweets once timestamps are reliable
  playerStats: PlayerStat[];
  teamStats: TeamStat[];
  finalDetails: CatchupFinalDetails; // Score + attendance
}

interface TimelineEntry {
  event: PbpEvent;
  highlights: TimelinePost[]; // Social posts matched to this event
}

interface CatchupGameHeader {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue?: string;
}

interface CatchupFinalDetails {
  homeScore?: number;
  awayScore?: number;
  attendance?: number;
  notes?: string;
}
```

## Normalized frontend types

### TimelinePost

```typescript
interface TimelinePost {
  id: string;
  gameId: string;
  team: string;
  postUrl: string;
  tweetId: string;
  postedAt: string;
  hasVideo?: boolean;
  mediaType?: 'video' | 'image' | 'none';
  videoUrl?: string;
  imageUrl?: string;
  sourceHandle?: string;
  tweetText?: string;
}
```

### PbpEvent

```typescript
interface PbpEvent {
  id: string;
  gameId: string;
  period: number;
  gameClock: string;
  elapsedSeconds: number;
  eventType: string;
  description: string;
  team?: string;
  playerName?: string;
  homeScore?: number;
  awayScore?: number;
}
```
