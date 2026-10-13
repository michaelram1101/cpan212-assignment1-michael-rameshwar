import { config } from '../config.js';
import { geocodeCity, getForecast } from './open-meteo.js';
import { describeWeatherCode } from './weather-codes.js';
import { TtlCache } from './cache.js';

// Create one cache for the entire application.
const cache = new TtlCache(config.cacheTtlSeconds);

// Get the weather summary for a single city.
export async function getCityWeather(city) {
  const trimmedCity = city.trim();

  // Check the cache before requesting new data.
  const cachedWeather = cache.get(trimmedCity);

  if (cachedWeather !== null) {
    return {
      ...cachedWeather,
      cached: true,
    };
  }

  // Find the city's location.
  const location = await geocodeCity(trimmedCity);

  // Get the current weather and three-day forecast.
  const fetchedAt = new Date().toISOString();
  const forecast = await getForecast(
    location.latitude,
    location.longitude
  );

  const current = forecast.current;
  const daily = forecast.daily;

  // Build the three-day forecast.
  const dailyForecast = daily.time.slice(0, 3).map(
    (date, index) => ({
      date: date,
      minC: daily.temperature_2m_min[index],
      maxC: daily.temperature_2m_max[index],
      precipitationChancePercent:
        daily.precipitation_probability_max?.[index] ?? null,
      weatherCode: daily.weather_code[index],
      conditions: describeWeatherCode(
        daily.weather_code[index]
      ),
    })
  );

  // Build the complete weather summary.
  const weatherSummary = {
    location: {
      name: location.name,
      region: location.region ?? null,
      country: location.country ?? null,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
    },

    current: {
      time: current.time,
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidityPercent: current.relative_humidity_2m,
      windKmh: current.wind_speed_10m,
      weatherCode: current.weather_code,
      conditions: describeWeatherCode(
        current.weather_code
      ),
    },

    daily: dailyForecast,

    fetchedAt: fetchedAt,

    cached: false,
  };

  // Cache successful weather results.
  cache.set(trimmedCity, weatherSummary);

  return weatherSummary;
}

// Return the current cache statistics.
export function getCacheStats() {
  return cache.stats();
}