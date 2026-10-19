# Feature: Entry form wired to the backend

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/entry-form-wired-to-the-backend
**Status:** verified (all steps built; endpoint contract suite observed over live HTTP; build passes)

## Goal

Add the third card to the dashboard: a daily entry form (weight, mood, sleep)
that loads today's entry on mount and saves it with one button via the first
two `/api` endpoints on the Express server.

## In scope

- Server endpoints `GET /api/entries/:date` and `PUT /api/entries/:date`
  (Express + `better-sqlite3`, both in existing `server/src/index.js`; the
  schema for `entries` already exists in `server/src/db.js`).
- `client/src/components/EntryForm.jsx`: three optional numeric fields
  (weight kg decimal, mood 0-10, sleep 0-10), one Save button, styled per
  `design/design-ref.png`: small uppercase `TODAY'S ENTRY` section title,
  Font Awesome label icons (`fa-weight-scale`, `fa-smile`, `fa-moon` - all
  verified in FA 7.1), three equal-width fields with bordered inputs, green
  Save button aligned right.
- Loads today's entry on mount and prefills the fields.
- One button upserts today's row; empty fields are saved as NULL, never 0.
- Inline feedback states: saved confirmation, validation error, save-failure
  error.
- Card styles in `client/src/styles.css` reusing the existing tokens plus a
  new `--accent-positive: #3fd463` (green accent from `design-ref.png`).

## Out of scope

- Task manager card (feature 4). The server handles only the two entry
  endpoints this feature adds.
- Editing entries for any day other than today; no date picker on the form.
- No polling or auto-save: a save happens only when the button is pressed.
- No new dependencies; browser-native `fetch` and the Font Awesome CDN
  stylesheet already in `index.html` (label icons only; the plan lists them).

## Build loop

Per `blueprint/config.json` (`stepReview: "feature"`,
`checkpointCommits: "disabled"`): build all small steps on
`feature/entry-form-wired-to-the-backend`, a checkpoint review pause follows
the last step before `/complete`. No intermediate commits except the final
one at `/complete`.

## Build steps

- [x] 1. Server: add the two entry endpoints. In `server/src/index.js`, add:
    - `GET /api/entries/:date` - `:date` must match `YYYY-MM-DD` (regex check;
      otherwise `400 { "error": "Invalid date" }`). Existing row returns `200`
      with `{ date, weight_kg, mood, sleep }`; no row returns `200` with `{}`.
    - `PUT /api/entries/:date` - same date check. Body is JSON
      `{ weight_kg, mood, sleep }` (missing fields read as null). Validation
      (`400 { "error": <message> }`): `weight_kg` must be a positive finite
      number or null; `mood` and `sleep` must be integers 0-10 or null.
      Unknown body keys are ignored; nothing else is stored.
    - Upsert with one prepared statement
      (`INSERT ... ON CONFLICT(date) DO UPDATE SET ...`). Returns `200` with
      the stored row `{ date, weight_kg, mood, sleep }`.
      **Done when:** with the server running (`cd server && npm start`),
      `curl -i localhost:3001/api/entries/2026-10-19` gives `200 {}`;
      `curl -i -X PUT .../entries/2026-10-19 -H 'Content-Type: application/json' -d '{"weight_kg":74.5,"mood":7,"sleep":8}'`
      gives `200` echoing the stored row; a repeat GET returns that row;
      `weight_kg: 0`, `weight_kg: -1`, `mood: 11`, `mood: 7.5`, and an
      invalid date each give `400 {"error":...}`.
- [x] 2. Client: `EntryForm.jsx`. Renders `<section className="card">` with a
    `TODAY'S ENTRY` title (`<h2 className="entry-title">`, uppercase via CSS),
    a row of three labelled equal-width fields - `Weight (kg)`
    (`type="number"`, `step="0.1"`, `fa-weight-scale` icon), `Mood (0-10)`
    (`type="number"`, `step="1"`, `fa-smile` icon), `Sleep (0-10)`
    (`type="number"`, `step="1"`, `fa-moon` icon; all icons `fa-solid`,
    `aria-hidden`) - a green (`.entry-button`) `Save` button aligned right,
    and the status line below. On mount, `fetch`
    `GET /api/entries/<today>` and prefill the fields (empty when the row is
    missing or a field is null; network failure shows the error line and no
    fields). Today's date key is the local timezone date formatted
    `YYYY-MM-DD` from `Date`/`Intl` (no date library). Pressing Save builds
    `{ weight_kg, mood, sleep }` (empty field -> `null`, numbers otherwise)
    and `fetch`es `PUT /api/entries/<today>`; on `200` show `Saved.` in the
    status line; on a non-2xx response show the server's `error` text; on a
    network failure show `Save failed`. **Done when:** the card renders under
    the weather card in a running dev client and a button press persists a
    row (observable: reload the page and the saved values are prefilled).
- [x] 3. Styles and wiring. Render `<EntryForm />` in `App.jsx` between
    `WeatherCard` and the (later) task card. `styles.css`: `.entry` column,
    `.entry-row` (three equal fields via `flex: 1 1 0`), `.entry-title`
    (12px uppercase letter-spaced `--color-label`), `.entry-label` (`#ccc`,
    14px, icon inside), `.entry-input` (full width, `--color-page` background,
    `--color-label` border, radius 4px, `#ccc` text), `.entry-actions` with
    `.entry-button` (`--accent-positive` green, radius 4px, white text, right
    aligned), `.entry-status` / `.entry-error` (secondary 14px). Fixed
    desktop sizes, no media queries. Run `npm run build` in `client/`.
    **Done when:** the build passes and the page shows the three cards in
    order header - weather - entry form, with the entry card matching the
    `TODAY'S ENTRY` look of `design-ref.png`.

## Files / areas

- `server/src/index.js` - add the two entry endpoints (only server file
  touched; `server/src/db.js` untouched, schema already matches).
- `client/src/components/EntryForm.jsx` (new).
- `client/src/App.jsx` - render `EntryForm`.
- `client/src/styles.css` - entry card styles.

## Data / contracts

- `entries` table (existing, unchanged): `date` TEXT PK `YYYY-MM-DD`,
  `weight_kg` REAL NULL, `mood` INTEGER NULL 0-10, `sleep` INTEGER NULL 0-10.
- `GET /api/entries/:date` -> `200 { date, weight_kg, mood, sleep }` or
  `200 {}` when absent; `400 {"error":"Invalid date"}` on a malformed date.
- `PUT /api/entries/:date` with JSON body `{ weight_kg, mood, sleep }`
  (numbers or null) -> `200` with the stored row; `400 {"error":<message>}`
  for malformed date, non-positive weight, or mood/sleep outside 0-10 or
  non-integer. Empty/missing optional fields always store NULL, never 0.
- Client sends its payload only via these endpoints through the Vite proxy
  (`/api` -> `localhost:3001`).

## Testing

No test runner installed; the automated gate is `npm run build` in `client/`.
Server behavior is verified live with `curl` in step 1; save/prefill behavior
is verified in the running browser in step 3 review. No browser or unit test
commands exist.

## Notes for the AI

- Keep Express handlers inline in `server/src/index.js` (07-endpoint app at
  most; no router abstraction needed).
- Express 5: `req.params.date`, `req.body`; `express.json()` is already
  mounted.
- The middle card order from the plan: header - weather - entry form.
- Prefill date: local-timezone `YYYY-MM-DD` (one helper line in the
  component or a tiny shared util if `App` also needs it - do not create a
  date-library dependency).
- Status and error lines replace each other in one status region below the
  inputs; keep the exact wording from step 2.
- Green accent token `--accent-positive: #3fd463` was sampled from
  `design/design-ref.png`; the three icon names were verified against the
  Font Awesome 7.1 CDN stylesheet (`.fa-name{--fa:...}` markers).

## Open questions

None - the upsert response shape (`200` with the stored row) and the inline
status wording are recorded as spec decisions rather than blocking choices.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7898,"specSha256":"9ede994d4189b57f499b98e9db29a84e676cc6d65270d88cdc977dd3e78b534c","branch":"refs/heads/feature/entry-form-wired-to-the-backend","head":"9d1fa46d4efe7068001ccc63fcaa4e10f838a15a","baseRef":"refs/heads/master","baseCommit":"9d1fa46d4efe7068001ccc63fcaa4e10f838a15a","sourceTree":"3ef73a3f2681f657147d31acabffe60387043d11","landing":"local-merge","absentOptional":[]} -->


## Try it now

```bash
cd server && npm start      # terminal 1
cd client && npm run dev    # terminal 2, open http://localhost:5173
```

- Normal: the `TODAY'S ENTRY` card sits under the weather card with three
  equal fields, icons in the labels, and the green Save button on the right.
- Save: enter values (e.g. `72.4` / `7` / `8`), press Save, see `Saved.`;
  reload the page and the values are prefilled from the backend.
- Clear everything and Save: the row stores NULLs (never 0), so the reload
  shows empty fields.
- Bad input: weight `0` shows "Weight must be a positive number"; mood `11`
  shows "Mood must be an integer from 0 to 10".
- Server down: the card still renders; saving shows `Save failed`, loading
  shows `Could not load today's entry.`
