# Coding Standards

> Conventions for this project. Stack and hard rules come from `PLAN.md`; the
> plan's Guidelines section overrides anything below.

## Stack facts

- React with Vite, plain JavaScript. No TypeScript, no jQuery, no SCSS, no UI
  library, no state management library.
- Express backend with SQLite via `better-sqlite3` (single file, created on
  first server start).
- One plain CSS stylesheet is fine. No Tailwind.
- Recharts for graphs. Built-in `Date` and `Intl.DateTimeFormat` for dates; no
  date library.

## Hard project rules (from PLAN.md)

- No emojis anywhere: UI, code, comments, README.
- Font Awesome icons only, loaded via CDN stylesheet in `index.html`, used only
  where the plan lists them.
- Desktop only: fixed pixel sizes, no media queries, no responsive handling.
- No features beyond the plan. If a change is not listed in `PLAN.md`, ask.
- Keep things simple; do not over-abstract.

## JavaScript

- Plain ES modules; no TypeScript.
- `const` by default, `let` only when reassignment is needed.
- Avoid `var`.
- Prefer native browser APIs (`fetch`, `Date`, `Intl`) over dependencies.

## React

- Functional components with hooks only.
- Keep components focused; one card = one component under the page layout order
  from the plan (rings, weather, entry form, tasks, graph).
- No state management library; component-level `useState`/`useEffect` is the
  intended pattern for this scale.

## Project structure

```
client/   Vite + React (components per card, one CSS file)
server/   Express app, better-sqlite3 database access, route handlers
```

- Vite dev server proxies `/api` to the Express server in development.
- Weather calls go from the browser straight to Open-Meteo; the server has no
  weather endpoint.

## API and data

- JSON REST endpoints exactly as defined in `PLAN.md` (seven endpoints; do not
  invent more without asking).
- Server validates required input: weight a positive number, mood and sleep
  integers 0-10 or NULL, task text non-empty.
- Empty optional fields are stored as NULL, never coerced to 0.
- Database statements via prepared statements; keep schema exactly as the
  plan's two tables (`entries`, `tasks`).

## Styling

- One plain CSS file (or a small set), dark theme tokens from `PLAN.md`
  (page `#292929`, cards `#202020`, accent colors as listed).
- Roboto Mono from Google Fonts.
- No inline styles for anything shared; component-scoped classes.

## Error handling

- Return proper HTTP status codes from Express routes.
- Fetch failures show short fallback text in the UI (weather) rather than
  crashing the card.

## Testing

The blueprint installs no test runner; testing is opt-in at the project level.
Adding unit testing is an explicit setup task the AI can do through the normal
workflow, either as a build-plan item or with `/tests`. The setup should choose
the stack-native runner, wire the scripts or commands, add a small example test,
and update the Commands section of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. `/ci` owns Verify and CI setup. `/tests`
adds the real test command to Verify when it already exists, but never creates
CI only because testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the
evidence it already uses (run it, a screenshot, the build). Adding the runner is
itself a deliberate step, never a silent mid-step install.

- **What to test (the scope rule):** pure logic where a wrong answer is
  possible - server validation, the stats/month math, average computation.
- **What not to test:** the ring-clock rendering and other UI; verify with a
  screenshot and the build instead.

## Browser Verification

Browser automation is separately opt-in through `/tests browser`. Until a
browser harness is declared, verify UI work with the running dev server,
screenshots, or manual evidence. Browser tests are not part of the default
Verify command or CI unless the user separately chooses that gate.

## Code Quality

- No commented-out code.
- No unused imports or variables.
- Keep functions under 50 lines when possible.

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the
  code.
- No banner/header blocks or step-by-step narration of obvious code.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. Use a hyphen for `term - description` separators; rephrase
  prose with commas, parentheses, or a colon.
- Avoid en dashes and the ellipsis character.
