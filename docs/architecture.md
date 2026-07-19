# Architecture

The application code lives in `projects/weather_starter`, a TypeScript full-stack
Singapore weather app. It is a vendored public-domain course starter; other contributions
in this repository are GPL-3.0. Keep the starter's product behaviour intact when
extending it.

## Single process

The backend and frontend run as a single Node process in development. `createApp` in
`backend/src/server.ts` mounts the API under `/api`, then attaches Vite in middleware
mode to serve the React app. In production it serves the static `frontend/dist` build
instead. The frontend calls relative `/api` paths (`frontend/src/api.ts`), so there is no
separate frontend/backend port or CORS configuration.

## Request flow

`server.ts` -> `routes/locations.ts` -> `db.ts` (Drizzle) and `weather.ts` (external API
client). Routes stay thin: validate input, call a `db.ts` helper and/or the weather
client, and forward unexpected failures with `next(error)` to the central error handler.

## Snapshot pattern

Data uses a snapshot pattern rather than live-fetching on every read:

1. Creating a location saves coordinates with a placeholder.
2. The backend immediately refreshes from data.gov.sg and stores the latest snapshot.
3. Listing reads from SQLite.
4. Manual refresh re-fetches and overwrites the stored snapshot.

Weather comes from `api-open.data.gov.sg` via `SingaporeWeatherClient` in `weather.ts`;
`WEATHER_API_KEY` is optional (higher rate limits only).

## Persistence

Drizzle ORM runs over Node's built-in `node:sqlite` (`DatabaseSync`) through
`sqlite-proxy`, with WAL mode. Migrations from `backend/drizzle` are applied
automatically when `db.ts` is first imported.

## Frontend state

State lives in React Context providers: `state/store.tsx` (locations) and
`theme/theme.tsx` (active theme).
