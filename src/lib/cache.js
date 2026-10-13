export class TtlCache {
  constructor(ttlSeconds) {
    this.ttlSeconds = ttlSeconds;

    // Store cached weather information.
    this.entries = new Map();

    // Track successful and unsuccessful cache lookups.
    this.hits = 0;
    this.misses = 0;
  }

  // Normalize city names for consistent caching.
  normalizeKey(city) {
    return city.trim().toLowerCase();
  }

  // Retrieve a cached weather summary.
  get(city) {
    const key = this.normalizeKey(city);
    const entry = this.entries.get(key);

    // No entry exists.
    if (!entry) {
      this.misses++;
      return null;
    }

    // Remove expired entries.
    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      this.misses++;
      return null;
    }

    // Valid cached entry.
    this.hits++;

    return entry.data;
  }

  // Store a successful lookup.
  set(city, data) {
    const key = this.normalizeKey(city);

    const expiresAt =
      Date.now() + this.ttlSeconds * 1000;

    this.entries.set(key, {
      data: data,
      expiresAt: expiresAt,
    });
  }

  // Remove entries that have expired.
  removeExpired() {
    const now = Date.now();

    for (const [key, entry] of this.entries) {
      if (now >= entry.expiresAt) {
        this.entries.delete(key);
      }
    }
  }

  // Return cache statistics.
  stats() {
    this.removeExpired();

    return {
      entries: this.entries.size,
      hits: this.hits,
      misses: this.misses,
      ttlSeconds: this.ttlSeconds,
    };
  }
}