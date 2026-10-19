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
npm start              # server/ - Express API on port 3001
npm run dev            # client/ - Vite dev server on http://localhost:5173
npm run build          # client/ - production build to client/dist
```

The Vite dev server proxies `/api` to the Express server.

Testing is opt-in. No test command exists yet.

Planning and workflow notes live in `PLAN.md` and `blueprint/`.
