# Copilot instructions for AIxTech

A personal AIxTech course workspace. Notes and reference material sit at the root
(`notes/`, `exercises/`, `resources/`); the only real application code is
`projects/weather_starter`, a TypeScript full-stack Singapore weather app (Express +
React/Vite, Drizzle over SQLite). Treat that directory as the working root.

## Essentials

- Run commands from `projects/weather_starter` (npm workspaces: `frontend`, `backend`).
- Start the app: `npm run dev:server` (container, `http://localhost:3000`) or
  `npm run dev` (host, Portless at `http://weather-starter.localhost:1355`).
- Validate changes: `npm run build` (frontend build + backend `tsc`) and `npm test`
  (Vitest, backend only). Run a single test with
  `npx vitest run backend/src/routes/locations.test.ts -t "case name"`.
- Backend TypeScript imports local modules with an explicit `.js` extension (for example
  `import { logger } from './logger.js'`), even though the source is `.ts`, or the build
  breaks.
- Write git commit messages with an imperative, capitalised subject and no type prefix
  (not `docs:` or `notes:`), usually followed by a body paragraph explaining the change.

## Detail (progressive disclosure)

Read the relevant file under `docs/` before working in that area:

- [`docs/development.md`](../docs/development.md) — build, test, run, and container
  commands, including how to run a single test.
- [`docs/architecture.md`](../docs/architecture.md) — the single-process Express + Vite
  design, request flow, snapshot pattern, and persistence.
- [`docs/conventions.md`](../docs/conventions.md) — ESM `.js` imports, field naming, the
  error shape, coordinate bounds, and the test dependency-injection pattern.
- [`docs/theming.md`](../docs/theming.md) — how to add a visual theme.
- [`docs/writing-style.md`](../docs/writing-style.md) — writing conventions for notes,
  docs, and commit messages.
