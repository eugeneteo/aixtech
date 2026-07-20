---
name: sg-weather-api
description: Reference for querying Singapore's data.gov.sg real-time weather and air-quality API. Use when you need endpoints, query parameters, response shapes, or ready-to-run examples for air temperature, humidity, rainfall, wind, UV, PSI, PM2.5, or the 2-hour, 24-hour, and 4-day forecasts.
license: MIT
---

# Singapore weather API (data.gov.sg)

A reference for calling Singapore's public real-time weather and air-quality API
directly. All endpoints below were checked against the live service and return JSON.
No API key or registration is required for read access.

The `weather_starter` project consumes these same endpoints from
`backend/src/weather.ts`, so this skill also documents the source of that data.

## Base URLs

- Real-time and forecast data: `https://api-open.data.gov.sg`
- Legacy environment data (used only for the 4-day forecast): `https://api.data.gov.sg`

Requests are plain HTTPS GETs. Send `Accept: application/json`. An API key is not
needed; if you have one, you may pass it as an `x-api-key` header, but public access
works without it.

## Endpoints

All real-time endpoints share the prefix `/v2/real-time/api`.

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

## Query parameters (real-time v2 endpoints)

- `date`: return data for a past date instead of the latest reading. Accepts
  `YYYY-MM-DD` (a whole day) or `YYYY-MM-DDTHH:mm:ss` (a specific time), for example
  `?date=2026-07-15` or `?date=2026-07-15T08:30:00`. An invalid value returns HTTP 400
  with `code` 4 and a message explaining the accepted formats.
- `paginationToken`: when a request returns a large window (for example a full day of
  readings), the response includes `data.paginationToken`. Pass it back as
  `?paginationToken=...` to fetch the next page.

## Response envelope

Every v2 response is wrapped in the same envelope:

```json
{
  "code": 0,
  "errorMsg": "",
  "data": { }
}
```

- `code` is `0` on success. A non-zero `code` signals an error; read `errorMsg`.
- The useful payload is always under `data`.

## Response shapes

### Station readings (temperature, humidity, rainfall, wind speed, wind direction)

`data` holds `stations`, `readings`, `readingType`, and `readingUnit`. Each reading
timestamp carries one `data` array of `{ stationId, value }` pairs. Match a `stationId`
to `stations[].id` to get its name and latitude/longitude.

```json
{
  "data": {
    "stations": [
      { "id": "S109", "deviceId": "S109", "name": "Ang Mo Kio Avenue 5",
        "location": { "latitude": 1.3793, "longitude": 103.85 } }
    ],
    "readings": [
      { "timestamp": "2026-07-20T21:39:00+08:00",
        "data": [ { "stationId": "S109", "value": 28.4 } ] }
    ],
    "readingType": "DBT 1M F",
    "readingUnit": "deg C"
  }
}
```

Units by endpoint: air temperature `deg C`, relative humidity `percentage`, rainfall
`mm`, wind speed `knots`, wind direction `degrees`. Confirm from each response's own
`readingUnit` field rather than assuming.

### Region readings (PSI, PM2.5)

`data` holds `regionMetadata` (five regions: `north`, `south`, `east`, `west`,
`central`) and `items`. Each item has a `readings` object whose keys map a metric to a
per-region value.

```json
{
  "data": {
    "regionMetadata": [
      { "name": "north", "labelLocation": { "latitude": 1.41803, "longitude": 103.82 } }
    ],
    "items": [
      { "date": "2026-07-20", "updatedTimestamp": "...", "timestamp": "...",
        "readings": {
          "psi_twenty_four_hourly": { "east": 59, "north": 55, "west": 59, "south": 56, "central": 63 }
        } }
    ]
  }
}
```

PSI exposes many sub-indices (`pm25_sub_index`, `o3_sub_index`, `psi_twenty_four_hourly`,
and more), each keyed by region. PM2.5 returns `pm25_one_hourly` in the same layout.

### 2-hour forecast (by area)

`data` holds `area_metadata` (47 named areas with a `label_location`) and `items`. The
latest item lists `forecasts` of `{ area, forecast }`. To pick a forecast for a point,
find the nearest area in `area_metadata`, then read that area's `forecast`.

```json
{
  "data": {
    "area_metadata": [
      { "name": "Ang Mo Kio", "label_location": { "latitude": 1.375, "longitude": 103.839 } }
    ],
    "items": [ { "update_timestamp": "...", "valid_period": { "text": "..." },
      "forecasts": [ { "area": "Ang Mo Kio", "forecast": "Thundery Showers" } ] } ]
  }
}
```

### 24-hour forecast

`data` holds `records`. Each record has `general` (island-wide `forecast`, `validPeriod`,
`temperature` low/high, `relativeHumidity`, `wind`) and `periods` (time-banded regional
forecasts).

```json
{
  "data": { "records": [ {
    "date": "2026-07-20", "updatedTimestamp": "...",
    "general": {
      "forecast": { "code": "TL", "text": "Thundery Showers" },
      "validPeriod": { "start": "...", "end": "...", "text": "6 PM 20 Jul to 6 PM 21 Jul" },
      "temperature": { "low": 25, "high": 34, "unit": "Degrees Celsius" },
      "wind": { "direction": "SSW", "speed": { "low": 5, "high": 15 } }
    },
    "periods": [ ]
  } ] }
}
```

### UV index

`data.records[0].index` is an array of `{ hour, value }` entries for the day. The most
recent hour is the current reading.

### 4-day forecast (legacy v1)

The legacy endpoint returns top-level `items` and `api_info`, using snake_case fields.

```json
{
  "items": [ { "forecasts": [ {
    "date": "2026-07-21", "timestamp": "...",
    "forecast": "Afternoon thundery showers",
    "temperature": { "low": 25, "high": 34 },
    "relative_humidity": { "low": 65, "high": 95 },
    "wind": { "direction": "SSW", "speed": { "low": 5, "high": 15 } }
  } ] } ]
}
```

## Errors and rate limits

- `HTTP 400`, `code` 4: bad request, for example an invalid `date` format. `errorMsg`
  states the accepted formats.
- `HTTP 429`, `code` 24: rate limit reached. Back off and retry. Rapid bursts across
  several endpoints can trigger this, so space requests out.
- On any non-zero `code`, prefer `errorMsg` over guessing.

## Examples

Latest air temperature at every station:

```bash
curl -s -H 'Accept: application/json' \
  https://api-open.data.gov.sg/v2/real-time/api/air-temperature
```

The 2-hour area forecast for a past date:

```bash
curl -s -H 'Accept: application/json' \
  'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast?date=2026-07-15'
```

PSI for all regions, reading the central value with jq:

```bash
curl -s -H 'Accept: application/json' \
  https://api-open.data.gov.sg/v2/real-time/api/psi \
  | jq '.data.items[0].readings.psi_twenty_four_hourly.central'
```

Nearest-station lookup in Node (no dependencies):

```js
const res = await fetch(
  'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
  { headers: { Accept: 'application/json' } },
);
const { code, errorMsg, data } = await res.json();
if (code !== 0) throw new Error(errorMsg || `Weather API error ${code}`);

const target = { latitude: 1.3521, longitude: 103.8198 };
const nearest = data.stations
  .map((s) => ({
    id: s.id,
    d: (s.location.latitude - target.latitude) ** 2 +
       (s.location.longitude - target.longitude) ** 2,
  }))
  .sort((a, b) => a.d - b.d)[0];

const latest = data.readings[0].data.find((r) => r.stationId === nearest.id);
console.log(`${nearest.id}: ${latest?.value} ${data.readingUnit}`);
```

## Notes

- Timestamps are Singapore time (`+08:00`).
- Station and area lists change over time. Read `stations` or `area_metadata` from each
  response rather than hard-coding identifiers.
- For a worked integration, see `projects/weather_starter/backend/src/weather.ts`, which
  fetches the reading endpoints, the two forecasts, and the air-quality endpoints, then
  picks the nearest station, area, or region to a set of coordinates.
