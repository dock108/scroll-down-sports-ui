# Scroll Down Sports

Scroll Down Sports is a spoiler-safe sports highlight viewer. Fans choose a date range, browse finished games without scores, and scroll through highlights before revealing the final score and stats.

This codebase is intentionally simple — the UI must remain predictable and readable while we experiment with flows.

## Project purpose

The goal is to validate the spoiler-safe replay experience before wiring live data. The UI stays lightweight and readable so it is easy to iterate on flows, storytelling, and reveal mechanics.

## MVP scope

- **Spoiler-safe browsing** with score reveal gated by scrolling behavior.
- **Date range filtering** for finished games.
- **Article-style replay** with embedded highlight posts.
- **Mock data adapters** backed by JSON fixtures for easy iteration.

## What works today vs. mocked

**Working today**

- UI flow: date picker → game list → replay timeline.
- Spoiler-safe reveal that unlocks final stats at the end of the scroll.
- Twitter/X embeds for highlights.

**Mocked**

- Games list and details (`src/data/games.json`).
- Timeline highlight posts (`src/data/posts.json`).
- API adapters in `src/adapters` are shaped for future wiring but run against mocks by default.

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

## Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Build for production
npm run preview  # Preview the production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

## App routes

| Route                                    | Description         |
| ---------------------------------------- | ------------------- |
| `/`                                      | Date range picker   |
| `/games?start=YYYY-MM-DD&end=YYYY-MM-DD` | Filtered game list  |
| `/game/:gameId`                          | Spoiler-safe replay |

## Roadmap (short + real)

1. Wire adapters to the real sports + social APIs.
2. Replace JSON fixtures with DB-backed responses.
3. Add richer play-by-play metadata while preserving spoiler-safe reveal.

## Documentation

Additional documentation lives in `docs/`:

- `docs/DEVELOPING.md` — local development + architecture notes.
- `docs/architecture.md` — component and routing overview.
- `docs/data-models.md` — JSON schema expectations for mock data.
- `docs/spoiler-controls.md` — spoiler-reveal behavior details.
- `docs/README.md` — doc index.
