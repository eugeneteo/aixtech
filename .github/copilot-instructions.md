# Copilot instructions for AIxTech

This repository is a personal AIxTech course workspace. Reference material and notes
sit at the root (`notes/`, `exercises/`, `resources/`); the only real application code
is in `projects/weather_starter`. Nearly all engineering work happens there, so treat
that directory as the working root unless a task is clearly about the notes or the
container tooling.

`projects/weather_starter` is a vendored public-domain course starter. Contributions
in this repository are otherwise GPL-3.0. Keep the starter's product behaviour intact
when extending it.

## Commands

Run these from `projects/weather_starter` (npm workspaces: `frontend` and `backend`).

- `npm install` installs both workspaces. Inside the Podman container use
  `npm install --ignore-scripts` to skip the Husky `prepare` hook, whose git root
  differs from the bind-mounted repo.
- `npm run dev` runs the whole stack through Portless at
  `http://weather-starter.localhost:1355`. Use this on the host.
- `npm run dev:server` runs Express + Vite directly on `0.0.0.0:3000`. Use this inside
  the container (open `http://localhost:3000`); `npm run dev` will not work there.
- `npm run build` builds the frontend then compiles the backend with `tsc`.
  `npm run build -w frontend` builds only the frontend, which is the quick way to
  validate CSS/TSX changes.
- `npm test` runs the Vitest suite (backend only). `npm run test:watch` watches.
- Run a single test file or case with Vitest directly, for example
  `npx vitest run backend/src/routes/locations.test.ts` or add `-t "case name"`.
- `npm run doctor` checks `/health` and `/api/locations`; `npm run reset` deletes the
  local SQLite database; `npm run db:generate` / `npm run db:migrate` manage Drizzle
  migrations after a schema change.

There is no lint script and no ESLint config wired up, so do not invoke a lint command;
rely on `tsc` (via the build) and the tests for validation.

## Architecture

The backend and frontend run as a single Node process in development. `createApp` in
`backend/src/server.ts` mounts the API under `/api`, then attaches Vite in middleware
mode to serve the React app (static `frontend/dist` in production). The frontend calls
relative `/api` paths (`frontend/src/api.ts`), so there is no separate frontend/backend
port or CORS configuration.

Request flow: `server.ts` -> `routes/locations.ts` -> `db.ts` (Drizzle) and
`weather.ts` (external API client). Routes stay thin: validate input, call a `db.ts`
helper and/or the weather client, and forward unexpected failures with `next(error)` to
the central error handler.

Data uses a snapshot pattern rather than live-fetching on every read. Creating a
location saves coordinates with a placeholder, immediately refreshes from data.gov.sg,
and stores the latest snapshot; listing reads from SQLite; manual refresh re-fetches and
overwrites the stored snapshot. Weather comes from `api-open.data.gov.sg`
(`SingaporeWeatherClient`); `WEATHER_API_KEY` is optional.

Persistence is Drizzle ORM over Node's built-in `node:sqlite` (`DatabaseSync`) through
`sqlite-proxy`, with WAL mode and migrations from `backend/drizzle` applied automatically
when `db.ts` is first imported. Frontend state lives in React Context providers:
`state/store.tsx` (locations) and `theme/theme.tsx` (active theme).

## Conventions

- The project is ESM throughout (`"type": "module"`). Backend TypeScript imports local
  modules with an explicit `.js` extension (for example `import { logger } from
  './logger.js'`) even though the source file is `.ts`. Match this or the build breaks.
- Weather/API field names are `snake_case` (see the `WeatherSnapshot` interface in
  `backend/src/schema.ts`), while the Drizzle table columns are `camelCase` mapped onto
  `snake_case` database column names. API responses use the `snake_case` shape.
- API errors are JSON `{ "detail": "..." }` with meaningful status codes (422 validation,
  409 duplicate, 404 missing, 502 upstream weather failure, 500 unexpected). The frontend
  `request` helper throws `Error(detail)`, so keep this response shape.
- Coordinates are validated to Singapore bounds (latitude 1.1-1.5, longitude 103.6-104.1)
  in `routes/locations.ts`; reuse these bounds for any new coordinate handling.
- Tests inject a fake `weatherClient` via `createApp`/`createLocationsRouter` options so
  no live API call is made. Vitest runs backend files only, in forks with file
  parallelism disabled (`vitest.config.ts`); there are no frontend unit tests.
- Themes: to add a visual theme, add an entry to the `THEMES` array in
  `frontend/src/theme/theme.tsx` and a matching `[data-theme='<id>']` block in
  `frontend/src/index.css`. No component changes are needed. Dark themes only need to
  swap the `body` background (components already use white glass and text); light themes
  must override the exact Tailwind utility classes the components use, because
  arbitrary-opacity classes bake literal colours and cannot be flipped through variables.
  Keep data, map, add-location flow, refresh behaviour, and the backend API unchanged
  when adding a theme.
