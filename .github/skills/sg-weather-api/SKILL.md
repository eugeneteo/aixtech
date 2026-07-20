---
name: sg-weather-api
description: Reference for querying Singapore's data.gov.sg real-time weather and air-quality API. Use when you need endpoints, query parameters, response shapes, or ready-to-run examples for air temperature, humidity, rainfall, wind, UV, PSI, PM2.5, or the 2-hour, 24-hour, and 4-day forecasts.
license: MIT
---

# Singapore weather API (data.gov.sg)

A reference for calling Singapore's public real-time weather and air-quality API
directly. Endpoints return JSON and need no API key or registration for read access.

The `weather_starter` project consumes these same endpoints from
`backend/src/weather.ts`, so this skill also documents the source of that data.

## Base URLs

- Real-time and forecast data: `https://api-open.data.gov.sg`
- Legacy environment data (used only for the 4-day forecast): `https://api.data.gov.sg`

Requests are plain HTTPS GETs. Send `Accept: application/json`. An API key is not
needed; if you have one, you may pass it as an `x-api-key` header, but public access
works without it. Timestamps are Singapore time (`+08:00`).

## Endpoints

All real-time endpoints share the prefix `/v2/real-time/api`. The shape family tells
you how to read the response; see `examples.md` for the full JSON of each family.

| What you want            | Method and path                                       | Shape family     |
| ------------------------ | ----------------------------------------------------- | ---------------- |
| Air temperature          | `GET /v2/real-time/api/air-temperature`               | station readings |
| Relative humidity        | `GET /v2/real-time/api/relative-humidity`             | station readings |
| Rainfall                 | `GET /v2/real-time/api/rainfall`                      | station readings |
| Wind speed               | `GET /v2/real-time/api/wind-speed`                    | station readings |
| Wind direction           | `GET /v2/real-time/api/wind-direction`               | station readings |
| UV index                 | `GET /v2/real-time/api/uv`                            | records          |
| PSI (24-hourly)          | `GET /v2/real-time/api/psi`                           | region readings  |
| PM2.5 (1-hourly)         | `GET /v2/real-time/api/pm25`                          | region readings  |
| 2-hour forecast (by area)| `GET /v2/real-time/api/two-hr-forecast`              | area forecast    |
| 24-hour forecast         | `GET /v2/real-time/api/twenty-four-hr-forecast`      | records          |
| 4-day forecast (legacy)  | `GET https://api.data.gov.sg/v1/environment/4-day-weather-forecast` | legacy items |

Reading units: air temperature `deg C`, relative humidity `percentage`, rainfall `mm`,
wind speed `knots`, wind direction `degrees`. Confirm from each response's own
`readingUnit` field rather than assuming.

## Query parameters (real-time v2 endpoints)

- `date`: return data for a past date instead of the latest reading. Accepts
  `YYYY-MM-DD` (a whole day) or `YYYY-MM-DDTHH:mm:ss` (a specific time), for example
  `?date=2026-07-15` or `?date=2026-07-15T08:30:00`. An invalid value returns HTTP 400
  with `code` 4 and a message explaining the accepted formats.
- `paginationToken`: when a request returns a large window (for example a full day of
  readings), the response includes `data.paginationToken`. Pass it back as
  `?paginationToken=...` to fetch the next page.

## Response basics

Every v2 response is wrapped as `{ "code": 0, "errorMsg": "", "data": { } }`. `code` is
`0` on success; on any non-zero `code`, prefer `errorMsg` over guessing. The payload is
always under `data`. The shape families are:

- Station readings: `data.stations` plus timestamped `data.readings` of
  `{ stationId, value }`. Match a `stationId` to the nearest station's coordinates.
- Region readings (PSI, PM2.5): `data.regionMetadata` (five regions) plus `data.items`,
  whose `readings` map each metric to a per-region value.
- Area forecast (2-hour): `data.area_metadata` (47 areas) plus `data.items[].forecasts`
  of `{ area, forecast }`. Pick the nearest area.
- Records (24-hour, UV): `data.records` with island-wide `general` fields or hourly
  `index` entries.
- Legacy items (4-day): top-level `items` with snake_case `forecasts`.

See `examples.md` in this skill directory for the full JSON of each shape, curl
snippets, and a no-dependency nearest-station lookup in Node.

## Errors and rate limits

- `HTTP 400`, `code` 4: bad request, for example an invalid `date` format. `errorMsg`
  states the accepted formats.
- `HTTP 429`, `code` 24: rate limit reached. Back off and retry. Rapid bursts across
  several endpoints can trigger this, so space requests out.

## Notes

- Station and area lists change over time. Read `stations` or `area_metadata` from each
  response rather than hard-coding identifiers.
- For a worked integration, see `projects/weather_starter/backend/src/weather.ts`, which
  fetches the reading endpoints, the two forecasts, and the air-quality endpoints, then
  picks the nearest station, area, or region to a set of coordinates.
