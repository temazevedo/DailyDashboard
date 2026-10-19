# Feature: Task manager

**From build-plan:** feature 5
**Build attempt:** 1
**Branch:** feature/task-manager
**Status:** verified (all steps built; task endpoint suite observed over live HTTP, including the empty-row-response repair; build passes)

## Goal

Add the last card: a task manager for today's tasks (add, toggle done,
delete) plus an "unfinished from earlier days" list, wired to the four task
endpoints.

## In scope

- Server endpoints in `server/src/index.js` (Express + `better-sqlite3`;
  the `tasks` schema already exists in `server/src/db.js`):
  `GET /api/tasks?date=`, `POST /api/tasks`, `PATCH /api/tasks/:id`,
  `DELETE /api/tasks/:id`.
- `client/src/components/TaskCard.jsx`: add input ("Add a task for today"),
  square `fa-plus` button, `TODAY` list, `UNFINISHED FROM EARLIER DAYS`
  list - per `design/design-ref.png`.
- Ticking done, deleting, and adding re-fetch both lists from the server
  (no optimistic local mirror to reconcile).
- Shared today-key helper `client/src/todayKey.js` (the entry form uses the
  same helper after this feature; local timezone `YYYY-MM-DD`).
- Card styles in `client/src/styles.css` reusing existing tokens.

## Out of scope

- No other endpoints, no pagination, no edit-in-place of task text.
- Tasks that were created before today and are done: they appear nowhere
  (the unfinished list is a `done = 0` query, per the plan).
- No expiry: tasks stay until completed or deleted.
- No state beyond the two fetched lists and the input text.

## Build loop

Per `blueprint/config.json` (`stepReview: "feature"`,
`checkpointCommits: "disabled"`): build all steps on the feature branch,
then one checkpoint review pause before `/complete`. No intermediate
commits.

## Build steps

- [x] 1. Server: the four task endpoints. In `server/src/index.js`:
    - Date params/query validated as `YYYY-MM-DD` regex; otherwise
      `400 { "error": "Invalid date" }` (same as the entries endpoints).
    - `GET /api/tasks?date=` -> `200 { today: [...], unfinished: [...] }`.
      `today`: all tasks with `date = ` that day, `id ASC` (done ones
      included). `unfinished`: `date < ` that day `AND done = 0`,
      `date DESC` (newest first, like the reference). Rows serialize as
      `{ id, text, date, done }` with `done` the raw `0|1` integer.
    - `POST /api/tasks` body `{ text, date }`: text must be a non-empty
      string after trim (stored trimmed; whitespace-only is
      `400 {"error":"Task text must not be empty"}`); date validates as
      above; extra keys ignored. Respond `200` with the created row
      `{ id, text, date, done: 0 }`.
    - `PATCH /api/tasks/:id` -> `UPDATE ... SET done = 1 - done`;
      `200` with the updated row; unknown id -> `404 {"error":"Task not
      found"}`.
    - `DELETE /api/tasks/:id` -> `200 {"ok":true}`; unknown id ->
      `404 {"error":"Task not found"}`.
    **Done when:** live `curl` suite passes: GET returns both lists for a
    known date; POST adds (row echoed, `done: 0`); whitespace-only text
    and `x` date both 400; PATCH toggles `0 -> 1 -> 0`; PATCH/DELETE on
    id 999999 give `404`; DELETE removes the row (repeat GET confirms).
- [x] 2. Client: `TaskCard.jsx` + shared today helper.
    - New `client/src/todayKey.js`: the `YYYY-MM-DD` local-time helper,
      exported; `EntryForm.jsx` switches to import it (no duplicate).
    - State: `today` list, `unfinished` list, `text` input value, `error`
      status (null or message), `failed` (load failure boolean).
    - On mount: `GET /api/tasks?date=<today>`; on failure the card shows
      `Could not load tasks.` and no lists.
    - Add: form submit (Enter or the `+` button) `POST`s
      `{ text, date: today }`; then both lists are refetched; the input
      clears. Server 400 shows the server `error` text; network failure
      shows `Save failed`.
    - Toggle: click the circle `PATCH`es `/api/tasks/<id>`; refetch both
      lists. Delete: click the trash `DELETE`s; refetch both lists.
      Network failures for both show `Save failed`.
    - TODAY rows: circle button (`fa-check` only when done; green) +
      task text (`#ccc`; done rows struck through, muted) + `fa-trash-can`
      delete button on the right. Unfinished rows: same circle and trash,
      plus the original date as `16 Oct` style
      (`Intl.DateTimeFormat`, day numeric + short month) before the trash.
    **Done when:** the running dev client lets you add a task (it appears
    under TODAY), tick it (strikes through), and delete it (row
    disappears), all reflected in the DB (a GET shows the same lists).
- [x] 3. Styles and wiring. Render `<TaskCard />` in `App.jsx` between
    `EntryForm` and `GraphCard` (the on-page card order per the plan:
    entry form - task manager - graph). `styles.css`: `.tasks` block,
    `.task-label` (12px uppercase letter-spaced, green for TODAY via
    `--accent-positive`, red `#f84c5d` for the unfinished label, reusing
    the mood accent color), `.task-input` (full width dark bordered, like
    the entry inputs), `.task-add-button` (square like the graph chevron
    buttons), `.task-row` (flex row with thin separator), `.task-check`
    circle button (green when done), `.task-text` (+ `.task-text-done`
    struck / muted), `.task-date`, `.task-delete` (red). Fixed desktop
    sizes. Run `npm run build` in `client/`. **Done when:** the build
    passes and the page shows all five cards in order header - weather -
    entry form - tasks - graph.

## Files / areas

- `server/src/index.js` - the four task endpoints (only server file).
- `client/src/todayKey.js` (new, shared helper).
- `client/src/components/TaskCard.jsx` (new).
- `client/src/components/EntryForm.jsx` - import the shared helper.
- `client/src/App.jsx` - render `TaskCard` between `EntryForm` and
  `GraphCard`.
- `client/src/styles.css` - task card styles.

## Data / contracts

- `tasks` (existing, unchanged): `id` INTEGER PK AUTOINCREMENT, `text`
  TEXT NOT NULL, `date` TEXT NOT NULL (`YYYY-MM-DD` creation date), `done`
  INTEGER NOT NULL DEFAULT 0.
- `GET /api/tasks?date=YYYY-MM-DD` -> `200 { today: [{ id, text, date,
  done }], unfinished: [...] }` (orderings as in step 1); malformed date
  -> `400 {"error":"Invalid date"}`.
- `POST /api/tasks` `{ text, date }` -> `200` created row; trimmed-empty
  text -> `400 {"error":"Task text must not be empty"}`; bad date ->
  `400 {"error":"Invalid date"}`; unknown keys ignored.
- `PATCH /api/tasks/:id` -> `200` updated row (toggled `done`);
  `DELETE /api/tasks/:id` -> `200 {"ok":true}`; unknown id -> `404
  {"error":"Task not found"}`.
- Tasks are stored once with their creation date; nothing copies between
  days; the unfinished list is always a server query (`date < today` AND
  `done = 0`, newest first).
- Client mutations always go through POST/PATCH/DELETE then refetch GET.

## Testing

No test runner installed; the automated gate is `npm run build` in
`client/`. Endpoint behavior is verified live with `curl` in step 1; the
add/tick/delete flow is verified in the running browser during the step-3
review. No browser or unit test commands exist.

## Notes for the AI

- Keep the four Express handlers inline next to the existing endpoints
  (still one file, no router abstraction); reuse the task prepared
  statements where natural.
- Express 5: `req.params.id` is a string; cast to number before the SQL
  statements (`Number.isInteger` check; a non-numeric id is a 404).
- FA glyph names verified in the FA 7.1 CDN stylesheet: `fa-plus`,
  `fa-check`, `fa-trash-can` all present.
- The unfinished-label red and the trash red reuse the mood accent
  `#f84c5d` (recorded decision; keeps the palette small, matches the
  reference look).
- The two lists are independent queries from one GET; keep the DONE-era
  older tasks invisible (no extra section).
- Error wording per card region: `Could not load tasks.` for the initial
  GET; server validation text for 400s; `Save failed` for network
  failures on any mutation.

## Open questions

None - POST/PATCH/DELETE response shapes (row echo, `{ok:true}`, 404 for
unknown ids), list ordering, and the wording set are recorded as spec
decisions rather than blocking choices.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":8190,"specSha256":"a7a39930df02fa5788ba827c7d75ee53192640079bfeeb31d50412b77d088463","branch":"refs/heads/feature/task-manager","head":"b9a818c54d1e17726527eb91fffbbc9d3fb944c1","baseRef":"refs/heads/master","baseCommit":"b9a818c54d1e17726527eb91fffbbc9d3fb944c1","sourceTree":"f2628fbf4f0ff9d12badd2b5122c6a8ae7283db8","landing":"local-merge","absentOptional":[]} -->


## Try it now

```bash
cd server && npm start      # terminal 1
cd client && npm run dev    # terminal 2, open http://localhost:5173
```

- Add: type in "Add a task for today" and press Enter or the + button; the
  row appears under TODAY; pressing Enter with blank text shows
  "Task text must not be empty".
- Tick: the circle turns green with a check; text strikes through; clicking
  again unticks.
- Delete: the trash icon removes the row (gone after reload too).
- Unfinished: older undone tasks appear under the red UNFINISHED FROM
  EARLIER DAYS label with their original date; ticking one removes it from
  that list (and it does not appear under TODAY).
- Server down (after load): all card actions show "Save failed"; a reload
  of the card area shows "Could not load tasks."
