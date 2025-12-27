# X (Twitter) Integration

This document describes how Scroll Down Sports integrates official team Twitter accounts to build game timelines.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Postgres DB   │────▶│  Backend API    │────▶│   Frontend UI   │
│  (game_social_  │     │ /api/social/*   │     │  TweetEmbed.tsx │
│    posts)       │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲
        │ (scrape/manual entry)
        │
┌─────────────────┐
│  Team Twitter   │
│   Profiles      │
│  (30 NBA teams) │
└─────────────────┘
```

## What We Store (Minimal)

Table: `game_social_posts`

| Field      | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| id         | UUID      | Primary key                              |
| game_id    | FK        | References games table                   |
| team_id    | VARCHAR   | Team abbreviation (e.g., "GSW")          |
| tweet_url  | TEXT      | Full Twitter URL                         |
| posted_at  | TIMESTAMP | When the tweet was posted                |
| has_video  | BOOLEAN   | Optional flag for video content          |

**We do NOT store:**
- Tweet text/captions
- Media URLs or files
- Engagement metrics (likes, RTs)
- User IDs or OAuth tokens

X hosts everything. We just embed.

## Team Social Accounts

All 30 NBA teams are mapped in `src/data/team-social-accounts.json`:

```json
{
  "team_id": "GSW",
  "team_name": "Golden State Warriors",
  "platform": "twitter",
  "handle": "warriors",
  "profile_url": "https://twitter.com/warriors"
}
```

### Team Handle Reference

| Team | Handle           | Team | Handle           |
| ---- | ---------------- | ---- | ---------------- |
| ATL  | @ATLHawks        | MIL  | @Bucks           |
| BOS  | @celtics         | MIN  | @Timberwolves    |
| BKN  | @BrooklynNets    | NOP  | @PelicansNBA     |
| CHA  | @hornets         | NYK  | @nyknicks        |
| CHI  | @chicagobulls    | OKC  | @okcthunder      |
| CLE  | @cavs            | ORL  | @OrlandoMagic    |
| DAL  | @dallasmavs      | PHI  | @sixers          |
| DEN  | @nuggets         | PHX  | @Suns            |
| DET  | @DetroitPistons  | POR  | @trailblazers    |
| GSW  | @warriors        | SAC  | @SacramentoKings |
| HOU  | @HoustonRockets  | SAS  | @spurs           |
| IND  | @Pacers          | TOR  | @Raptors         |
| LAC  | @LAClippers      | UTA  | @utahjazz        |
| LAL  | @Lakers          | WAS  | @WashWizards     |
| MEM  | @memgrizz        |      |                  |

## Game Social Window

For each game, we capture posts within a time window:

```
window_start = game_start_time - 2 hours
window_end   = game_start_time + 3 hours
```

This window:
- ✅ Captures pre-game hype and warmups
- ✅ Captures in-game highlights
- ✅ Captures most highlight clips
- ❌ Avoids most post-game "FINAL" tweets

Configuration is in `src/utils/spoilerFilter.ts`:

```typescript
export const GAME_WINDOW_CONFIG = {
  preGameHours: 2,
  postGameHours: 3,
};
```

## Spoiler Filtering

Even within the window, some posts should be excluded. The spoiler filter (`src/utils/spoilerFilter.ts`) checks for:

### Hard Excludes

1. **Score patterns**: `112-108`, `W 112-108`, etc.
2. **Final keywords**: "FINAL", "game over", "we win", etc.
3. **Recap content**: "recap", "post-game", etc.

### Usage

```typescript
import { containsSpoiler, filterSpoilerPosts } from '../utils/spoilerFilter';

// Single check
if (containsSpoiler(tweetText)) {
  // exclude this post
}

// Batch filter
const safePosts = filterSpoilerPosts(posts, 'caption');
```

## Frontend Integration

### TweetEmbed Component

Uses X's official embed widget:

```tsx
<blockquote className="twitter-tweet">
  <a href={tweetUrl}></a>
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

