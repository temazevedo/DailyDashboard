# DailyDashboard - Project Overview

<!-- blueprint:source-hash 9901422c52552ba9ec1882bd44fd215ac700a46dbb79ef4c25ee86e20efde950 -->

> A single-page desktop web dashboard: today's date in a normal text line
> above a digital clock, local weather, daily weight/mood/sleep tracking,
> task management, and a monthly sleep/mood chart.

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

1. **Project setup and header** - a plain date line ("Wednesday, 19
   October 2026"), a `|` separator, and the digital clock (`HH:MM:SS`) as
   inline text beside it, ticking once a second via `setInterval`.
2. **Weather card** - Open-Meteo current temperature and condition, browser
   geolocation with a fixed fallback-city constant, icon from the Weather
   Icons SVGs vendored from Open-Meteo's website (day/night variants via
   `is_day`); short error text on failure.
3. **Entry form wired to the backend** - optional weight (kg, decimal),
   mood (0-10), sleep (0-10); loads today's entry, one button upserts the
   row; empty fields save as NULL (never 0). Styled per the reference:
   uppercase `TODAY'S ENTRY` title, FA label icons, three equal fields,
   green Save button. Each successful save auto-refreshes the graph.
   mood on a fixed 0-10 axis, gaps where a value is NULL (`connectNulls`
   off, per line); chevron month navigation (next disabled on current month);
   per-metric averages ignoring NULLs, dash when a metric has no values.
5. **Task manager** - add/toggle/delete tasks for today, plus an
   "Unfinished from earlier days" query of tasks created before today that are
   not done, each showing its original date. Tasks never expire and never
   copy between days.
6. **Completed tasks hide/show group** - one collapsible `COMPLETED` section
   (collapsed by default) holding every done task, today's and older; rows
   show their original date unless created today.

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
  icons (weather icons are the Weather Icons SVGs vendored from Open-Meteo's
  website into `client/public/icons/`)
- **No** UI library, state management library, TypeScript, jQuery, SCSS,
  Tailwind, or date library; one plain CSS stylesheet is fine

## UI/UX

Single page (`/`), desktop only, one centered column (max ~760px) of stacked
cards in this order: header - plain date line plus digital clock dial (no
card, sits on page background) - weather - daily entry form - task manager -
monthly graph.

- **Dark theme** from the reference look (https://codepen.io/mattjuggins/pen/WGRRYx
  and `design/design-ref.png` for the color scheme; the circular-calendar
  header itself was removed in plan revision 2).
- Colors: page `#292929`, cards `#202020`, clock digits hours `#FFF`,
  minutes `#CCC`, seconds `#AAA`, separator `#555`, temperature `#FFCC00`,
  secondary text `#9a9a9a`.
- Header (plain): one centered row - the date "Wednesday, 19 October 2026"
  (`Intl.DateTimeFormat`, `#9a9a9a`, 14px), a `|` separator (`#9a9a9a`),
  then the digital time `HH:MM:SS` inline (hours and minutes `#CCC`,
  seconds `#AAA`, separators `#555`), one-second `setInterval`. No card,
  dial circle, SVG arcs, or rotation math. Secondary text `#9a9a9a`
  throughout; positive-action accent green `#3fd463` (entry Save button now,
  task buttons later).

New frontend state allowed for the graph card: only the selected month, e.g.
`"2026-10"`. The save-trigger is an App-level revision counter passed as a
prop (no new graph-card state, no events, no state library).

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
