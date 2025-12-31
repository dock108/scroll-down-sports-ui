# Scroll Down Sports

Scroll Down Sports is a spoiler-safe sports highlight viewer. Fans choose a date range, browse finished games without scores, and scroll through highlights before revealing the final score and stats.

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Docker + nginx (production)

## Local setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). Ensure the sports admin API is running at `http://localhost:8000`.

### Environment variables

| Variable           | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `VITE_API_URL`     | Base URL for sports API (default: `http://localhost:8000`)      |
| `VITE_APP_VERSION` | Commit hash/version string displayed in the UI footer + status. |

## Deployment basics

```bash
docker compose -f docker-compose.local.yml up --build
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Documentation

Additional documentation lives in [`docs/README.md`](docs/README.md).
