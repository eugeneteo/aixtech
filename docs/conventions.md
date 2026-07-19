# Conventions

- **ESM with `.js` import extensions.** The project is ESM throughout
  (`"type": "module"`). Backend TypeScript imports local modules with an explicit `.js`
  extension (for example `import { logger } from './logger.js'`) even though the source
  file is `.ts`. Match this or the build breaks.
- **Field naming.** Weather/API field names are `snake_case` (see the `WeatherSnapshot`
  interface in `backend/src/schema.ts`), while the Drizzle table columns are `camelCase`
  mapped onto `snake_case` database column names. API responses use the `snake_case`
  shape.
- **Error shape.** API errors are JSON `{ "detail": "..." }` with meaningful status codes
  (422 validation, 409 duplicate, 404 missing, 502 upstream weather failure, 500
  unexpected). The frontend `request` helper throws `Error(detail)`, so keep this response
  shape.
- **Coordinate bounds.** Coordinates are validated to Singapore bounds (latitude 1.1-1.5,
  longitude 103.6-104.1) in `routes/locations.ts`; reuse these bounds for any new
  coordinate handling.
- **Test dependency injection.** Tests inject a fake `weatherClient` via
  `createApp`/`createLocationsRouter` options so no live API call is made. Vitest runs
  backend files only, in forks with file parallelism disabled (`vitest.config.ts`); there
  are no frontend unit tests.
