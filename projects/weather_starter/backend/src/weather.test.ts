import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SingaporeWeatherClient } from './weather.js';

// Coordinate we query for. Stations/areas below are placed so the *nearest*
// one differs from the first entry, exercising the nearest-neighbour selection.
const QUERY_LAT = 1.3;
const QUERY_LON = 103.8;

const twoHourPayload = {
  code: 0,
  data: {
    area_metadata: [
      // First in the list but far away — must NOT be chosen.
      { name: 'Bishan', label_location: { latitude: 1.35, longitude: 103.85 } },
      // Closest to the query point — expected winner.
      { name: 'Jurong West', label_location: { latitude: 1.3, longitude: 103.8 } },
    ],
    items: [
      {
        update_timestamp: '2026-07-17T12:30:00+08:00',
        valid_period: { text: '12:30 PM to 2:30 PM' },
        forecasts: [
          { area: 'Bishan', forecast: 'Cloudy' },
          { area: 'Jurong West', forecast: 'Partly Cloudy (Day)' },
        ],
      },
    ],
  },
};

const airTemperaturePayload = readingPayload(28.4, 40.1);
const humidityPayload = readingPayload(78, 55);
const rainfallPayload = readingPayload(0, 12.2);
const windSpeedPayload = readingPayload(6.5, 20);
const windDirectionPayload = readingPayload(135, 300);

// A generic realtime-reading payload with two stations: a far one listed FIRST
// (must not be chosen) and the nearest one second (the expected winner).
function readingPayload(nearValue: number, farValue: number) {
  return {
    code: 0,
    data: {
      stations: [
        { id: 'S1', name: 'Far', location: { latitude: 1.42, longitude: 103.92 } },
        { id: 'S2', name: 'Near', location: { latitude: 1.3, longitude: 103.8 } },
      ],
      readings: [
        {
          timestamp: '2026-07-17T12:29:00+08:00',
          data: [
            { stationId: 'S1', value: farValue },
            { stationId: 'S2', value: nearValue },
          ],
        },
      ],
    },
  };
}

const uvPayload = {
  code: 0,
  data: {
    records: [
      {
        date: '2026-07-17',
        updatedTimestamp: '2026-07-17T12:11:06+08:00',
        timestamp: '2026-07-17T12:00:00+08:00',
        index: [
          { hour: '2026-07-17T12:00:00+08:00', value: 8 },
          { hour: '2026-07-17T11:00:00+08:00', value: 6 },
        ],
      },
    ],
  },
};

// Night-time UV: latest reading is 0 (must be preserved, not treated as "missing").
const uvPayloadZero = {
  code: 0,
  data: {
    records: [
      {
        date: '2026-07-17',
        updatedTimestamp: '2026-07-17T20:11:06+08:00',
        timestamp: '2026-07-17T20:00:00+08:00',
        index: [{ hour: '2026-07-17T20:00:00+08:00', value: 0 }],
      },
    ],
  },
};

const twentyFourHourPayload = {
  code: 0,
  data: {
    records: [
      {
        updatedTimestamp: '2026-07-17T12:00:00+08:00',
        general: { temperature: { low: 25, high: 33 } },
        periods: [
          {
            timePeriod: { start: '2026-07-17T12:00:00+08:00', text: 'Midday to 6 pm' },
            // "south" is nearest to the query point; "central" is the fallback region.
            regions: {
              south: { text: 'Thundery Showers' },
              central: { text: 'Cloudy' },
              north: { text: 'Cloudy' },
              east: { text: 'Cloudy' },
              west: { text: 'Cloudy' },
            },
          },
          {
            timePeriod: { start: '2026-07-17T18:00:00+08:00', text: '6 pm to 6 am' },
            regions: {
              south: { text: 'Partly Cloudy (Night)' },
              central: { text: 'Fair (Night)' },
            },
          },
        ],
      },
    ],
  },
};

const fourDayPayload = {
  items: [
    {
      update_timestamp: '2026-07-17T09:41:17+08:00',
      timestamp: '2026-07-17T09:28:00+08:00',
      forecasts: [
        { date: '2026-07-18', forecast: 'Afternoon thundery showers', temperature: { low: 25, high: 34 } },
        { date: '2026-07-19', forecast: 'Afternoon thundery showers', temperature: { low: 25, high: 34 } },
        { date: '2026-07-20', forecast: 'Late morning showers', temperature: { low: 25, high: 33 } },
        { date: '2026-07-21', forecast: 'Late morning showers', temperature: { low: 25, high: 33 } },
      ],
    },
  ],
};

// PSI/PM2.5 share an envelope: regionMetadata + a per-region readings map. "north"
// is listed FIRST but far from the query point; "south" is nearest (expected winner).
function airQualityPayload(readingKey: string, nearValue: number, farValue: number) {
  return {
    code: 0,
    data: {
      regionMetadata: [
        { name: 'north', labelLocation: { latitude: 1.42, longitude: 103.82 } },
        { name: 'south', labelLocation: { latitude: 1.3, longitude: 103.8 } },
      ],
      items: [
        {
          date: '2026-07-17',
          updatedTimestamp: '2026-07-17T11:15:43+08:00',
          timestamp: '2026-07-17T11:00:00+08:00',
          readings: { [readingKey]: { north: farValue, south: nearValue } },
        },
      ],
    },
  };
}

const psiPayload = airQualityPayload('psi_twenty_four_hourly', 48, 60);
const pm25Payload = airQualityPayload('pm25_one_hourly', 12, 20);
// Pristine air: nearest-region PSI is 0 (must be preserved, not treated as "missing").
const psiPayloadZero = airQualityPayload('psi_twenty_four_hourly', 0, 5);

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response;
}

/**
 * Routes a stubbed fetch by URL. Endpoints not present in `overrides` fall back
 * to their default payload; pass `null` to force a network failure for that
 * endpoint (used by the resilience tests).
 */
type Endpoint =
  | 'twoHour'
  | 'airTemp'
  | 'humidity'
  | 'rainfall'
  | 'windSpeed'
  | 'windDir'
  | 'uv'
  | 'psi'
  | 'pm25'
  | 'fourDay'
  | 'dayForecast';

function stubFetch(overrides: Partial<Record<Endpoint, unknown>> = {}) {
  const route = (key: Endpoint, fallback: unknown) =>
    overrides[key] === null ? null : (overrides[key] ?? fallback);

  return vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    const match = (key: Endpoint, fallback: unknown): Response => {
      const payload = route(key, fallback);
      if (payload === null) throw new Error('network down');
      return jsonResponse(payload);
    };

    // Order matters: check the more specific paths before the shared ones.
    if (url.includes('two-hr-forecast')) return match('twoHour', twoHourPayload);
    if (url.includes('twenty-four-hr-forecast')) return match('dayForecast', twentyFourHourPayload);
    if (url.includes('air-temperature')) return match('airTemp', airTemperaturePayload);
    if (url.includes('relative-humidity')) return match('humidity', humidityPayload);
    if (url.includes('rainfall')) return match('rainfall', rainfallPayload);
    if (url.includes('wind-speed')) return match('windSpeed', windSpeedPayload);
    if (url.includes('wind-direction')) return match('windDir', windDirectionPayload);
    if (url.endsWith('/uv')) return match('uv', uvPayload);
    if (url.endsWith('/pm25')) return match('pm25', pm25Payload);
    if (url.endsWith('/psi')) return match('psi', psiPayload);
    if (url.includes('4-day-weather-forecast')) return match('fourDay', fourDayPayload);
    throw new Error(`Unexpected fetch to ${url}`);
  });
}

describe('SingaporeWeatherClient.getCurrentWeather (weather metrics)', () => {
  const client = new SingaporeWeatherClient();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates every metric from its endpoint', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // Condition card (two-hr + air-temperature + 24-hr).
    expect(snapshot.area).toBe('Jurong West');
    expect(snapshot.condition).toBe('Partly Cloudy (Day)');
    expect(snapshot.observed_at).toBe('2026-07-17T12:30:00+08:00');
    expect(snapshot.valid_period_text).toBe('12:30 PM to 2:30 PM');
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.forecast_low_c).toBe(25);
    expect(snapshot.forecast_high_c).toBe(33);
    // Dashboard tiles (realtime readings + UV).
    expect(snapshot.humidity_percent).toBe(78);
    expect(snapshot.rainfall_mm).toBe(0);
    expect(snapshot.wind_speed_knots).toBe(6.5);
    expect(snapshot.wind_direction_degrees).toBe(135);
    expect(snapshot.uv_index).toBe(8);
    // Air quality (psi + pm25, nearest region).
    expect(snapshot.psi_twenty_four_hourly).toBe(48);
    expect(snapshot.pm25_one_hourly).toBe(12);
    expect(snapshot.air_quality_region).toBe('south');
    // Forecast cards (24-hr periods + 4-day daily outlook).
    expect(snapshot.forecast_periods).toHaveLength(2);
    expect(snapshot.forecast_periods[0]).toEqual({
      label: 'Midday to 6 pm',
      forecast: 'Thundery Showers',
    });
    expect(snapshot.daily_forecast).toHaveLength(4);
    expect(snapshot.daily_forecast[0]).toEqual({
      date: '2026-07-18',
      forecast: 'Afternoon thundery showers',
      temperature_low_c: 25,
      temperature_high_c: 34,
    });
  });

  it('selects the nearest region for the 24-hour forecast periods', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // For the query point the nearest region is "south" — not the "central" fallback.
    expect(snapshot.forecast_periods[0].forecast).toBe('Thundery Showers');
    expect(snapshot.forecast_periods[0].forecast).not.toBe('Cloudy');
    expect(snapshot.forecast_periods[1].forecast).toBe('Partly Cloudy (Night)');
  });

  it('keeps each forecast card independent when the other endpoint fails', async () => {
    // 4-day down: hourly periods (and H/L) still resolve, daily list is empty.
    vi.stubGlobal('fetch', stubFetch({ fourDay: null }));
    let snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);
    expect(snapshot.daily_forecast).toEqual([]);
    expect(snapshot.forecast_periods).toHaveLength(2);
    expect(snapshot.forecast_high_c).toBe(33);

    // 24-hr down: daily list still resolves, hourly periods (and H/L) are empty/null.
    vi.stubGlobal('fetch', stubFetch({ dayForecast: null }));
    snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);
    expect(snapshot.forecast_periods).toEqual([]);
    expect(snapshot.forecast_low_c).toBeNull();
    expect(snapshot.daily_forecast).toHaveLength(4);
  });

  it('selects the nearest region for air quality, not the first listed', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // "south" is nearest; "north" (60/20) is first but far.
    expect(snapshot.air_quality_region).toBe('south');
    expect(snapshot.psi_twenty_four_hourly).toBe(48);
    expect(snapshot.pm25_one_hourly).toBe(12);
    expect(snapshot.psi_twenty_four_hourly).not.toBe(60);
  });

  it('selects the nearest station for each realtime reading, not the first listed', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // Nearest-station values, never the far first-listed ones.
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.humidity_percent).toBe(78);
    expect(snapshot.wind_speed_knots).toBe(6.5);
    expect(snapshot.humidity_percent).not.toBe(55);
    expect(snapshot.wind_speed_knots).not.toBe(20);
  });

  it('keeps zero-value readings as 0 rather than coercing to null', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({ uv: uvPayloadZero, rainfall: rainfallPayload, psi: psiPayloadZero }),
    );

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    expect(snapshot.rainfall_mm).toBe(0);
    expect(snapshot.uv_index).toBe(0);
    expect(snapshot.psi_twenty_four_hourly).toBe(0);
  });

  it('degrades per-metric without cascading when some endpoints fail', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({ humidity: null, windSpeed: null, windDir: null, uv: null, psi: null, pm25: null }),
    );

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // Failed metrics degrade to null...
    expect(snapshot.humidity_percent).toBeNull();
    expect(snapshot.wind_speed_knots).toBeNull();
    expect(snapshot.wind_direction_degrees).toBeNull();
    expect(snapshot.uv_index).toBeNull();
    expect(snapshot.psi_twenty_four_hourly).toBeNull();
    expect(snapshot.pm25_one_hourly).toBeNull();
    expect(snapshot.air_quality_region).toBeNull();
    // ...while the rest still resolve — one failure never cascades.
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.rainfall_mm).toBe(0);
    expect(snapshot.condition).toBe('Partly Cloudy (Day)');
    expect(snapshot.forecast_high_c).toBe(33);
  });

  it('degrades air quality to null when only the pm25 half fails', async () => {
    vi.stubGlobal('fetch', stubFetch({ pm25: null }));

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // fetchAirQuality fetches psi + pm25 together; either failing nulls the trio,
    // but every other metric is unaffected.
    expect(snapshot.psi_twenty_four_hourly).toBeNull();
    expect(snapshot.pm25_one_hourly).toBeNull();
    expect(snapshot.air_quality_region).toBeNull();
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.uv_index).toBe(8);
  });

  it('keeps the base snapshot intact when all enrichment endpoints fail', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({
        airTemp: null,
        humidity: null,
        rainfall: null,
        windSpeed: null,
        windDir: null,
        uv: null,
        psi: null,
        pm25: null,
        dayForecast: null,
        fourDay: null,
      }),
    );

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    expect(snapshot.area).toBe('Jurong West');
    expect(snapshot.condition).toBe('Partly Cloudy (Day)');
    expect(snapshot.temperature_c).toBeNull();
    expect(snapshot.humidity_percent).toBeNull();
    expect(snapshot.rainfall_mm).toBeNull();
    expect(snapshot.wind_speed_knots).toBeNull();
    expect(snapshot.uv_index).toBeNull();
    expect(snapshot.psi_twenty_four_hourly).toBeNull();
    expect(snapshot.pm25_one_hourly).toBeNull();
    expect(snapshot.air_quality_region).toBeNull();
    expect(snapshot.forecast_low_c).toBeNull();
    expect(snapshot.forecast_high_c).toBeNull();
    expect(snapshot.forecast_periods).toEqual([]);
    expect(snapshot.daily_forecast).toEqual([]);
  });

  it('still surfaces metrics when the two-hr forecast fails', async () => {
    vi.stubGlobal('fetch', stubFetch({ twoHour: null }));

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    expect(snapshot.condition).toBe('Unavailable');
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.humidity_percent).toBe(78);
    expect(snapshot.uv_index).toBe(8);
    expect(snapshot.forecast_high_c).toBe(33);
  });

  it('does not regress the existing two-hr-sourced fields', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    expect(snapshot.source).toBe('api-open.data.gov.sg');
    expect(snapshot.area).toBe('Jurong West');
    expect(snapshot.condition).toBe('Partly Cloudy (Day)');
    expect(snapshot.observed_at).toBe('2026-07-17T12:30:00+08:00');
    expect(snapshot.valid_period_text).toBe('12:30 PM to 2:30 PM');
  });
});
