# DailyDashboard

A single-page desktop web app: today's date in a circular calendar ring header,
local weather (Open-Meteo), daily weight/mood/sleep entries, a task manager,
and a monthly sleep/mood chart.

Planned layout:

- `client/` - Vite + React
- `server/` - Express + SQLite (better-sqlite3)

## Commands

npm is the package manager.

```bash
# first time
npm install            # in client/
npm install            # in server/

# run
npm start              # server/ - Express on port 3001: serves the built
                       # dashboard when client/dist exists, plus /api
npm run dev            # client/ - Vite dev server on http://localhost:5173
npm run build          # client/ - production build to client/dist
```

The Vite dev server proxies `/api` to the Express server.

## Deployment (home server)

One Node process serves everything: build once, then start the server.

```bash
npm install            # in server/ and in client/
npm run build          # in client/
npm start              # in server/ -> http://<home-host>:3001
```

- `client/dist` present: the dashboard and the API share one origin on port
  3001 (unknown paths fall back to the dashboard).
- `client/dist` absent: the server stays API-only (dev behavior).
- Data lives in `server/data/dashboard.db`, auto-created on first start.
- No environment variables, no test runner, no external services required
  (weather comes from the public Open-Meteo API via the browser).
- The server has no authentication and listens on all interfaces - intended
  for a private home network, not the public internet.

Testing is opt-in. No test command exists yet.

Planning and workflow notes live in `PLAN.md` and `blueprint/`.
