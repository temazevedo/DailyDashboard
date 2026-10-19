# DailyDashboard - Project Overview

<!-- blueprint:source-hash 969e1e5a342419170dcd0a455a2a599a0139849f3ae254fc18473923c55c8539 -->

> A single-page desktop web dashboard: today's date in a circular calendar,
> local weather, daily weight/mood/sleep tracking, task management, and a
> monthly sleep/mood chart.

Source of truth: `blueprint/project-plan.md` (verbatim copy of root `PLAN.md`).
The plan's Guidelines section is strict law: simplicity first, no emojis
anywhere (UI, code, comments, README), Font Awesome icons only via CDN
stylesheet in `index.html` and only where the plan lists them, desktop only
(fixed pixel sizes, no media queries), and no features beyond the plan.

## Problem

No single glanceable place for the day: the date, local weather, body tracking
(weight/mood/sleep), today's tasks, and how sleep and mood moved over a month.
This app puts all five on one dark screen, refreshed daily.

## Features

In build-plan order. Headline piece is the circular calendar header.

1. **Project setup and header** - three date rings (day/month/day-number) with
   an analog clock at the center, ticking once a second via `setInterval`.
2. **Weather card** - Open-Meteo current temperature and condition, browser
   geolocation with a fixed fallback-city constant, Font Awesome icon from the
   weather code; short error text on failure.
3. **Entry form wired to the backend** - optional weight (kg, decimal),
   mood (0-10), sleep (0-10); loads today's entry, one button upserts the
   row; empty fields save as NULL (never 0).
4. **Task manager** - add/toggle/delete tasks for today, plus an
   "Unfinished from earlier days" query of tasks created before today that are
   not done, each showing its original date. Tasks never expire and never
   copy between days.
5. **Monthly graph with averages panel** - Recharts line chart of sleep and
   mood on a fixed 0-10 axis, gaps where a value is NULL (`connectNulls`
   off, per line); chevron month navigation (next disabled on current month);
   per-metric averages ignoring NULLs, dash when a metric has no values.

## Data model

SQLite via `better-sqlite3`, single file auto-created on first server start.
Schema is fixed by the plan - lock these shapes.

### entries

- `date` (TEXT, PRIMARY KEY, `YYYY-MM-DD`)
- `weight_kg` (REAL, NULL)
- `mood` (INTEGER, NULL, 0-10)
- `sleep` (INTEGER, NULL, 0-10)

One row per day, upserted by the entry form (`PUT /api/entries/:date`).
`AVG()` ignores NULLs for the stats averages.

### tasks

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `text` (TEXT NOT NULL)
- `date` (TEXT NOT NULL, creation date `YYYY-MM-DD`)
- `done` (INTEGER NOT NULL DEFAULT 0)

Stored once per task with its creation date; the unfinished list is a query,
not a copy.

### Server validation

- Weight: positive number, or NULL/missing.
- Mood, sleep: integer 0-10, or NULL/missing.
- Task text: not empty.

## API (seven endpoints, JSON; server has no weather endpoint)

| Method | Path | Behaviour |
| --- | --- | --- |
| GET | `/api/entries/:date` | Entry or empty object |
| PUT | `/api/entries/:date` | Upsert |
| GET | `/api/tasks?date=YYYY-MM-DD` | `{ today: [...], unfinished: [...] }` |
| POST | `/api/tasks` | Body `{ text, date }` |
| PATCH | `/api/tasks/:id` | Toggles done |
| DELETE | `/api/tasks/:id` | Removes the task |
| GET | `/api/stats?month=YYYY-MM` | `{ entries: [{ date, mood, sleep }], average: { mood, sleep } }` |

`/api/stats` month filter is `date >= 'YYYY-MM-01' AND date < first day of
next month`; averages come from SQL `AVG()` and are NULL when the month has
no values.

## Tech stack

- **React + Vite (plain JavaScript)** - frontend, no TypeScript
- **Express** - backend, `client/` and `server/` layout, Vite proxies `/api`
  in development
- **better-sqlite3** - SQLite on disk, auto-created
- **Recharts** - monthly line chart
- **`Date` / `Intl.DateTimeFormat`** - dates only, no date library
- **Open-Meteo** - weather, fetched straight from the browser, no API key
- **Roboto Mono** (Google Fonts) and **Font Awesome** (CDN) - typography and
  icons
- **No** UI library, state management library, TypeScript, jQuery, SCSS,
  Tailwind, or date library; one plain CSS stylesheet is fine

## UI/UX

Single page (`/`), desktop only, one centered column (max ~760px) of stacked
cards in this order: rings header (no card, sits on page background) -
weather - daily entry form - task manager - monthly graph.

- **Dark theme** from the reference header (https://codepen.io/mattjuggins/pen/WGRRYx),
  mirrored from `design/design-ref.png` and the claude.ai artifact linked in
  `PLAN.md`.
- Colors: page `#292929`, cards/rings `#202020`, ring labels `#555`, accents:
  day name `#4CD964`, month `#007AFF`, day `#FF2D55`, temperature `#FFCC00`,
  secondary text `#9a9a9a`.
- Card shadow `0 2px 2px #000`, font Roboto Mono.
- Rings: center dial 150px with analog clock (hour 10x50 `#FFF`, minute 10x70
  `#CCC`, second 2x70 `#AAA`); day-name 250px, month 350px, day 450px; each
  ring a 45px `#202020` band open at the bottom over a 35px white 10% track,
  arc labels spanning -135..+135 degrees, rotation formula and 0.5s CSS
  transition as specified in the plan.

New frontend state allowed for the graph card: only the selected month, e.g.
`"2026-10"`.

## Usage model

Stated in the plan: single-user app, no auth, desktop-only web UI. Nothing
else about scale, trust, or availability was established.

## Users

> TODO - the plan implies a personal dashboard but does not define user types.

## Monetization

> TODO - not addressed in the plan; treat as not in v1.

## Deployment

> TODO - target host, build/start commands, env vars, and domain are not
> decided. Local development: Vite dev server proxying `/api` to Express.
