# City Weather API

An Express API that uses Open-Meteo to return current weather and a three-day forecast for a city, or compare weather across multiple cities. It supports validation, error handling, request timeouts, and in-memory caching.

## Run it

Requires Node.js 24.

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Server port |
| `GEOCODING_URL` | `https://geocoding-api.open-meteo.com/v1` | Geocoding API base URL |
| `FORECAST_URL` | `https://api.open-meteo.com/v1` | Forecast API base URL |
| `UPSTREAM_TIMEOUT_MS` | `5000` | Timeout for Open-Meteo requests in milliseconds |
| `CACHE_TTL_SECONDS` | `600` | Cache lifetime in seconds |

## Endpoints

| Method | Example request | Response |
|---|---|---|
| GET | `/api/weather?city=Toronto` | `200`: Current weather and three-day forecast in `data`, plus `attribution` |
| GET | `/api/compare?cities=Toronto,Vancouver,Halifax` | `200`: Per-city weather results or errors and a summary of successful/failed lookups, warmest, and coldest city |
| GET | `/api/cache/stats` | `200`: Cache `entries`, `hits`, `misses`, and `ttlSeconds` in `data` |

## Testing

Run these commands in Git Bash on Windows against a freshly started server.

```bash
# 1. Weather for a city: 200
curl -i "http://localhost:4000/api/weather?city=Toronto"

# 2. Same city again (cached): 200
curl -i "http://localhost:4000/api/weather?city=Toronto"

# 3. Missing city: 400
curl -i "http://localhost:4000/api/weather"

# 4. City that does not exist: 404
curl -i "http://localhost:4000/api/weather?city=Qwertyville"

# 5. Compare three cities: 200
curl -i "http://localhost:4000/api/compare?cities=Toronto,Vancouver,Halifax"

# 6. Compare with one unknown city: 200
curl -i "http://localhost:4000/api/compare?cities=Toronto,Halifax,Qwertyville"

# 7. Compare too many cities: 400
curl -i "http://localhost:4000/api/compare?cities=Toronto,Vancouver,Halifax,Ottawa,Calgary,Montreal"

# 8. Compare with a repeated city: 400
curl -i "http://localhost:4000/api/compare?cities=Toronto,toronto"

# 9. Cache statistics: 200
curl -i "http://localhost:4000/api/cache/stats"

# 10. Unknown route: 404
curl -i "http://localhost:4000/api/unknown"
```

## Data source

Weather data provided by [Open-Meteo](https://open-meteo.com/).

## AI use

No AI Used for project
