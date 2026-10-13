import { HttpError } from '../lib/http-error.js';

// Validate a single city name.
export function parseCity(value) {
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
export function parseCities(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'Invalid query', {
      cities: 'cities must be provided exactly once',
    });
  }

  const cities = value.split(',').map((city) => city.trim());

  // Reject empty city names.
  if (cities.some((city) => city.length === 0)) {
    throw new HttpError(400, 'Invalid query', {
      cities: 'city names cannot be empty',
    });
  }

  // Require between 2 and 5 cities.
  if (cities.length < 2 || cities.length > 5) {
    throw new HttpError(400, 'Invalid query', {
      cities: 'provide between 2 and 5 cities',
    });
  }

  // Validate the length of each city name.
  for (const city of cities) {
    if (city.length < 2 || city.length > 60) {
      throw new HttpError(400, 'Invalid query', {
        cities: 'each city must be 2 to 60 characters',
      });
    }
  }

  // Prevent duplicate city names regardless of capitalization.
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