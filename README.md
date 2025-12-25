# Scroll Down Sports

Scroll Down Sports is a spoiler-safe sports highlight viewer. Fans choose a date range, browse finished games without scores, and scroll through highlight posts. The final score and stats are revealed only after the reader reaches the end of the timeline.

## Features

- **Spoiler-safe browsing** with score reveal gated by scrolling behavior.
- **Date range filtering** for finished games.
- **Article-style replay** with embedded highlight posts.
- **Mock data adapters** backed by JSON fixtures for easy iteration.

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
```

## App routes

| Route | Description |
| --- | --- |
| `/` | Date range picker |
| `/games?start=YYYY-MM-DD&end=YYYY-MM-DD` | Filtered game list |
| `/game/:gameId` | Spoiler-safe replay |

## Data sources

The app uses mock JSON data in `src/data`:

- `games.json` feeds the game list and game details.
- `posts.json` feeds the replay timeline.

The adapters in `src/adapters` normalize flexible field names (for example, `home_team` vs `homeTeam`). See the docs in `docs/` for field expectations and adapter behavior.

## UI telemetry

UI telemetry is disabled in production. In development it can be toggled with:

```bash
VITE_UI_TELEMETRY=false
```

When enabled, events are logged via `console.info`.

## Documentation

Additional documentation lives in `docs/`:

- `docs/architecture.md` — component and routing overview.
- `docs/data-models.md` — JSON schema expectations for mock data.
- `docs/spoiler-controls.md` — spoiler-reveal behavior details.
- `docs/README.md` — doc index.
