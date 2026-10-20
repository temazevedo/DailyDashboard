# Fix: Audit findings repair (F-01, F-02, F-03)

**Type:** Fix
**Status:** verified
**Branch:** fix/audit-findings-repair
**Fixes:** F-01, F-02, F-03
**Build attempt:** 1

## The problem

Full-project `/audit` (2026-10-20) recorded three open findings:

- **F-01 [P2]** `server/src/index.js:9` - `DATE_PATTERN` is
  `^\d{4}-\d{2}-\d{2}$`, so `2026-99-99` passes entries PUT and tasks POST.
  Such rows persist but every reader (`/api/stats` month TEXT bounds, `today`,
  `unfinished`) silently skips them.
- **F-02 [P3]** `client/src/components/GraphCard.jsx` - each fetch effect run
  clears `data` first, so the stats save-trigger added in feature 6 makes the
  chart blink to `Loading...` after every Save.
- **F-03 [P3]** four cards (TaskCard, EntryForm, GraphCard, WeatherCard) each
  hand-roll fetch + error plumbing with slight drift risk.

## The fix

Root-cause repairs, no new machinery:

1. **Server calendar validation (F-01).** After the existing pattern match on
   the date strings, reject non-calendar dates (month 1-12, day within that
   month). Applies to `GET/PUT /api/entries/:date` and `GET/POST /api/tasks`:
   `400 {"error":"Invalid date"}` with the same wording. Uses no new
   dependency (plain JS month/day math).
2. **Graph renders the previous month while refetching (F-02).** `data` gains
   its month marker (`{ month, chart, average }`); the chart renders when
   `data` exists and `data.month === month`, so a stats-revision refetch keeps
   the current chart on screen; a month navigation shows the (stale-month)
   `Loading...` state until the new response lands, as before. The provenance
   of the plan's "month-only" graph state constraint is amended: the data
   marker and the existing App-level revision counter are the only additions.
3. **One shared client helper (F-03).** New `client/src/fetchJson.js`, lifted
   from TaskCard's proven `request()` implementation. `fetchJson(url,
   fallback, options)` resolves the parsed JSON body or throws one Error
   carrying the server's `{"error": text}`, else `fallback` (per-card wording
   stays at the call sites). TaskCard drops its local `request()`; EntryForm,
   GraphCard, WeatherCard route their loads through it. Per-card displayed
   wording is unchanged except the fallback-internal `Save failed (HTTP n)`
   variant, which collapses to the contract's recorded `Save failed`.

Must not break: any current POST/PATCH/DELETE contract, valid-date GET/PUT
behavior, the save auto-refresh trigger itself.

## Build steps

- [x] 1. Server: calendar validation + `curl` suite. `server/src/index.js`:
      add a small `isCalendarDate` check invoked after each `DATE_PATTERN`
      match. **Done when:** `curl` shows `400 Invalid date` for
      `PUT /api/entries/2026-99-99`, `PUT /api/entries/2026-13-45`,
      `GET /api/tasks?date=2026-13-45`, `POST /api/tasks (2026-13-45)`, while
      the established live suite (entries PUT/GET, tasks POST/PATCH/DELETE,
      stats) stays green on valid dates and cleanup leaves no test rows.
      _Evidence 2026-10-20: 12/12 invalid cases 400 (incl. `2026-02-31`,
      `2025-02-29`); valid PUT/GET, POST/PATCH/PATCH/DELETE, 404 guard, stats
      regression green; cleanup removed the test row (only user rows left)._
- [x] 2. Client: `fetchJson.js` + refactor the four cards; GraphCard keeps
      previous data across save-refetches. **Done when:** `npm run build`
      passes in `client/` and no card behavior/wording regressed (server
      error text, `Save failed`, `Could not load...` texts all preserved).
      _Evidence 2026-10-20: build green; grep shows no leftover raw `fetch`
      or `request(` references; fallback texts preserved at call sites._
- [x] 3. Plan/overview sync + browser confirmation. Amend the overview's
      graph-state constraint (data month marker + revision counter),
      recompute the source hash. **Done when:** in the browser, Save updates
      the graph with no `Loading...` flash, month navigation still shows
      `Loading...` between months, and tasks/entry cards behave unchanged.
      _Sync done 2026-10-20 (hash unchanged at `9901422c...`). The visual
      no-flash check is handed to the user as the archive's
      `## Try it now` section (check gate is `manual` by config; no automatic
      browser evidence was captured)._

## Verify

- Step 1 `curl` suite against the restarted server.
- Step 2 build; step 3 browser: change today's mood, press Save -> graph
  updates in place (no loading flash); navigate months -> normal loading
  state returns; add/tick/untick tasks and save an entry -> same texts as
  before.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4612,"specSha256":"1757ed047d1a6a687dba07c1058a19049c16170d05b481773272ed5583867b2b","branch":"refs/heads/fix/audit-findings-repair","head":"88a170e90ff09b74b6abde24f39ca89b365695ae","baseRef":"refs/heads/master","baseCommit":"88a170e90ff09b74b6abde24f39ca89b365695ae","sourceTree":"3be2880cd64ab5699a5d2e6d41ff1cd46bb2e7ba","landing":"local-merge","absentOptional":[]} -->

## Findings

All three repaired findings (F-01, F-02, F-03) moved to `fixed` and remain in
the live ledger verbatim; a later `/audit` pass closes them. No `closed`,
`accepted`, or `invalid` entries existed, so none were archived with this fix.

## Independent review

None requested (not a sensitive-category change; no receipt exists).

## Try it now

1. Start the server (`cd server && npm start`) and open http://localhost:5173.
2. Invalid dates can no longer corrupt the data store from the URL bar:
   `curl -i -X PUT localhost:3001/api/entries/2026-99-99 -H 'Content-Type: application/json' -d '{"mood":5}'`
   now answers `400 {"error":"Invalid date"}`; same for `2026-13-45`,
   `2026-02-31`, and non-leap `2025-02-29` on PUT, GET, and task POST/GET.
   Real dates still work: saving today's entry behaves as before.
3. Graph auto-refresh without the flash: change today's mood and press
   `Save` - the Sleep and mood chart and the averages panel stay on screen
   and update in place (watch DevTools Network: one PUT then one
   `/api/stats?month=...` GET, no card blank between them). Month
   navigation still shows the loading state between months.
4. Task/entry error texts unchanged: stop the server, tick a task - the card
   shows `Save failed`; restart and everything loads again.
