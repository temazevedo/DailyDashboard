# Feature: Weather card

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/weather-card
**Date:** 2026-10-19
**Status:** verified (all steps built; repair: weather icon replaced with Weather Icons SVGs vendored from Open-Meteo's website, day/night variants, Font Awesome kept for the rest of the app)

## Goal

Add the second card in the page column: current weather from Open-Meteo.
Location comes from browser geolocation; if that fails or is denied, a fixed
fallback city constant is used instead. The card shows the current
temperature in `#FFCC00`, the condition as text, and a Font Awesome icon
chosen from the Open-Meteo weather code, or a short error message if the
weather request fails.

## Design reference

Dark card look from the plan's Visual style section (cards `#202020`, shadow
`0 2px 2px #000`, Roboto Mono). `blueprint/reference/design-ref.png` is a
color-scheme reference only.

## In scope

- A new `WeatherCard` component rendered in `App.jsx` directly under the
  `Header`, as the first card in the column.
- Location resolution: `navigator.geolocation.getCurrentPosition`; any
  failure (denied, timeout, API unavailable) falls back to the constant.
- One Open-Meteo request per page load for current weather
  (`temperature_2m` + `weather_code`); no auto-refresh interval.
- Font Awesome icon and condition text mapped from the weather code.
- A loading text while the location/weather is being resolved.
- A short error text when the Open-Meteo request fails or returns an
  unexpected shape.
- Card CSS (`#202020` surface, `0 2px 2px #000` shadow) plus the weather
  row styles.

## Out of scope

- Any server change (no weather endpoint; `server/` untouched), database,
  or proxy changes.
- Geocoding / city search APIs - the fallback is a hardcoded constant.
- Hourly/daily forecast, wind, humidity, or any data beyond the current
  temperature and weather code.
- Auto-refresh of the weather after the initial load.
- A location/city label in the UI (plan shows only temperature,
  condition, and icon).
- Features 3-5 (entry form, tasks, graph).

## Build loop

Per `blueprint/config.json`: `stepReview: "feature"` - one review packet
after all steps; `checkpointCommits: "disabled"` - no per-step commits;
`/complete` later creates the final feature commit and local merge
(pre-approved by the user, with branch deletion still asked).

## Build steps

- [x] **Step 1 - Card shell and location resolution** - new
  `client/src/components/WeatherCard.jsx` rendered in `App.jsx` under
  `Header`. At the top of the file a fallback constant like
  `const FALLBACK_CITY = { name: 'Braga', latitude: 41.5454, longitude: -8.4265 };`
  (exact city pending review). On mount, get the position via
  `navigator.geolocation.getCurrentPosition`; on success use the browser
  coordinates, on any error - or when the API is unavailable - use
  `FALLBACK_CITY`. While resolving, render a neutral "Loading..." line in
  the card. Card CSS: `#202020` surface, `0 2px 2px #000` shadow, padding,
  stacking gap below the header. *Done when:* the card is visible under
  the header with the loading line; with a denied (or absent) geolocation
  the fallback constant is used (observable via browser geolocation
  override/devtools or by denying the prompt).

- [x] **Step 2 - Open-Meteo fetch and rendering** - fetch
  `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code`
  for the resolved coordinates and render inside the card:
  temperature as `Math.round(temperature_2m)` followed by `°C` in
  `var(--accent-temperature)` (`#FFCC00`), the condition text in
  `#9a9a9a`, and the Font Awesome icon for the weather code
  (`<i className="fa-solid ..." aria-hidden="true">`, condition text is
  the accessible label). Weather code mapping (current weather, WMO):
  `0` clear sky `fa-sun`; `1` mainly clear / `2` partly cloudy
  `fa-cloud-sun`; `3` overcast `fa-cloud`; `45`, `48` fog `fa-smog`;
  `51`, `53`, `55`, `56`, `57` drizzle `fa-cloud-rain`; `61`, `63`, `65`,
  `66`, `67` rain `fa-cloud-rain`; `71`, `73`, `75`, `77` snow
  `fa-snowflake`; `80`, `81`, `82` rain showers `fa-cloud-showers-heavy`;
  `85`, `86` snow showers `fa-snowflake`; `95`, `96`, `99` thunderstorm
  `fa-thunderstorm` (repair: verified against the FA 7.1 stylesheet -
  `fa-cloud-bolt` does not exist there); any other code: icon `fa-cloud`
  with no condition text. *Done when:* the live page shows the real current temperature and
  matching condition/icon for the browser's (or fallback) location, and
  `npm run build` in `client/` passes.

- [x] **Step 3 - Error state and polish** - when the fetch fails (network
  error, non-JSON, HTTP error) or the response is missing
  `current.temperature_2m` / `current.weather_code`, replace the card
  contents with a short error text ("Weather unavailable") in `#9a9a9a`.
  Final pass over colors, sizes, and spacing against the plan's visual
  style. *Done when:* with the network request blocked in devtools the
  card shows only the error text; the normal path is unchanged.

## Files / areas

- `client/src/components/WeatherCard.jsx` (new) - component, fallback
  constant, weather-code mapping.
- `client/public/icons/` (new) - 22 vendored Weather Icons SVGs from
  Open-Meteo's website repo.
- `client/src/App.jsx` - render `WeatherCard` under `Header`.
- `client/src/styles.css` - `.card`, weather row and text styles.
- No changes to: `server/`, `Header.jsx`, `useNow.js`, `index.html`
  (Font Awesome CDN is already present), Vite proxy.

## Data / contracts

- Open-Meteo request (browser-native `fetch`, no API key, CORS allowed):
  `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code,is_day`
  expecting JSON `{ current: { temperature_2m: number, weather_code: number, is_day: 0|1 } }`.
- Icons: Weather Icons SVGs vendored (one-time copy) from
  `open-meteo/open-meteo-website` `static/icons/` into
  `client/public/icons/` (22 files; served locally as
  `/icons/<name>.svg`), rendered as `<img aria-hidden="true">` with a CSS
  `invert(1)` filter because the source SVGs have no fill and render
  black. Day/night icon variants selected by `is_day`; Font Awesome stays
  the CDN icon font for the rest of the app.
- Fallback city constant at the top of `WeatherCard.jsx`
  (`{ name, latitude, longitude }`) - no geocoding request.
- No server, database, or proxy changes in this feature.

## Testing

No test runner is configured, so no automated tests are added. Each step
is verified manually in the browser (Try it now) and `npm run build` in
`client/` must pass.

## Try it now

```bash
cd server && npm start      # terminal 1
cd client && npm run dev    # terminal 2, open http://localhost:5173
```

- Normal: under the header row a `#202020` card with a temperature in
  `#FFCC00` (e.g. `18°C`), the condition text in `#9a9a9a`, and a local
  Weather Icons SVG (inverted white, day or night variant).
- Denied geolocation: same card, but with Braga's weather.
- Network blocked (devtools): the card shows "Weather unavailable".

## Notes for the AI

- Everything happens in the browser; do not add server routes or touch
  the DB (`server/` stays as is).
- One weather request per page load; no polling.
- Keep the mapping a plain object/array in the component file - no
  abstraction layers.
- Icon markup: `<i className="fa-solid fa-sun" aria-hidden="true"></i>`.
- Desktop only, fixed sizes; no media queries.

## Open questions

_None. Fallback city resolved at spec review: Braga, Portugal
(`41.5454, -8.4265`)._


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7621,"specSha256":"4e7eaa3fb2e73a8b96b239c91003b601a140bebfdcb7aa8300eb23e2ca963727","branch":"refs/heads/feature/weather-card","head":"a395edca51f57a720cb989ad9a2dc7a0f482a44b","baseRef":"refs/heads/master","baseCommit":"a395edca51f57a720cb989ad9a2dc7a0f482a44b","sourceTree":"d64e85cd7548e22039e757a83f0cbde061f6de91","landing":"local-merge","absentOptional":[]} -->

## Try it now

```bash
cd server && npm start      # terminal 1
cd client && npm run dev    # terminal 2, open http://localhost:5173
```

- Normal: under the header row a `#202020` card with a temperature in
  `#FFCC00` (e.g. `18°C`), the condition text in `#9a9a9a`, and a local
  Weather Icons SVG (inverted white, day or night variant).
- Denied geolocation: same card, but with Braga's weather.
- Network blocked (devtools): the card shows "Weather unavailable".
