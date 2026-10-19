# DailyDashboard - Project Plan

A single-page desktop web application. It welcomes the user with today's date in a circular calendar, shows the local weather, stores daily weight, mood and sleep, manages daily tasks, and charts sleep and mood by month.

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

- Page background `#292929`, cards and rings `#202020`, ring labels `#555`.
- Accent colors: day name `#4CD964`, month `#007AFF`, day `#FF2D55`, temperature `#FFCC00`.
- Font: Roboto Mono, monospace.
- Cards use the dark surface and a subtle shadow (`0 2px 2px #000`).
- Secondary text uses a lighter grey (about `#9a9a9a`) so it stays readable.

## Page layout

A single centered column (max width about 760px) of stacked cards, in this order.

### 1. Header: circular calendar with clock

Reimplement the reference as a React component with plain CSS or inline SVG. Do not copy its SCSS, HAML or jQuery. Keep only the central circular calendar; leave out the weather and steps side rings, the "HELLO" text and the intro fade-in sequence. The header has no card around it: the rings sit directly on the page background.

Structure (centered, concentric, all circles):

- **Center dial:** 150px, background `#202020`, shadow. Contains an analog clock with three hands (hour 10px x 50px `#FFF`, minute 10px x 70px `#CCC`, second 2px x 70px `#AAA`, rounded). A `setInterval` every second updates the rotation: seconds x 6, minutes x 6, hours x 30 + minutes / 2 degrees.
- **Day name ring:** 250px diameter. Labels MON TUE WED THU FRI SAT SUN.
- **Month ring:** 350px diameter. Labels JAN FEB ... DEC.
- **Day ring:** 450px diameter. Labels 01 to 31.

Each ring:

- Is a circle with a 45px band in `#202020` that is open at the bottom (the bottom 90 degrees is missing). Behind it, a faint white ring at 10% opacity (35px wide) acts as a track.
- Has its labels written around the arc, spanning 270 degrees from -135 to +135. Every label takes (letters + 1) character slots (the +1 is the space), so the angle per slot is `270 / (sections x (letters + 1))`. Text size 12px, color `#555`.
- Rotates so the current value sits at the top: `sectionWidth = 270 / sections`, `rotation = (135 - sectionWidth / 2) - sectionWidth x (value - 1)`, where `value` is 1-based. Use a CSS transition (about 0.5s) on the transform.
- Highlights the characters of the current value with its accent color (day name green, month blue, day pink).
- Sections and letters: day name 7 sections / 3 letters (Monday = 1 ... Sunday = 7), month 12 / 3, day 31 / 2.

### 2. Weather card

- Data from Open-Meteo, fetched directly from the browser.
- Location from the browser geolocation. If permission is denied, use a fixed fallback city defined as a constant at the top of the file.
- Shows the current temperature (`#FFCC00`) and the condition as text, with a Font Awesome icon chosen from the weather code (sun, cloud, cloud-rain, snowflake, etc.).
- If the request fails, show a short text message instead.

### 3. Daily entry form

- Fields: weight in kg (decimal), mood (0-10), sleep (0-10).
- Every field is optional. An empty field is saved as NULL, never as 0.
- Font Awesome icon on each field label (weight, face, moon).
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

1. Project setup and header: the three rings with today's date and the clock
2. Weather card
3. Entry form wired to the backend
4. Task manager
5. Monthly graph with averages panel

Start with step 1. State any assumption in one line, and do not add features that are not listed here.
