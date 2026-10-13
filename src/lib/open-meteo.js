import { config } from '../config.js';
import { HttpError } from './http-error.js';

// Fetch a URL and return JSON.
// Handle timeouts, network errors, bad HTTP responses,
// and invalid JSON.
const fetchJson = async (url, service) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.upstreamTimeoutMs),
    });

    if (!response.ok) {
      throw new HttpError(
        502,
        `Could not get a valid response from the ${service} service`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error.name === 'TimeoutError') {
      throw new HttpError(
        504,
        `The ${service} service did not respond within ${config.upstreamTimeoutMs} ms`
      );
    }

    throw new HttpError(
      502,
      `Could not get a valid response from the ${service} service`
    );
  }
};

// Find a city's coordinates using the geocoding API.
export async function geocodeCity(name) {
  const url = new URL(
    `${config.geocodingUrl.replace(/\/+$/, '')}/search`
  );

  url.search = new URLSearchParams({
    name: name,
    count: '1',
    language: 'en',
    format: 'json',
  }).toString();

  const data = await fetchJson(url, 'geocoding');

  if (!data.results || data.results.length === 0) {
    throw new HttpError(404, `City not found: ${name}`);
  }

  const city = data.results[0];

  return {
    name: city.name,
    region: city.admin1 ?? null,
    country: city.country ?? null,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  };
}

// Get current weather and a 3-day forecast.
export async function getForecast(latitude, longitude) {
  const url = new URL(
    `${config.forecastUrl.replace(/\/+$/, '')}/forecast`
  );

  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '3',
  }).toString();

  return await fetchJson(url, 'forecast');
}