# X Integration

This document describes how Scroll Down Sports renders official team X posts as game highlights. The backend owns data collection; the frontend only embeds posts and applies caption masking.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Postgres DB   │────▶│  Backend API    │────▶│   Frontend UI   │
│  (game_social_  │     │ /api/social/*   │     │  PostEmbed.tsx  │
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

| Field     | Type      | Notes                           |
| --------- | --------- | ------------------------------- |
| id        | UUID      | Primary key                     |
| game_id   | FK        | References games table          |
| team_id   | VARCHAR   | Team abbreviation (e.g., "GSW") |
| post_url  | TEXT      | Full X URL                      |
| posted_at | TIMESTAMP | When the post was made          |
| has_video | BOOLEAN   | Optional flag for video content |

**Not stored in frontend:** captions, media URLs, engagement metrics. The backend owns collection and spoiler filtering.

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

Spoiler filtering is handled in the backend at collection time. The frontend does not filter captions; it only masks them visually.

## Frontend Integration

### PostEmbed Component

Uses X's official embed widget:

```tsx
<blockquote className="twitter-tweet">
  <a href={postUrl}></a>
</blockquote>
```

The widget script (`platform.twitter.com/widgets.js`) handles:

- Video playback
- Media rendering
- Responsive sizing

### Caption Masking

Captions are visually masked until intentional reveal:

1. Overlay covers bottom portion of embed
2. Blur effect hides text
3. Reveal triggers on:
   - Slow scroll + dwell time
   - Intentional click/focus
   - Global spoiler reveal

See `src/styles/tweetMask.css` for mask styling.

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
      "posted_at": "2024-03-10T19:12:00Z",
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
INSERT INTO game_social_posts (game_id, team_id, tweet_url, posted_at, has_video)
VALUES (
  123,
  'GSW',
  'https://twitter.com/warriors/status/1761806498890576044',
  '2024-03-10T19:12:00Z',
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

- ✅ Using official embed widgets (explicitly allowed by X)
- ✅ Not downloading or re-hosting media
- ✅ Not storing proprietary content (captions, metrics)
- ✅ Linking back to original content
- ✅ Not modifying tweet content

The masking is purely presentation control, not content modification.
