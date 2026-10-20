# Feature: Completed tasks hide/show group

**From build-plan:** feature 6
**Build attempt:** 1
**Branch:** feature/completed-tasks-hideshow-group
**Status:** verified (revision 2: completed group collapsed by default; saving today's stats auto-refreshes the graph)

## Goal

Group every completed task - today's and older - into one collapsible
`COMPLETED` section in the task card, with a hide/show chevron toggle,
visible by default. This also surfaces done tasks from earlier days, which
previously showed nowhere, so the `GET /api/tasks` response gains a
`completed` list and `today` narrows to not-done rows.

## In scope

- `GET /api/tasks?date=` response change in `server/src/index.js`
  (additive key + `today` filter change; POST/PATCH/DELETE untouched).
- `client/src/components/TaskCard.jsx`: render the completed group after
  the unfinished list, with the collapse toggle holding a
  `showCompleted` boolean (frontend state only, defaults to visible).
- Card styles in `client/src/styles.css` for the toggle row.

## Out of scope

- No persistence for the collapsed/expanded choice: it resets to visible
  on reload (no new state beyond the boolean).
- No change to POST/PATCH/DELETE contracts; moving between lists happens
  through the existing refetch flow.
- No migration: the `tasks` table is unchanged.

## Build loop

Per `blueprint/config.json` (`stepReview: "feature"`,
`checkpointCommits: "disabled"`): all steps on the feature branch, one
checkpoint review pause before `/complete`. No intermediate commits.

## Build steps

- [ ] 1. Server: the completed list and the narrowed `today` list. In
    `server/src/index.js`:
    - New prepared query: all `done = 1` tasks, `ORDER BY date DESC, id
      DESC` (uniform with the unfinished list; rows carry `id, text, date,
      done`).
    - `today` list query narrows to `date = ? AND done = 0` (order and
      shape unchanged; done rows moved out).
    - `GET /api/tasks?date=` -> `200 { today: [{ id, text, date, done:
      0 }...], unfinished: [...], completed: [{ id, text, date, done: 1
      }...] }`; the date param validation and 400 stay as-is.
    **Done when:** live `curl` suite passes: GET shows done tasks (today's
    and older, any dates) under `completed` and only not-done rows under
    `today` and `unfinished`; POST/PATCH regression stays green (the
    entries/graph endpoints untouched).
- [ ] 2. Client: the group in `TaskCard.jsx`.
    - New `showCompleted` state, default `false` (collapsed by default; the
  chevron expands it).
    - Toggle row after the unfinished list: chevron button
      (`fa-chevron-down` when expanded, `fa-chevron-right` when collapsed;
      `aria-expanded` reflects state) plus the label `Completed (n)` where
      `n` is the list length. Clicking toggles `showCompleted`.
    - The group renders only when the list is non-empty (a `Completed (0)`
      toggle button would be noise; the group reappears on the next
      refetch when something completes).
    - Rows reuse `TaskRow` with `showDate={task.date !== todayKey()}`
      (older rows show their original date; today's rows go dateless).
    - No change to add/toggle/delete handling: unticking a completed row
      sends it back to TODAY (created today) or to the unfinished list
      (older) via the existing refetch.
    **Done when:** the running dev client shows ticked rows moving into
    the collapsed group, the chevron expands the rows, unticking returns a
    row to Today or Unfinished, and a reload restores the collapsed
    (default) state.
- [ ] 3. Graph auto-refresh on stats save. App-level wiring (no state
    library, no events): `App.jsx` holds one `statsRevision` counter with
    an `onSaved` callback passed to `EntryForm`; `EntryForm` calls it after
    a successful PUT; `GraphCard` takes the revision as a prop and its
    fetch `useEffect` depends on `[month, statsRevision]`, so every
    successful save refetches the displayed month (the same fetch/helper
    as month navigation, not a new API shape).
    **Done when:** with the dev client running, saving an entry updates
    the graph's lines and averages without a manual reload (observable:
    change one saved value, press Save, the dot/line renders new data).
- [ ] 4. Styles. `styles.css`: `.task-group-toggle` row (12px uppercase
    letter-spaced label in `--accent-positive`, chevron button matching
    the graph-button look at 26px, `aria-expanded` handles no separate
    disabled styling needed), same `.task-row` reuse. Run `npm run build`
    in `client/`. **Done when:** the build passes and the collapsed state
    visually matches collapsed graph/entry spacing (rows disappear, label
    row stays).

## Files / areas

- `server/src/index.js` - the `completed` query and the narrowed `today`
  query (only server file).
- `client/src/components/TaskCard.jsx` - the group and its toggle state.
- `client/src/styles.css` - the toggle row styles.

## Data / contracts

- `tasks` table unchanged (`id`, `text`, `date`, `done` 0|1 INTEGER).
- `GET /api/tasks?date=YYYY-MM-DD` -> `200 { today: [...], unfinished:
  [...], completed: [...] }`:
  - `today`: not-done tasks with `date = <param>`, `id ASC`.
  - `unfinished`: not-done tasks with `date < <param>`, `date DESC, id
    DESC`.
  - `completed`: every done task regardless of date, `date DESC, id DESC`.
  - malformed date -> `400 {"error":"Invalid date"}` (unchanged).
- POST/PATCH/DELETE contracts unchanged; the completed group is a query
  like the other lists (tasks are never copied or re-parented).
- The collapse choice stays frontend-only and resets to expanded on
  reload (recorded decision).

## Testing

No test runner installed; the automated gate is `npm run build` in
`client/`. The response change is verified live with `curl` in step 1; the
hide/show behavior in the running browser during the step-3 review.

## Notes for the AI

- `fa-chevron-down` must be verified against the FA 7.1 CDN stylesheet
  (grep `.fa-chevron-down{--fa:`; `fa-chevron-right` already verified in
  feature 4).
- Keep the one prepared-statement-per-query pattern in `server/src/
  index.js`; no router abstraction.
- The toggle row is a `<button>` (not `<h3>+icon`) so it is reachable by
  keyboard; `aria-expanded` (and `aria-controls` omitted intentionally -
  one region, no stable id required).
- Wording set unchanged for actions (server `error` text for 400s, `Save
  failed` for network failures, `Could not load tasks.` for initial-load
  failures).
- The label color is `--accent-positive` green (recorded decision: green
  reads as "done" and matches the TODAY label treatment).

## Open questions

None - group placement (below the unfinished list), ordering, count
format, zero-count hiding, and non-persistence are recorded as spec
decisions.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":6801,"specSha256":"bb65de554d6cc5147fef90778cbe488920e19431e6c6d756b32055ac32c4f000","branch":"refs/heads/feature/completed-tasks-hideshow-group","head":"bba09944e872ed039642344ec5e04196ca2f8bc5","baseRef":"refs/heads/master","baseCommit":"bba09944e872ed039642344ec5e04196ca2f8bc5","sourceTree":"b713d107dfdf2f0fcfb87995b948692e091b3dca","landing":"local-merge","absentOptional":[]} -->

## Findings

No findings recorded for this build (`findings.md` was at its canonical stub at completion).

## Independent review

None requested (not a sensitive-category change; no receipt exists).

## Try it now

1. Start the server (`cd server && npm start`) and open http://localhost:5173.
2. Add a task (e.g. `read a chapter`), press add, then tick it done: it leaves
   `TODAY` and a green `Completed (1)` row appears under the unfinished list,
   collapsed by default (`fa-chevron-right`).
3. Click that row: the chevron turns down and the done task appears, dateless
   when created today.
4. Tick the second row down later (or use the reminder SQLite rows such as
   `build daily dashboard`, dated `19 Oct`): expanding the group shows those
   older rows with their original date.
5. In today's entry, change one value (e.g. mood) and press `Save`: the
   `Sleep and mood` graph refetches on its own (watch the request to
   `/api/stats?month=2026-10` in DevTools Network right after the PUT), the
   lines/panel update without a page reload.
6. Untick a completed row: it returns to `TODAY` (created today) or to
   `Unfinished from earlier days` (older). Reload the page: the completed
   group is collapsed again (the choice is not persisted).
