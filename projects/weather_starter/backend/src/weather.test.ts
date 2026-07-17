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

const airTemperaturePayload = {
  code: 0,
  data: {
    stations: [
      // Far station listed first — must NOT be chosen.
      { id: 'S1', name: 'Far', location: { latitude: 1.42, longitude: 103.92 } },
      // Nearest station — expected winner.
      { id: 'S2', name: 'Near', location: { latitude: 1.3, longitude: 103.8 } },
    ],
    readings: [
      {
        timestamp: '2026-07-17T12:29:00+08:00',
        data: [
          { stationId: 'S1', value: 40.1 },
          { stationId: 'S2', value: 28.4 },
        ],
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
            regions: { central: { text: 'Partly Cloudy' } },
          },
        ],
      },
    ],
  },
};

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
function stubFetch(overrides: Partial<Record<'twoHour' | 'airTemp' | 'dayForecast', unknown>> = {}) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('two-hr-forecast')) {
      if (overrides.twoHour === null) throw new Error('network down');
      return jsonResponse(overrides.twoHour ?? twoHourPayload);
    }
    if (url.includes('air-temperature')) {
      if (overrides.airTemp === null) throw new Error('network down');
      return jsonResponse(overrides.airTemp ?? airTemperaturePayload);
    }
    if (url.includes('twenty-four-hr-forecast')) {
      if (overrides.dayForecast === null) throw new Error('network down');
      return jsonResponse(overrides.dayForecast ?? twentyFourHourPayload);
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
}

describe('SingaporeWeatherClient.getCurrentWeather (condition card)', () => {
  const client = new SingaporeWeatherClient();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates every condition-card field from the three endpoints', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // From two-hr-forecast (nearest area).
    expect(snapshot.area).toBe('Jurong West');
    expect(snapshot.condition).toBe('Partly Cloudy (Day)');
    expect(snapshot.observed_at).toBe('2026-07-17T12:30:00+08:00');
    expect(snapshot.valid_period_text).toBe('12:30 PM to 2:30 PM');
    // From air-temperature (nearest station) and twenty-four-hr-forecast (H/L).
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.forecast_low_c).toBe(25);
    expect(snapshot.forecast_high_c).toBe(33);
  });

  it('selects the nearest air-temperature station, not the first listed', async () => {
    vi.stubGlobal('fetch', stubFetch());

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // S1 (40.1) is first but far; S2 (28.4) is nearest.
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.temperature_c).not.toBe(40.1);
  });

  it('keeps the base snapshot intact when enrichment endpoints fail', async () => {
    vi.stubGlobal('fetch', stubFetch({ airTemp: null, dayForecast: null }));

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // Base two-hr fields still resolve.
    expect(snapshot.area).toBe('Jurong West');
    expect(snapshot.condition).toBe('Partly Cloudy (Day)');
    // Enrichment fields degrade gracefully to null — the card never breaks.
    expect(snapshot.temperature_c).toBeNull();
    expect(snapshot.forecast_low_c).toBeNull();
    expect(snapshot.forecast_high_c).toBeNull();
  });

  it('still surfaces temperature and H/L when the two-hr forecast fails', async () => {
    vi.stubGlobal('fetch', stubFetch({ twoHour: null }));

    const snapshot = await client.getCurrentWeather(QUERY_LAT, QUERY_LON);

    // Base becomes the "Unavailable" snapshot, but enrichment still fills in.
    expect(snapshot.condition).toBe('Unavailable');
    expect(snapshot.temperature_c).toBe(28.4);
    expect(snapshot.forecast_low_c).toBe(25);
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
