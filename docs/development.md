# Development

Run all commands from `projects/weather_starter` (npm workspaces: `frontend` and
`backend`).

## Install

- `npm install` installs both workspaces.
- Inside the Podman container use `npm install --ignore-scripts` to skip the Husky
  `prepare` hook, whose git root differs from the bind-mounted repo.

## Run

- `npm run dev` runs the whole stack through Portless at
  `http://weather-starter.localhost:1355`. Use this on the host.
- `npm run dev:server` runs Express + Vite directly on `0.0.0.0:3000`. Use this inside
  the container (open `http://localhost:3000`); `npm run dev` will not work there.

## Build

- `npm run build` builds the frontend then compiles the backend with `tsc`.
- `npm run build -w frontend` builds only the frontend, the quick way to validate
  CSS/TSX changes.

There is no lint script and no ESLint config wired up, so do not invoke a lint command;
rely on `tsc` (via the build) and the tests for validation.

## Test

- `npm test` runs the Vitest suite (backend only). `npm run test:watch` watches.
- Run a single test file or case with Vitest directly, for example
  `npx vitest run backend/src/routes/locations.test.ts` or add `-t "case name"`.

## Utilities

- `npm run doctor` checks `/health` and `/api/locations`.
- `npm run reset` deletes the local SQLite database.
- `npm run db:generate` and `npm run db:migrate` manage Drizzle migrations after a
  schema change.

## Container (Podman)

A minimal `Containerfile` at the repo root builds a `node:24-slim` image with the GitHub
Copilot CLI pre-installed. The repo is bind-mounted at runtime, so no source or
`node_modules` are baked in.

```bash
podman build -t aixtech-dev -f Containerfile .
podman run -it --rm -p 3000:3000 -v ./:/workspace aixtech-dev
```

Inside the container, install with `npm install --ignore-scripts` and start the app with
`npm run dev:server` (not `npm run dev`, which routes through Portless for host use).
