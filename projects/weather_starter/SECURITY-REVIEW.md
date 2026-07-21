# Security review

Date: 2026-07-21
Scope: `projects/weather_starter` (Express backend, React/Vite frontend, Drizzle over
`node:sqlite`).

## Result

No security vulnerabilities were found. Each attack surface below was examined and
cleared.

| Surface                                                           | Finding                                                                                                                                                                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL injection (`backend/src/db.ts`)                               | All queries use Drizzle parameter binding. The only raw SQL is a static `DELETE FROM sqlite_sequence` in `resetStore`; no user data is concatenated into any statement.                                           |
| XSS via Leaflet `divIcon` (`frontend/src/components/MapCard.tsx`) | The interpolated `label` is passed through `escapeHtml` (escapes `& < > " '`) and `dotColour` is a fixed, boolean-derived constant. No unescaped user input reaches the markup.                                   |
| SSRF (`backend/src/weather.ts`)                                   | Outbound URLs are built from hardcoded `api-open.data.gov.sg` / `api.data.gov.sg` bases and fixed endpoint literals. Latitude and longitude are only used as numbers for nearest-station maths, never in the URL. |
| Input validation (`backend/src/routes/locations.ts`)              | Coordinates are `Number()`-coerced, NaN-checked, and bounded to Singapore. `locationId` is validated as a positive integer. The `/api/logs` `event` field is validated against a linear, non-ReDoS regex.         |
| Secrets (`WEATHER_API_KEY`)                                       | Read from the environment, sent only as the `x-api-key` request header to the provider, and never logged.                                                                                                         |
| Deserialization / prototype pollution                             | JSON columns originate from the trusted provider and are rendered through React (auto-escaped). `/api/logs` metadata is passed to pino as structured JSON and never merged into an object.                        |

## Method

The review was performed with a read-only security specialist over the backend routes,
database layer, weather client, server wiring, logger, and the frontend components,
including a repository-wide search for dangerous sinks. Only high-confidence, exploitable
issues were in scope; no such issues were identified.
