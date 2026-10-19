# Feature: Monthly graph with averages panel

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/monthly-graph-with-averages-panel
**Status:** verified (all steps built; stats endpoint suite observed over live HTTP including the rejected month fix; build passes)

## Goal

Add the graph card to the dashboard: a Recharts line chart of sleep and mood
for a selected month, chevron month navigation, and an averages panel, fed by
the `GET /api/stats?month=` endpoint (the stats endpoint is added this
feature; the task endpoints stay out of scope).

## In scope

- Server endpoint `GET /api/stats?month=YYYY-MM` in `server/src/index.js`
  (Express + `better-sqlite3`; `entries` schema already exists).
- `recharts` (v3, supports React 19) installed as the only new dependency -
  the stack already names it.
- `client/src/components/GraphCard.jsx`: line chart with two lines (sleep,
  mood) on a fixed 0-10 axis, NULL gaps (`connectNulls={false}` per line),
  chevron month navigation, averages panel per `design/design-ref.png`
  (title `SLEEP AND MOOD`, chart left, panel right, legend below).
- Frontend state: only the selected month, e.g. `"2026-10"`.
- Card styles in `client/src/styles.css` reusing existing tokens.

## Out of scope

- Task manager card (feature 5). The server handles only the stats endpoint
  this feature adds.
- No rounding Easting of stored data; averages are computed by SQL `AVG()`
  and formatted to one decimal on the client.
- No tooltip, no zoom, no responsive handling (desktop only, fixed sizes).
- No FA icons beyond the plan list: two chevrons in the header and one
  moon + one smile icon in the averages panel.

## Build loop

Per `blueprint/config.json` (`stepReview: "feature"`,
`checkpointCommits: "disabled"`): build all small steps on the feature
branch, a checkpoint review pause follows the last step before `/complete`.
No intermediate commits except the final one at `/complete`.

## Build steps

- [x] 1. Server: `GET /api/stats?month=YYYY-MM`. In `server/src/index.js`:
    - Validate `month` against `^\d{4}-\d{2}$`; otherwise
      `400 { "error": "Invalid month" }`.
    - Bounds are strings compared lexicographically on the `YYYY-MM-DD`
      TEXT date: `date >= '<month>-01'` and
      `date < <first day of the next month>` (from 12 the next month is 01
      of the following year).
    - One prepared `SELECT date, mood, sleep FROM entries WHERE ... ORDER BY
      date ASC` for `entries` (rows only for days that have a row; a stored
      row with all-null mood/sleep still counts as a stable day but its
      missing values are null).
    - Averages: second prepared statement `SELECT AVG(mood) AS mood,
      AVG(sleep) AS sleep FROM entries WHERE ...` over the same bounds;
      `AVG()` ignores NULLs and returns NULL when the month has no values.
    - Respond `200 { entries: [{ date, mood, sleep }], average: { mood,
      sleep } }` (raw SQL values; no client-visible rounding server-side).
    **Done when:** with the server running, `curl -s
    'localhost:3001/api/stats?month=2026-10'` returns the real month's rows
    and averages; `month=2000-02` returns `{ entries: [], average: { mood:
    null, sleep: null } }`; `month=2026-13` and `month=x` return
    `400 {"error":"Invalid month"}`.
- [x] 2. Client: install `recharts` and create `GraphCard.jsx`.
    - `npm install recharts` in `client/` (plain dependency).
    - State: `month` (`"YYYY-MM"`, initial = today's local month), `data`
      (the same `{ entries, average }` shape or null while loading),
      `failed` (boolean).
    - On mount and on month change, `fetch`
      `/api/stats?month=<month>`; failure sets the error card state
      (`Could not load graph data.` saved wording).
    - Transform `entries` rows to `{ day: <number from the date suffix>,
      mood, sleep }` for the chart data array.
    - Chart (Recharts, height 240): `LineChart` with `CartesianGrid`
      (horizontal only), `XAxis` (`domain [1, daysInMonth]`, ticks
      `[1, 5, 10, 15, 20, 25, 30]`), `YAxis` (`domain [0, 10]`, ticks
      `[0, 2, 4, 6, 8, 10]`), one `Line` per metric with
      `connectNulls={false}` and `dot={false}`. No tooltip, no legend
      component from Recharts (a plain HTML legend row is used below).
    - Month label between the two chevron buttons:
      `<MonthName YYYY>` via `Intl.DateTimeFormat` on `new Date(year,
      monthIndex, 1)`. Prev button goes back one month (no lower bound);
      next button moves forward and must be `disabled` when
      `month === todayMonth` (computed locally, not via the server).
    - Averages panel: rows for sleep (moon icon, blue) and mood (smile
      icon, red), each `Avg sleep <value>` / `Avg mood <value>` with the
      value formatted `toFixed(1)` (`7.0`); a dash `-` instead of a number
      when that metric's average is null.
    **Done when:** building the card in a running dev client shows the
    rendered chart (or error state) matching the API, and the next-month
    button is disabled on today's month; `npm run build` passes after the
    dependency install.
- [x] 3. Styles and wiring. Render `<GraphCard />` in `App.jsx` after
    `EntryForm`. `styles.css`: `.graph-title` (same treatment as
    `.entry-title`), `.graph-controls` (header row with chevron buttons and
    month label), `.graph-button` (square bordered buttons like
    `design-ref.png`; disabled state dimmed), `.graph-body` (chart left,
    `.graph-panel` divider on the right), `.graph-avg-label`,
    `.graph-avg-value`, `.graph-legend`, `.graph-loading`, `.graph-error`
    (secondary 14px). Fixed desktop sizes. Run `npm run build` in
    `client/`. **Done when:** the build passes and the page shows the four
    cards in order header - weather - entry form - graph.

## Files / areas

- `server/src/index.js` - add the stats endpoint (only server file touched).
- `client/package.json` - add `recharts` (installed by npm, not hand-edited).
- `client/src/components/GraphCard.jsx` (new).
- `client/src/App.jsx` - render `GraphCard`.
- `client/src/styles.css` - graph card styles.

## Data / contracts

- `entries` (existing, unchanged): `date` TEXT PK `YYYY-MM-DD`,
  `weight_kg` REAL NULL, `mood` INTEGER NULL 0-10, `sleep` INTEGER NULL
  0-10. The graph only reads `date`, `mood`, `sleep`.
- `GET /api/stats?month=YYYY-MM` -> `200 { entries: [{ date, mood, sleep }],
  average: { mood, sleep } }`; `400 {"error":"Invalid month"}` for a
  malformed month. `average` values are NULL when the month has no values
  for that metric. Rows are ordered by `date` ascending.
- Graph gaps: a calendar day with no stored value is not in `entries`, so
  the line simply has no point there (`connectNulls={false}` keeps the gap).
- Client requests only the selected month at a time through the Vite proxy.

## Testing

No test runner installed; the automated gate is `npm run build` in
`client/`. The stats endpoint is verified live with `curl` in step 1; chart
rendering and month navigation are verified in the running browser during
the step-3 review. No browser or unit test commands exist.

## Notes for the AI

- Keep the Express handler inline in `server/src/index.js` next to the
  entry endpoints (still no router abstraction).
- Express 5: `req.query.month` with `express.json()` already mounted.
- Chart colors are sampled from `design/design-ref.png` and recorded as
  spec decisions: sleep lines/labels blue `#45a6f5`, mood red `#f84c5d`,
  grid/axis stroke `#555`, average value text `#ccc` on `--color-surface`.
  Two chevron buttons and the two average-icon glyph names must be verified
  against the Font Awesome 7.1 CDN CSS (grep `.fa-chevron-left{--fa`,
  `.fa-chevron-right{--fa`, `.fa-moon{--fa`, `.fa-smile{--fa`) as done for
  the entry card.
- Recharts v3 with React 19 is validated by the build and the dev render.
- A stored row with `weight_kg` only still counts; its `mood` and `sleep`
  read as null in the response and produce gaps.
- Error wording lives in one status/error line per card, same pattern as
  the other cards.

## Open questions

None - chart color values and average formatting are recorded as spec
decisions sampled from the reference look rather than blocking choices.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":8220,"specSha256":"cb69d667c4489b50bdec073f089d3b12ad072782274834b042710f43016327ff","branch":"refs/heads/feature/monthly-graph-with-averages-panel","head":"f7af47385183634ddc0f778979b9a1c7873c60de","baseRef":"refs/heads/master","baseCommit":"f7af47385183634ddc0f778979b9a1c7873c60de","sourceTree":"802d2c18400066387e5725f88a09286357bcd673","landing":"local-merge","absentOptional":[]} -->


## Try it now

```bash
cd server && npm start      # terminal 1
cd client && npm run dev    # terminal 2, open http://localhost:5173
```

- Normal: the `SLEEP AND MOOD` card sits under the entry form, chart on the
  left, averages panel (Avg sleep / Avg mood) on the right, legend below.
- November gap check: cep next month - the chart shows no data for months
  with no entries (gaps, never zeros), averages show a dash.
- Prev month: goes back; the stored month rows keep the lines.
- Next month on the current month: the right chevron is disabled.
- Server down (after load): the chart area shows `Could not load graph data.`
  on refresh; saving entries still fails per feature 3 wording.
