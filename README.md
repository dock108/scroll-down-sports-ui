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
- **Optional API adapters** for live game + social data (guarded by a feature flag).

## What works today vs. mocked

**Working today**

- UI flow: date picker → game list → replay timeline.
- Spoiler-safe reveal that auto-unlocks final stats after the last highlight enters view.
- Twitter/X embeds for highlights.

**Mocked**

- Games list and details (`src/data/games.json`).
- Timeline highlight posts (`src/data/posts.json`).
- API adapters in `src/adapters` are shaped for future wiring but run against mocks by default.

**API-ready (opt-in)**

- Set `VITE_API_URL` and keep `VITE_USE_MOCK_ADAPTERS=false` to enable live adapters.

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

If you need environment variables locally, copy `.env.example` to `.env` and update values.

### Local Docker (dev)

Use the dev compose file for hot reload and local API access:

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Environment variables

| Variable                | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`          | Base URL for sports + social APIs.                               |
| `VITE_USE_MOCK_ADAPTERS`| Set to `true` to force mock adapters.                            |
| `VITE_APP_VERSION`      | Commit hash/version string displayed in the UI footer + status.  |

## Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Build for production
npm run preview  # Preview the production build
npm run build:prod   # Build for production with explicit mode
npm run preview:prod # Preview production build (hosted on 0.0.0.0)
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

## App routes

| Route                                    | Description         |
| ---------------------------------------- | ------------------- |
| `/`                                      | Date range picker   |
| `/games?start=YYYY-MM-DD&end=YYYY-MM-DD` | Filtered game list  |
| `/game/:gameId`                          | Spoiler-safe replay |
| `/status`                                | Health/status page  |

## Production container

The production container serves static assets with nginx and supports runtime env config via
`/env-config.js`.

Required environment variables for runtime configuration:

- `VITE_API_URL`
- `VITE_USE_MOCK_ADAPTERS`
- `VITE_APP_VERSION`

Docker Compose expects `UI_IMAGE` to point at the published container, for example:

```bash
UI_IMAGE=ghcr.io/your-org/scroll-down-sports-ui:latest
```

### Production Docker Compose

```bash
docker compose up -d
```

## CI/CD (GitHub Actions → Hetzner)

The workflow in `.github/workflows/ui-deploy.yml` builds and publishes the UI container on
pushes to `main`, then connects to Hetzner to pull + restart the UI service.

Required GitHub secrets:

- `HETZNER_HOST`
- `HETZNER_USER`
- `HETZNER_SSH_KEY`
- `HETZNER_SSH_PORT` (optional)
- `HETZNER_APP_PATH` (path to the server directory containing `docker-compose.yml`)

## Domain + proxy integration

An nginx proxy config for `scrolldownsports.dock108.dev` lives at:

- `docs/proxy/scrolldownsports.dock108.dev.conf`

It enables gzip compression, long-lived caching for static assets, and forwards the `/status`
health endpoint.

## Rollback notes

If a deploy needs to roll back on the server:

```bash
docker compose pull ui --ignore-pull-failures
docker compose down ui
docker compose up -d ui
```

To roll back to a specific image tag, update `UI_IMAGE` in the server's `.env` file and re-run:

```bash
docker compose pull ui
docker compose up -d ui
```

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
