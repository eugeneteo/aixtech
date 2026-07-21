import type { Router } from 'express';
import { Router as createRouter } from 'express';
import {
  createLocation,
  deleteLocation,
  DuplicateLocationError,
  ensureLocationAvailable,
  getLocation,
  listLocations,
  updateWeather,
} from '../db.js';
import { SingaporeWeatherClient, WeatherProviderError, type WeatherSnapshot } from '../weather.js';
import { logger } from '../logger.js';

export interface WeatherClient {
  getCurrentWeather(latitude: number, longitude: number): Promise<WeatherSnapshot>;
}

interface LocationsRouterOptions {
  weatherClient?: WeatherClient;
}

export function createLocationsRouter(options: LocationsRouterOptions = {}): Router {
  const router: Router = createRouter();
  const weatherClient =
    options.weatherClient ?? new SingaporeWeatherClient({ apiKey: process.env.WEATHER_API_KEY });

  router.get('/locations', async (_request, response, next) => {
    try {
      response.json({ locations: await listLocations() });
    } catch (error) {
      next(error);
    }
  });

  router.post('/locations', async (request, response, next) => {
    try {
      const latitude = Number(request.body?.latitude);
      const longitude = Number(request.body?.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        response.status(422).json({ detail: 'latitude and longitude are required' });
        return;
      }
      if (!(1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1)) {
        response.status(422).json({
          detail: 'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)',
        });
        return;
      }

      try {
        await ensureLocationAvailable(latitude, longitude);
        const snapshot = await weatherClient.getCurrentWeather(latitude, longitude);
        const location = await createLocation(latitude, longitude, snapshot);
        response.status(201).json(location);
      } catch (error) {
        if (!(error instanceof WeatherProviderError)) throw error;
        logger.warn({ err: error }, 'weather fetch failed before location create');
        response.status(502).json({ detail: error.message });
      }
    } catch (error) {
      if (error instanceof DuplicateLocationError) {
        logger.warn({ err: error }, 'duplicate location rejected');
        response.status(409).json({ detail: error.message });
        return;
      }
      next(error);
    }
  });

  router.get('/locations/:locationId', async (request, response, next) => {
    try {
      const locationId = parseLocationId(request.params.locationId);
      if (locationId === null) {
        response.status(422).json({ detail: 'locationId must be a positive integer' });
        return;
      }
      const location = await getLocation(locationId);
      if (!location) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }
      response.json(location);
    } catch (error) {
      next(error);
    }
  });

  router.post('/locations/:locationId/refresh', async (request, response, next) => {
    try {
      const locationId = parseLocationId(request.params.locationId);
      if (locationId === null) {
        response.status(422).json({ detail: 'locationId must be a positive integer' });
        return;
      }
      const location = await getLocation(locationId);
      if (!location) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }

      const snapshot = await weatherClient.getCurrentWeather(location.latitude, location.longitude);
      const updated = await updateWeather(locationId, snapshot);
      if (!updated) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }
      response.json(updated);
    } catch (error) {
      if (error instanceof WeatherProviderError) {
        response.status(502).json({ detail: error.message });
        return;
      }
      next(error);
    }
  });

  router.delete('/locations/:locationId', async (request, response, next) => {
    try {
      const locationId = parseLocationId(request.params.locationId);
      if (locationId === null) {
        response.status(422).json({ detail: 'locationId must be a positive integer' });
        return;
      }

      const deleted = await deleteLocation(locationId);
      if (!deleted) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }

      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseLocationId(value: string): number | null {
  const locationId = Number(value);
  return Number.isInteger(locationId) && locationId > 0 ? locationId : null;
}
