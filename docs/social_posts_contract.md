# Social Posts Contract (Scroll Down Sports)

## Canonical endpoint

**Primary source of truth:** `GET /api/admin/sports/games/{gameId}`

This endpoint powers the catchup timeline and supplies `social_posts` alongside game data
and play-by-play. We treat this endpoint as canonical because the timeline distribution logic
depends on its payload.

**Secondary/utility endpoint:** `GET /api/social/posts/game/{gameId}`

This endpoint is currently **not** used by the catchup timeline UI. It exists for targeted
fetches and should remain aligned to the canonical schema.

## Field meanings (social_posts)

| Field | Meaning |
| --- | --- |
| `post_url` | Link to the original X post (used for outbound link and handle parsing). |
| `tweet_text` | Text content of the post (spoiler-filtered in UI). |
| `image_url` | Image URL (used for image posts and as video poster). |
| `video_url` | Video URL (used for inline playback). |
| `media_type` | Media indicator from backend (`video`, `image`, `none`, or other). |
| `has_video` | Legacy/derived hint; UI recomputes `hasVideo` from normalized media type. |
| `posted_at` | Timestamp used for ordering and post-game heuristics. |
| `source_handle` | X handle string (preferred over URL parsing when available). |
| `team_abbreviation` / `team_id` | Team identifier for display/association. |

## Fallback behavior rules

1. **Media type normalization (defensive):**
   - If `media_type === "video"` or a `video_url` is present (and `media_type !== "image"`), treat as video.
   - Else if `media_type === "image"` or an `image_url` is present, treat as image.
   - Otherwise treat as `none`.

2. **Missing media URLs:**
   - Video/image failures fall back to a “media unavailable” message with a link to X.

3. **Post-game grouping (heuristic):**
   - If `game_end_time` or `final_whistle_time` is present, posts after that timestamp are post-game.
   - Otherwise, the last ~10% of posts are considered post-game.
   - TODO: Improve grouping once event timestamps are consistently available.
