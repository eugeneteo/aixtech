# Response shapes and examples

Full JSON shapes for each endpoint family in the sg-weather-api skill, plus worked
examples. All shapes were checked against the live service.

## Response envelope (v2 endpoints)

Every v2 response uses the same wrapper:

```json
{
  "code": 0,
  "errorMsg": "",
  "data": { }
}
```

- `code` is `0` on success. A non-zero `code` signals an error; read `errorMsg`.
- The useful payload is always under `data`.

## Station readings (temperature, humidity, rainfall, wind speed, wind direction)

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

Confirm the unit from each response's own `readingUnit` field rather than assuming.

## Region readings (PSI, PM2.5)

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

## 2-hour forecast (by area)

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

## 24-hour forecast

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

## UV index

`data.records[0].index` is an array of `{ hour, value }` entries for the day. The most
recent hour is the current reading.

## 4-day forecast (legacy v1)

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

## curl examples

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

## Nearest-station lookup in Node (no dependencies)

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
