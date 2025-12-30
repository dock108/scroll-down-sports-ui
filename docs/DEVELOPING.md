# Developing Scroll Down Sports

## Conceptual overview

Scroll Down Sports is built around a single promise: **highlights first, spoilers last**. Users pick a finished game, scroll through an article-style timeline of highlights, and only then reveal the final score and stats. The UI is intentionally calm and predictable so the spoiler-safe flow is easy to trust and easy to extend.

## Local development

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (typically `http://localhost:5173`).

### Optional API wiring

Set `VITE_API_URL` to use live adapters instead of mock JSON:

- `SportsApiAdapter` for games and stats.
- `SocialPostApiAdapter` for highlight posts.

To keep mocks enabled locally, set `VITE_USE_MOCK_ADAPTERS=true`.

## How X highlights are handled

- `src/components/embeds/XHighlight.tsx` renders custom highlight cards with native media elements.
- Media URLs are remote and never re-hosted; captions link back to the original X post.
- The component reserves layout space with a fixed aspect ratio, lazy-loads media on scroll, and clamps long captions with a “Show more” toggle.

## Spoiler-safe philosophy

- The replay timeline stays chronological so the scroll mirrors the game narrative.
- The reveal for final stats is gated by an `IntersectionObserver` trigger after the last highlight.
- Final scores appear at the end of the stats block to preserve the “no spoilers until you finish scrolling” promise.

## Future DB wiring notes (placeholder)

- Adapters in `src/adapters` already mirror the payloads we expect from the backend.
- Replacing mocks should only require swapping the adapter implementations and verifying the shape of `GameDetails` and `TimelinePost`.
- When the DB/API wiring is ready, keep the spoiler-safe ordering and reveal logic unchanged.
