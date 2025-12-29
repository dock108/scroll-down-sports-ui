# X Integration

This document describes how Scroll Down Sports renders official team X posts as game highlights. The backend owns data collection; the frontend renders custom highlight cards with remote media URLs and captions.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Postgres DB   │────▶│  Backend API    │────▶│   Frontend UI   │
│  (game_social_  │     │ /api/social/*   │     │  XHighlight.tsx │
│    posts)       │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲
        │ (collection handled in backend)
        │
┌─────────────────┐
│  Team X         │
│   Profiles      │
│  (30 NBA teams) │
└─────────────────┘
```

## What We Store (Minimal)

Table: `game_social_posts`

| Field         | Type      | Notes                           |
| ------------ | --------- | ------------------------------- |
| id           | UUID      | Primary key                     |
| game_id      | FK        | References games table          |
| team_id      | VARCHAR   | Team abbreviation (e.g., "GSW") |
| post_url     | TEXT      | Full X URL                      |
| tweet_id     | TEXT      | Original post ID                |
| posted_at    | TIMESTAMP | When the post was made          |
| source_handle| TEXT      | X handle for attribution        |
| tweet_text   | TEXT      | Caption text                    |
| media_type   | TEXT      | `video`, `image`, or `none`     |
| video_url    | TEXT      | Remote video URL (not hosted)   |
| image_url    | TEXT      | Remote image URL (not hosted)   |
| has_video    | BOOLEAN   | Optional flag for video content |

**Not stored in frontend:** engagement metrics. The backend owns collection and spoiler filtering.

## Game Social Window

For each game, we capture posts within a time window:

```
window_start = game_start_time - 2 hours
window_end   = game_start_time + 3 hours
```

This window:

- Captures pre-game hype and warmups
- Captures in-game highlights
- Avoids most post-game "FINAL" posts

## Spoiler Filtering

Spoiler filtering is handled in the backend at collection time. The frontend additionally truncates score-like patterns to avoid spoilers in captions.

## Frontend Integration

### XHighlight Component

The frontend renders a custom highlight card that includes:

- Native `<video>` (or `<img>`) with remote URLs
- Caption in the format `@handle: text`
- Caption link to the original X post
- Subtle X icon next to the handle
- Skeleton loaders and fixed aspect ratio to avoid layout shift

## Backend API (Expected)

The frontend expects these endpoints:

### GET /api/social/posts

Query params:

- `game_id` - Filter by game
- `team_id` - Filter by team
- `start_date` - ISO date string
- `end_date` - ISO date string

Response:

```json
{
  "posts": [
    {
      "id": "uuid",
      "game_id": 123,
      "team_id": "GSW",
      "tweet_url": "https://twitter.com/warriors/status/...",
      "tweet_id": "1761806498890576044",
      "posted_at": "2024-03-10T19:12:00Z",
      "source_handle": "warriors",
      "tweet_text": "Steph takes it coast-to-coast for the early bucket.",
      "media_type": "video",
      "video_url": "https://video.twimg.com/....mp4",
      "image_url": "https://pbs.twimg.com/media/....jpg",
      "has_video": true
    }
  ]
}
```

## Data Collection (v1 - Manual)

For MVP, posts can be collected manually:

1. Go to team's Twitter profile during game window
2. Identify highlight posts (videos preferred)
3. Copy tweet URLs
4. Insert into `game_social_posts` table

### Basic SQL Insert

```sql
INSERT INTO game_social_posts (game_id, team_id, tweet_url, tweet_id, posted_at, source_handle, tweet_text, media_type, video_url, image_url, has_video)
VALUES (
  123,
  'GSW',
  'https://twitter.com/warriors/status/1761806498890576044',
  '1761806498890576044',
  '2024-03-10T19:12:00Z',
  'warriors',
  'Steph takes it coast-to-coast for the early bucket.',
  'video',
  'https://video.twimg.com/....mp4',
  'https://pbs.twimg.com/media/....jpg',
  true
);
```

## Future: Automated Collection

When ready to scale:

1. **X API v2** - Official API with rate limits
2. **Headless scrape** - Playwright/Puppeteer approach
3. **RSS feeds** - Some teams have RSS

The frontend doesn't change - just swap the data source.

## Legal Considerations

This approach is compliant because:

- ✅ Not storing or re-hosting media
- ✅ Linking back to original content
- ✅ Not displaying engagement metrics
- ✅ Preserving attribution
