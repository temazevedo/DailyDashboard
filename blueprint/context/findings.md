# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] fixed - DATE_PATTERN accepts non-calendar dates; such rows become silently invisible

**File:** server/src/index.js:9 (used at entries :47-67, tasks :128-152)
**Found:** 2026-10-20 by /audit (scope: full; lens: security/quality)
**Why it matters:** `^\d{4}-\d{2}-\d{2}$` lets `2026-99-99` into PUT
`/api/entries/:date` and POST `/api/tasks`. A row saved with such a date is
never returned by `/api/stats` (month-bound TEXT comparison), `today`, or
`unfinished` - the data persists but disappears from every query with no
error. The `/api/stats` month regex is already strict; the day part is the
gap.
**Suggested fix:** after the pattern match, reject non-calendar dates (e.g.
`Date.parse(...)` NaN check on `YYYY-MM-DD` or day-range check per month) for
entries PUT and tasks POST; 400 with the existing `Invalid date` wording.
**Resolution:**
Repaired on `fix/audit-findings-repair` (2026-10-20); repair verified: F-01 by the 12-case curl rejection suite + valid-path regression (all green, cleanup verified), F-02/F-03 by the client build and code-level wording check. A later /audit pass re-reviews the repaired code.

### F-02 [P3] fixed - Graph blinks to "Loading..." on every auto-refetch after Save

**File:** client/src/components/GraphCard.jsx:65 (sets `data(null)` at the
start of the fetch effect; fires after each entry save since feature 6)
**Found:** 2026-10-20 by /audit (scope: full; lens: performance/quality)
**Why it matters:** the feature-6 save-trigger refetch clears the chart and
averages before redrawing, so every Save produces a one-beat blank/loading
flash in the graph card. Cosmetic, but user-visible on every save.
**Suggested fix:** keep the previous month's data rendered while refetching
(and only clear on month change or first load); needs one extra piece of
state (e.g. a `refetching` flag), which is outside the plan's recorded
"month-only" graph state - decide whether the polish justifies it.
**Resolution:**
Repaired on `fix/audit-findings-repair` (2026-10-20); repair verified: F-01 by the 12-case curl rejection suite + valid-path regression (all green, cleanup verified), F-02/F-03 by the client build and code-level wording check. A later /audit pass re-reviews the repaired code.

### F-03 [P3] fixed - Four hand-rolled fetch/error shapes across cards

**File:** client/src/components/TaskCard.jsx:6-24 (request helper);
EntryForm.jsx:24-74; GraphCard.jsx:63-91; WeatherCard.jsx:35-81
**Found:** 2026-10-20 by /audit (scope: full; lens: quality)
**Why it matters:** each card builds its own fetch + error-text mapping with
slightly different wording and shapes. Per-card status wording is a recorded
spec contract, but the transport/error plumbing itself is quadruplicated
logic with drift risk (e.g. one missing `.catch(() => null)` variant).
**Suggested fix:** optional small refactor: one shared client-side
`fetchJson` helper (status ok/!ok, JSON error extraction, network -> custom
Error) living next to `todayKey.js`, with per-card wording kept at the call
site. Skip if the wording differences make it awkward; then relax instead of
extracting.
**Resolution:**
Repaired on `fix/audit-findings-repair` (2026-10-20); repair verified: F-01 by the 12-case curl rejection suite + valid-path regression (all green, cleanup verified), F-02/F-03 by the client build and code-level wording check. A later /audit pass re-reviews the repaired code.
