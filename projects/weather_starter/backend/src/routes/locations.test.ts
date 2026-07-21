import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WeatherProviderError, type WeatherSnapshot } from '../weather.js';

const weather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 29,
  humidity_percent: 80,
  rainfall_mm: 0,
  wind_speed_knots: 4,
  wind_direction_degrees: 180,
  forecast_low_c: 25,
  forecast_high_c: 32,
  uv_index: 7,
  psi_twenty_four_hourly: 42,
  pm25_one_hourly: 9,
  air_quality_region: 'central',
  forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
  daily_forecast: [{ date: '2026-05-04', forecast: 'Cloudy', temperature_low_c: 25, temperature_high_c: 32 }],
};

describe('locations API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          return weather;
        },
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('refreshes weather when a location is created', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Cloudy',
        area: 'Bishan',
        temperature_c: 29,
      },
    });

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(1);
    expect(listResponse.body.locations[0].weather.condition).toBe('Cloudy');
  });

  it('deletes an existing location', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.3, longitude: 103.9 })
      .expect(201);

    await request(app).delete(`/api/locations/${created.body.id}`).expect(204);

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(
      listResponse.body.locations.some(
        (location: { id: number }) => location.id === created.body.id,
      ),
    ).toBe(false);
  });

  it('returns 404 when deleting a location that does not exist', async () => {
    await request(app).delete('/api/locations/999999').expect(404);
  });

  it('rejects malformed location IDs consistently', async () => {
    const detail = { detail: 'locationId must be a positive integer' };

    expect((await request(app).get('/api/locations/not-a-number').expect(422)).body).toEqual(
      detail,
    );
    expect((await request(app).post('/api/locations/1.5/refresh').expect(422)).body).toEqual(
      detail,
    );
    expect((await request(app).delete('/api/locations/0').expect(422)).body).toEqual(detail);
  });

  it('returns one conflict for concurrent duplicate creates', async () => {
    const payload = { latitude: 1.24, longitude: 103.74 };
    const responses = await Promise.all([
      request(app).post('/api/locations').send(payload),
      request(app).post('/api/locations').send(payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  });

  it('removes a new location when its initial weather fetch fails completely', async () => {
    const { createApp } = await import('../server.js');
    const failedApp = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          throw new WeatherProviderError('Unable to retrieve weather data');
        },
      },
    });
    const payload = { latitude: 1.25, longitude: 103.75 };

    await request(failedApp)
      .post('/api/locations')
      .send(payload)
      .expect(502, { detail: 'Unable to retrieve weather data' });

    const listResponse = await request(failedApp).get('/api/locations').expect(200);
    expect(
      listResponse.body.locations.some(
        (location: { latitude: number; longitude: number }) =>
          location.latitude === payload.latitude && location.longitude === payload.longitude,
      ),
    ).toBe(false);
  });

  it('returns 409 for an existing location without calling the weather provider', async () => {
    const payload = { latitude: 1.27, longitude: 103.77 };
    await request(app).post('/api/locations').send(payload).expect(201);
    let weatherCalls = 0;
    const { createApp } = await import('../server.js');
    const duplicateApp = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          weatherCalls += 1;
          throw new WeatherProviderError('Unable to retrieve weather data');
        },
      },
    });

    await request(duplicateApp)
      .post('/api/locations')
      .send(payload)
      .expect(409, { detail: 'Location already exists' });
    expect(weatherCalls).toBe(0);
  });

  it('returns 404 when a location is deleted while refresh is in flight', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.26, longitude: 103.76 })
      .expect(201);
    let signalStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve;
    });
    let resolveWeather!: (snapshot: WeatherSnapshot) => void;
    const pendingWeather = new Promise<WeatherSnapshot>((resolve) => {
      resolveWeather = resolve;
    });
    const { createApp } = await import('../server.js');
    const raceApp = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          signalStarted();
          return pendingWeather;
        },
      },
    });

    const refreshResponse = request(raceApp)
      .post(`/api/locations/${created.body.id}/refresh`)
      .then((response) => response);
    await started;
    await request(raceApp).delete(`/api/locations/${created.body.id}`).expect(204);
    resolveWeather(weather);

    expect((await refreshResponse).status).toBe(404);
  });
});
