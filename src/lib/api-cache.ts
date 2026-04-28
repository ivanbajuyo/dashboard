// localStorage-based API response cache for offline support
// Stores the last successful /api/charts response so the dashboard can display cached data

const CACHE_KEY = "chartstudio-api-cache";
const CACHE_TIMESTAMP_KEY = "chartstudio-api-cache-timestamp";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedApiData {
  charts: Record<string, unknown>[];
  collections: string[];
}

export function saveApiCache(data: { charts: Record<string, unknown>[]; collections?: string[] }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // localStorage might be full or unavailable
    console.warn("[PWA Cache] Failed to save API cache.");
  }
}

export function getApiCache(): CachedApiData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!raw) return null;

    // Check if cache is expired
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > MAX_AGE_MS) {
        clearApiCache();
        return null;
      }
    }

    return JSON.parse(raw) as CachedApiData;
  } catch {
    return null;
  }
}

export function clearApiCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch {
    // Ignore
  }
}

export function getCacheAge(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    const minutes = Math.floor(age / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  } catch {
    return null;
  }
}
