import { Router } from 'express';
import { HttpError } from '../lib/http-error.js';
import { getCityWeather } from '../lib/weather.js';

export const weatherRouter = Router();

const attribution =
  'Weather data by Open-Meteo.com (https://open-meteo.com/)';

// Validate a single city.
function parseCity(value) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Invalid query', {
      city: 'city must be provided exactly once',
    });
  }

  const city = value.trim();

  if (city.length < 2 || city.length > 60) {
    throw new HttpError(400, 'Invalid query', {
      city: 'city must be 2 to 60 characters',
    });
  }

  return city;
}

// Validate a comma-separated list of cities.
function parseCities(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'Invalid query', {
      cities: 'cities must be provided exactly once',
    });
  }

  const cities = value.split(',').map((city) => city.trim());

  if (cities.some((city) => city === '')) {
    throw new HttpError(400, 'Invalid query', {
      cities: 'city names cannot be empty',
    });
  }

  if (cities.length < 2 || cities.length > 5) {
    throw new HttpError(400, 'Invalid query', {
      cities: 'provide between 2 and 5 cities',
    });
  }

  for (const city of cities) {
    if (city.length < 2 || city.length > 60) {
      throw new HttpError(400, 'Invalid query', {
        cities: 'each city must be 2 to 60 characters',
      });
    }
  }

  const seen = new Set();

  for (const city of cities) {
    const normalized = city.toLowerCase();

    if (seen.has(normalized)) {
      throw new HttpError(400, 'Invalid query', {
        cities: `"${city}" is listed more than once`,
      });
    }

    seen.add(normalized);
  }

  return cities;
}

// GET /api/weather?city=Toronto
weatherRouter.get('/weather', async (req, res) => {
  const city = parseCity(req.query.city);

  const data = await getCityWeather(city);

  return res.status(200).json({
    data,
    attribution,
  });
});

// GET /api/compare?cities=Toronto,Vancouver,Halifax
weatherRouter.get('/compare', async (req, res) => {
  const cities = parseCities(req.query.cities);

  // Start all city lookups concurrently.
  const results = await Promise.allSettled(
    cities.map((city) => getCityWeather(city))
  );

  let succeeded = 0;
  let failed = 0;

  let warmest = null;
  let coldest = null;

  let highestTemperature = -Infinity;
  let lowestTemperature = Infinity;

  const cityResults = results.map((result, index) => {
    const city = cities[index];

    if (result.status === 'fulfilled') {
      succeeded++;

      const weather = result.value;
      const temperature = weather.current.temperatureC;

      // Strict comparisons preserve the first city on ties.
      if (temperature > highestTemperature) {
        highestTemperature = temperature;
        warmest = weather.location.name;
      }

      if (temperature < lowestTemperature) {
        lowestTemperature = temperature;
        coldest = weather.location.name;
      }

      return {
        city,
        ok: true,
        weather,
      };
    }

    failed++;

    const error = result.reason;

    if (
      error instanceof HttpError &&
      [404, 502, 504].includes(error.status)
    ) {
      return {
        city,
        ok: false,
        error: {
          status: error.status,
          message: error.message,
        },
      };
    }

    // Log unexpected failures without exposing private details.
    console.error(error);

    return {
      city,
      ok: false,
      error: {
        status: 500,
        message: 'Internal server error',
      },
    };
  });

  return res.status(200).json({
    data: {
      cities: cityResults,
      summary: {
        succeeded,
        failed,
        warmest,
        coldest,
      },
    },
    attribution,
  });
});