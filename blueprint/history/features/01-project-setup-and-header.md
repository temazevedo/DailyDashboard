# Feature: Project setup and header

**From build-plan:** feature 1
**Build attempt:** 1
**Status:** verified (revisions 1-5: digital time, plain date, no dial, `|` separator, un-highlighted hours)
**Branch:** `feature/project-setup-and-header`

## Goal

Scaffold the two-part app (`client/` Vite + React, `server/` Express + SQLite)
and build the header: a normal datetime line - today's date as plain text -
above the digital clock in its 150px dial, per the updated plan.

## Design reference

- `blueprint/reference/design-ref.png` (copy of `design/design-ref.png`)
- Live reference header: https://codepen.io/mattjuggins/pen/WGRRYx
- Prototype artifact linked in `PLAN.md`. Build against these, not a guess.
- Revision 2 supersedes the circular-calendar part of the references: the
  header is now a plain date line plus the digital clock dial. They remain
  useful only for the dark color scheme and overall page look.

## In scope

- `client/` Vite + React skeleton (plain JavaScript, one CSS file) with dev
  server, build script, Vite proxy of `/api` to the Express server
- `server/` Express skeleton with `better-sqlite3`, single SQLite file
  auto-created on first start, both tables (`entries`, `tasks`) created on
  startup - no endpoints yet
- Font Awesome CDN stylesheet link in `client/index.html` and Roboto Mono from
  Google Fonts (loading only; no header icon use)
- Header (revision 5): a normal date line - "Wednesday, 19 October 2026",
  from `Intl.DateTimeFormat` (weekday long, 2-digit day, long month, year),
  `#9a9a9a`, 14px - then a `|` separator, then the digital time `HH:MM:SS`
  as inline text (hours and minutes `#CCC`, seconds `#AAA`, separators
  `#555`); no calendar rings, no SVG arcs, no rotation math, no dial circle
- Digital clock in the dial: `HH:MM:SS`
  ticking every second - hours `#FFF`, minutes
  `#CCC`, seconds `#AAA`, dimmed separators `#555` - on the unchanged
  150px `#202020` dial with its shadow. Roboto Mono.
- Dark theme tokens from the plan (page `#292929`, cards `#202020`; the old
  ring accent colors are gone from the plan)
- README and `AGENTS.md` Commands updated with the real dev/build commands

## Out of scope

- Weather card, daily entry form, task manager, monthly graph (features 2-5)
- Any API endpoint; the server ships with no routes beyond Express defaults
- Any icon usage (Font Awesome link only, no header icons)
- Mobile or responsive handling; desktop, fixed pixel sizes only
- Any feature or component not in the plan

## Build loop

Build one small step at a time. `workflow.stepReview` is `feature`: one
review packet after all steps, `checkpointCommits` disabled. `/complete`
makes the final feature commit.

## Build steps

- [x] **Step 1 - Scaffold client and server** - create `client/` (Vite +
  React, plain JS, npm) and `server/` (Express + `better-sqlite3`, DB file
  auto-created on first start with the plan's two tables); wire the Vite
  `/api` proxy; update `README.md` and the `AGENTS.md` Commands section with
  the real commands. *Done when:* both dev servers start and the browser
  shows the empty React page; `npm run build` in `client/` passes; the
  SQLite file appears on server start with both tables.
- [x] **Step 2 - Center dial with digital clock** - 150px dial (`#202020`,
  shadow) showing `HH:MM:SS` in the plan's hand colors (`#FFF`, `#CCC`,
  `#AAA`, separators `#555`), Roboto Mono, updated every second by the
  shared `setInterval` (`useNow`). *Done when:* the browser shows the
  digital time in the dial and it visibly advances each second.
- [x] **Step 3 - Date and clock on one row** - centered single row: today's
  date as plain text ("Wednesday, 19 October 2026") via `Intl.DateTimeFormat`
  (`#9a9a9a`, 14px), immediately followed by the digital time `HH:MM:SS` as
  inline text (hours `#FFF`, minutes `#CCC`, seconds `#AAA`, separators
  `#555`), on `#292929` with Roboto Mono, no dial circle. *Done when:* the
  browser shows the date and the ticking time side by side, and no dial or
  ring markup remains anywhere in `client/src`.

## Files / areas

- `client/package.json`, `client/vite.config.js`, `client/index.html`,
  `client/src/main.jsx`, `client/src/App.jsx`
- `client/src/components/Header.jsx`, `client/src/components/ClockDial.jsx`
  (deleted: `DateRing.jsx` in revision 2, `ClockDial.jsx` in revision 4)
- `client/src/styles.css`
- `server/package.json`, `server/src/index.js`, `server/src/db.js`
- `README.md`, `AGENTS.md` (Commands section)

## Data / contracts

- No API endpoints in this feature. Contracts established for later features:
- SQLite file auto-created on first server start; exact schema locked by the
  plan - `entries(date TEXT PRIMARY KEY YYYY-MM-DD, weight_kg REAL NULL,
  mood INTEGER NULL, sleep INTEGER NULL)` and `tasks(id INTEGER PRIMARY KEY
  AUTOINCREMENT, text TEXT NOT NULL, date TEXT NOT NULL YYYY-MM-DD, done
  INTEGER NOT NULL DEFAULT 0)`. Later features must preserve this shape.
- In development, all client requests to `/api` are proxied to the Express
  server (port recorded in the configs); keep this proxy when the API
  features land.
- The header renders only static date data (from `Intl.DateTimeFormat` and
  `Date`), no user-generated text, so no rendering safety rule is needed yet.

## Testing

- No test runner is installed (no test command in `AGENTS.md`), so there is
  no test gate for this feature. Verification is browser evidence plus the
  client build command.
- No Browser tests command is declared; verify with the running dev server
  and screenshots against `blueprint/reference/design-ref.png`.
- Verify fallback for each step: Vite dev server at the configured port for
  visual steps; `npm run build` in `client/` as the automated gate; server
  start check for the DB auto-creation.

## Notes for the AI

- Plan law (follows strictly): no emojis anywhere; Font Awesome icons only via
  the CDN stylesheet and only where the plan lists them (none in this
  feature); desktop only, fixed pixel sizes, no media queries; nothing beyond
  the plan.
- Header is plain markup: a date `<p>` and an inline time `<p>`. No dial, SVG
  rings, or arc math (removed with revision 2, dial removed in revision 4;
  do not reintroduce them).
- Use built-in `Date` and `Intl.DateTimeFormat`; no date library. No
  state-management library; the tick lives in `useNow` and drives the header.
- Sensitive DB values: NULL, never 0, for empty optional fields (applies from
  feature 3 onward, but keep schema behavior neutral now).
- State assumptions in one line while implementing (e.g. npm as package
  manager, proxy target port) and keep them consistent in configs and README.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":6667,"specSha256":"6b0b2970dfa930b77516c21598d34affbd75c30226dee65bd8eac2d174e413b9","branch":"refs/heads/feature/project-setup-and-header","head":"57c811b6cee13a35cc4507b5e243ecb36161c70c","baseRef":"refs/heads/master","baseCommit":"57c811b6cee13a35cc4507b5e243ecb36161c70c","sourceTree":"9b73e42bc5869afec0d164831201ffc20d8e5807","landing":"local-merge","absentOptional":[]} -->
## Try it now```bashcd server && npm start      # terminal 1cd client && npm run dev    # terminal 2, open http://localhost:5173```Expected: one dark row - `Wednesday, 19 October 2026 | 14:23:47` - the date in`#9a9a9a`, a `|` separator, time digits `#CCC`/`#AAA` with `#555` colons,ticking once per second. No cards, rings, or dial.