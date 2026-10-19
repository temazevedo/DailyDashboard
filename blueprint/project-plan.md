# DailyDashboard - Project Plan

A single-page desktop web application. It welcomes the user with today's date in a normal text line above a digital clock, shows the local weather, stores daily weight, mood and sleep, manages daily tasks, and charts sleep and mood by month.

Visual prototype: https://claude.ai/artifact/D3yBoTqKJbGAMjcnK93ppL

## Guidelines (follow strictly)

1. Keep things simple. Be careful with abstractions and do not over-complicate.
2. No emojis anywhere (UI, code, comments, README).
3. Icons: Font Awesome only, loaded through its CDN stylesheet in `index.html`. Use icons only where listed in this plan.
4. Desktop only. No responsive or mobile handling, no media queries. Fixed pixel sizes are fine.
5. Do not add features that are not listed here.

## Stack

| Part | Choice |
| --- | --- |
| Frontend | React with Vite. Plain CSS (one stylesheet is fine). No UI library, no state management library, no TypeScript, no jQuery, no SCSS |
| Backend | Node.js with Express |
| Database | SQLite via `better-sqlite3` (single file, created automatically on first start) |
| Graph | Recharts |
| Dates | Built-in `Date` and `Intl.DateTimeFormat`, no date library |
| Weather | Open-Meteo (free, no API key), fetched directly from the browser |
| Font | Roboto Mono from Google Fonts |
| Auth | None (single-user app) |

## Project layout

```
daily-dashboard/
  client/   (Vite + React)
  server/   (Express + SQLite)
  README.md
```

The README gives the commands to install and run both parts. In development, the Vite dev server proxies `/api` to the Express server.

## Visual style

Dark theme for the whole app, taken from the reference header (https://codepen.io/mattjuggins/pen/WGRRYx).

- Page background `#292929`, cards `#202020`.
- Digital clock: hours and minutes `#CCC`, seconds `#AAA`, separator `#555`; date `#9a9a9a`; temperature `#FFCC00`.
- Font: Roboto Mono, monospace.
- Cards use the dark surface and a subtle shadow (`0 2px 2px #000`).
- Secondary text uses a lighter grey (about `#9a9a9a`) so it stays readable.
- Positive-action accent green `#3fd463`, used by the entry form Save button (and later the task-manager buttons), from the reference look.

## Page layout

A single centered column (max width about 760px) of stacked cards, in this order.

### 1. Header: date and digital clock

One centered row directly on the page background (no card, no dial circle),
simple and flat: the date first, then a `|`, then the digital time.

- **Date line:** today's date as normal text, for example "Wednesday, 19 October 2026", formatted by `Intl.DateTimeFormat` (weekday long, 2-digit day, long month, year). Color `#9a9a9a`, size 14px, Roboto Mono.
- **Separator:** a `|` between the date and the time, color `#9a9a9a`.
- **Digital time:** `HH:MM:SS` in Roboto Mono, 14px, right after the separator: hours and minutes `#CCC`, seconds `#AAA`, in-text separators `#555`. A `setInterval` every second updates the displayed time.

No circular calendar rings, no SVG arcs, no rotation math, and no dial circle.

### 2. Weather card

- Data from Open-Meteo, fetched directly from the browser.
- Location from the browser geolocation. If permission is denied, use a fixed fallback city (Braga) defined as a constant at the top of the file.
- Shows the current temperature (`#FFCC00`) and the condition as text, with an icon chosen from the weather code - the Weather Icons SVGs vendored from Open-Meteo's website (`client/public/icons/`, served locally, inverted to show on the dark theme), with day/night variants picked via Open-Meteo's `is_day`. Font Awesome remains the icon font for the rest of the app.
- If the request fails, show a short text message instead.

### 3. Daily entry form

- Fields: weight in kg (decimal), mood (0-10), sleep (0-10).
- Every field is optional. An empty field is saved as NULL, never as 0.
- Font Awesome icon on each field label (weight, face, moon).
- Looks like the reference: small uppercase section title `TODAY'S ENTRY`, three equal-width labelled fields, inputs with `#555` borders on `#292929`, and a green (`#3fd463`) Save button aligned right.
- Loads today's entry on page load (empty fields stay empty) and saves with one button. Saving again on the same day updates the row, so clearing a field and saving sets it back to NULL.

### 4. Task manager

- Section "Today": tasks created for today. Add a task, tick it done, delete it.
- Section "Unfinished from earlier days": tasks from before today that are not done, each showing its original date. They stay until completed or deleted (no expiry).
- Do not copy tasks between days. Each task is stored once with its creation date; the unfinished list is a query.
- Font Awesome icons for add, check and delete.

### 5. Monthly graph

- One line chart with two lines, sleep and mood, on the same fixed 0-10 y-axis.
- X-axis shows the days of the selected calendar month (1 to 28/30/31).
- Days without a value appear as gaps, never as zero (`connectNulls` off). This applies per line: a day with mood but no sleep breaks only the sleep line.
- Opens on the current month. Chevron-left and chevron-right buttons in the card header move to the previous or next month. The next button is disabled on the current month.
- Averages panel on the right of the chart: average sleep and average mood for the displayed month, each computed only from days where that value is not null (sleep and mood are counted separately). If a month has no values for one of them, show a dash instead of a number. Icons: moon for sleep, face for mood.
- The only new frontend state for this card is the selected month, for example `"2026-10"`.

## Database

```sql
CREATE TABLE entries (
  date      TEXT PRIMARY KEY,   -- YYYY-MM-DD
  weight_kg REAL NULL,
  mood      INTEGER NULL,
  sleep     INTEGER NULL
);

CREATE TABLE tasks (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  date TEXT NOT NULL,           -- creation date, YYYY-MM-DD
  done INTEGER NOT NULL DEFAULT 0
);
```

Validation on the server:

- Weight, mood and sleep may each be null or missing.
- If present, mood and sleep must be integers from 0 to 10, and weight must be a positive number.
- Task text must not be empty.

## API (seven endpoints, JSON)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/entries/:date` | Returns the entry, or an empty object |
| PUT | `/api/entries/:date` | Insert or update (upsert) |
| GET | `/api/tasks?date=YYYY-MM-DD` | Returns `{ today: [...], unfinished: [...] }` |
| POST | `/api/tasks` | Body `{ text, date }` |
| PATCH | `/api/tasks/:id` | Toggles done |
| DELETE | `/api/tasks/:id` | Removes a task |
| GET | `/api/stats?month=YYYY-MM` | Returns `{ entries: [{ date, mood, sleep }], average: { mood, sleep } }` |

Notes on `/api/stats`:

- The month filter is `date >= 'YYYY-MM-01' AND date < first day of next month`.
- Mood and sleep may be null in `entries`.
- Averages are computed in SQL with `AVG()`, which ignores NULL values. An average is null when the month has no values.

The server has no weather endpoint.

## Build order

Build and confirm each step before moving on.

1. Project setup and header: today's date and the digital clock
2. Weather card
3. Entry form wired to the backend
4. Task manager
5. Monthly graph with averages panel

Start with step 1. State any assumption in one line, and do not add features that are not listed here.
