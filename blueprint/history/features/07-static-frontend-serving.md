# Feature: Static frontend serving for deployment

**Status:** verified

**From build-plan:** feature 7
**Build attempt:** 1
**Branch:** feature/static-frontend-serving

## Goal

One Node process for daily use: after `npm run build` in `client/`, the
Express server (`server/src/index.js`, port 3001) serves the built dashboard
statically alongside the API - ready to run on the home server with no
second web server, no CORS, and an unchanged development flow.

## In scope

- `server/src/index.js`: static serving of `client/dist` when it exists
  (auto-detect at startup), plus an index.html fallback for unknown
  non-`/api` GET paths. All seven `/api` endpoints keep their contracts and
  precedence over the fallback.
- `blueprint/context/ai-interaction.md` untouched; `AGENTS.md` Commands gets
  its "Production server" line corrected (currently says none exists).
- Plan docs already synced (Serving section + build order item 7).

## Out of scope

- No deployment tooling: no Docker, systemd unit, TLS/reverse proxy
  (`/release` handles config if wanted later); the home-server flow is
  npm install + build + npm start, documented in the archive.
- No `dist` wiring into Git (`client/dist` stays untracked, ignore rule
  check only).
- No caching strategy beyond `express.static` defaults; no compression,
  no new dependencies (`express.static` is built in).
- No changes to any API contract, client card, or the dev proxy behavior.

## Build steps

- [x] 1. Server static wiring. In `server/src/index.js`:
    - Compute the dist root from the module location
      (`server/../client/dist`, same pattern as `db.js`'s data dir) and
      check `fs.existsSync(<root>/index.html)`.
    - Present: `express.static(root)` then a final GET catch-all for paths
      not starting with `/api` that serves the same `index.html` (Express 5:
      use a regex route, not `'*'`); verified API routes keep precedence.
    - Absent: no static route, server identical to today (API-only).
    **Done when:** live checks after `npm run build` in `client/`: `GET /`
    returns the built index.html, `/icons/wi-day-sunny.svg` and a hashed
    asset from dist load, `GET /api/stats?month=2026-10` still answers 200,
    `GET /nope` falls back to index.html (html content-type), and the
    favicon-style 404/400 `/api` guards are unchanged. Temporarily confirm
    the absent-build path by pointing static-root detection at a fake
    missing directory only via reasoning/inspection (no second server
    needed), keep the check out of live evidence.
- [x] 2. Docs sync. Update the `AGENTS.md` Commands "Production server" line
    to describe: build in `client/`, then `npm start` in `server/` serves
    `client/dist` + `/api` on port 3001; no build = API-only. **Done when:**
    the Commands section matches the shipped behavior.
- [x] 3. Build gate. `npm run build` in `client/` (the project's automated
    gate). **Done when:** build green; the refreshed `client/dist` is what
    the running server now serves (step-1 curl checks already did).

## Files / areas

- `server/src/index.js` - static wiring only.
- `AGENTS.md` - one Commands line.
- `client/dist/` - generated output, stays untracked.

## Data / contracts

- No API changes; the seven endpoints and error wordings stay identical.
- Static files: no `/api` collision; the single app has no client routes, so
  the fallback exists only for refreshes/mistyped paths.
- Dev unchanged: Vite 5173 + `/api` proxy; the served page and API become
  same-origin without any client change.

## Testing

Automated gate: `npm run build` in `client/`. Step-1 runtime behavior is
verified live with `curl` after a fresh build.

## Notes for the AI

- Express 5: `'*'` as a path string no longer does what Express 4 did; use
  an explicit regex (e.g. `/^\/(?!api\/?)/`) for the catch-all GET.
- Keep `express.static` before the fallback and after nothing else touches
  GET mapping; the file check runs once at startup (no per-request existsSync).
- The dist root must be derived from the compiled-file location
  (`import.meta.url`), never the process CWD, so `npm start` works from any
  working directory.
- Deployment for the home server (documented, not automated): clone/copy the
  repo, `npm install` in both dirs, `npm run build` in `client/`,
  `npm start` in `server/`, open `http://<home-host>:3001`. Data lives in
  `server/data/dashboard.db`.

## Open questions

None - auto-detect and the index fallback are recorded decisions from this
session.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4510,"specSha256":"63d19c1fdb389a248f11405e8c419382ae584096ef69f6d16e4f846e1b767734","branch":"refs/heads/feature/static-frontend-serving","head":"7876f40114c7a338cee9c56530dac272546f7136","baseRef":"refs/heads/master","baseCommit":"7876f40114c7a338cee9c56530dac272546f7136","sourceTree":"bcca43c8755c20b4c14e46a45259255701f6468d","landing":"local-merge","absentOptional":[]} -->

## Findings

Three findings carried forward from the pre-deployment audit (found earlier by
`/audit` scope: full; repaired and closed on `master 7876f40` before this
feature started; kept here because archives record every resolved entry with
the work item that completed it). Prefix `7/` per the completion contract;
their repair ship is `blueprint/history/fixes/audit-findings-repair.md`.

### 7/F-01 [P2] closed - DATE_PATTERN accepts non-calendar dates; such rows become silently invisible

Repaired in `fix/audit-findings-repair`; closed by `/audit` 2026-10-20
(scope: full, target `master 7876f40`). Evidence: 12/12 curl rejections,
valid-path regression green. Originally found in `server/src/index.js:9`.

### 7/F-02 [P3] closed - Graph blinks to "Loading..." on every auto-refetch after Save

Repaired in `fix/audit-findings-repair` (data month marker); closed by
`/audit` 2026-10-20. Originally found at `client/src/components/GraphCard.jsx:65`.

### 7/F-03 [P3] closed - Four hand-rolled fetch/error shapes across cards

Repaired by `client/src/fetchJson.js`; closed by `/audit` 2026-10-20.
Originally found across the four card components.

## Independent review

None requested (not a sensitive-category change; no receipt exists).

## Try it now

Home-server deployment, end to end:

1. On the home server: copy or clone the repo (including `server/src`, client
   sources, `blueprint/` if you keep them), then `npm install` in `server/`
   and in `client/`.
2. Build once: `npm run build` in `client/` (creates `client/dist/`).
3. Start the service: `npm start` in `server/` - port 3001 now serves both
   the dashboard and the API (`http://<home-host>:3001`).
4. Same origin means the browser hits `/api` directly - no proxy, no CORS.
   The SQLite data lives in `server/data/dashboard.db` (created on first
   start, empty on a fresh box).
5. Behavior checks: refresh a deep link like `/tasks` to land back on the
   dashboard; the clock/entry/tasks/graph cards work without the dev proxy.
6. Without a build, the same `npm start` is API-only again; development
   stays Vite on 5173 + `/api` proxy.
