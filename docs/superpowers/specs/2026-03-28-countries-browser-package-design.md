# @countrystatecity/countries-browser — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Package:** `@countrystatecity/countries-browser`
**Repo:** `countrystatecity-countries-browser` in `csc-ecosystem/`

---

## Problem

The server package (`@countrystatecity/countries`) cannot run in browsers due to Node.js dependencies (`fs`, `path`, `url`). Frontend developers using React, Vue, Svelte, or Vite get silent failures (`null` returns, empty arrays) or explicit `fs` errors. The current workaround (Vite `import.meta.glob` or backend API) is clunky and poorly discoverable (see GitHub Issues #1, #2).

## Solution

A browser-native package that replaces `fs.readFileSync` with `fetch()` against jsDelivr CDN. Same API signatures as the server package. Zero Node.js dependencies.

## Architecture

### Package Structure

```
countrystatecity-countries-browser/
├── src/
│   ├── index.ts          # Public API (re-exports)
│   ├── types.ts          # Copied from server package
│   ├── config.ts         # configure(), resetConfiguration(), defaults
│   ├── cache.ts          # LRU cache
│   ├── fetcher.ts        # fetch wrapper (timeout, errors)
│   ├── loaders.ts        # getCountries(), getStatesOfCountry(), etc.
│   └── utils.ts          # isValidCountryCode(), searchCitiesByName(), etc.
├── scripts/
│   └── generate-data.cjs # Transforms server data → flat CDN structure
├── tests/
│   ├── unit/
│   │   ├── fetcher.test.ts
│   │   ├── cache.test.ts
│   │   ├── config.test.ts
│   │   ├── loaders.test.ts
│   │   └── utils.test.ts
│   └── integration/
│       └── api.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── .github/
    └── workflows/
        ├── ci.yml
        ├── publish.yml
        └── update-data.yml
```

### Data Flow

```
User code
  → getStatesOfCountry('US')
  → LRU cache check (key: "states/US.json")
  → cache hit? return cached data
  → cache miss? fetch from jsDelivr:
      https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@{VERSION}/dist/data/states/US.json
  → parse JSON
  → store in LRU cache
  → return typed result
```

### Data Structure (Flat, CDN-Friendly)

The server package uses nested directories with human-readable names (`United States-US/California-CA/cities.json`). The browser package flattens these to ISO-code-based paths:

```
dist/data/
├── countries.json              # All countries list
├── country/
│   └── {ISO2}.json             # Country metadata (e.g., US.json)
├── states/
│   └── {ISO2}.json             # States per country (e.g., US.json)
└── cities/
    └── {ISO2}-{STATE}.json     # Cities per state (e.g., US-CA.json)
```

This eliminates the `fs.readdirSync` directory scanning that causes the server package to fail in browsers.

### CDN Strategy

- **Provider:** jsDelivr (99.9% uptime, free, auto-syncs from npm)
- **URL format:** `https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@{VERSION}/dist/data/{path}`
- **Version pinning:** Package version inlined at build time as a constant. URLs are immutable — safe to cache forever.
- **Self-hosting:** `configure({ baseURL: 'https://my-cdn.com/data' })` overrides jsDelivr

### Caching

- **LRU in-memory cache** with configurable max entries (default: 50)
- **HTTP caching** via `cache: 'default'` on fetch — browser handles `Cache-Control` headers from jsDelivr
- **Manual clear** via `clearCache()` for SPA memory management

## API Surface

### Core Functions (identical to server package)

```typescript
getCountries(): Promise<ICountry[]>
getCountryByCode(code: string): Promise<ICountryMeta | null>
getStatesOfCountry(countryCode: string): Promise<IState[]>
getStateByCode(countryCode: string, stateCode: string): Promise<IState | null>
getCitiesOfState(countryCode: string, stateCode: string): Promise<ICity[]>
getCityById(countryCode: string, stateCode: string, cityId: number): Promise<ICity | null>
getAllCitiesOfCountry(countryCode: string): Promise<ICity[]>
getAllCitiesInWorld(): Promise<ICity[]>
```

### Utility Functions (identical to server package)

```typescript
isValidCountryCode(code: string): Promise<boolean>
isValidStateCode(countryCode: string, stateCode: string): Promise<boolean>
searchCitiesByName(countryCode: string, stateCode: string, term: string): Promise<ICity[]>
getCountryNameByCode(code: string): Promise<string | null>
getStateNameByCode(countryCode: string, stateCode: string): Promise<string | null>
getTimezoneForCity(countryCode: string, stateCode: string, cityName: string): Promise<string | null>
getCountryTimezones(countryCode: string): Promise<string[]>
```

### Browser-Specific Functions (new)

```typescript
configure(options: ConfigOptions): void
resetConfiguration(): void
clearCache(): void
```

### Types

```typescript
// Copied from server package (independent, no dependency)
interface ICountry { id, name, iso2, iso3, numeric_code, phonecode, capital, currency, currency_name, currency_symbol, tld, native, region, subregion, nationality, latitude, longitude, emoji, emojiU }
interface ICountryMeta extends ICountry { timezones: ITimezone[], translations: ITranslations }
interface IState { id, name, country_id, country_code, fips_code, iso2, type, latitude, longitude, native, timezone, translations }
interface ICity { id, name, state_id, state_code, country_id, country_code, latitude, longitude, native, timezone, translations }
interface ITimezone { zoneName, gmtOffset, gmtOffsetName, abbreviation, tzName }
interface ITranslations { [languageCode: string]: string }

// Browser-specific
interface ConfigOptions {
  baseURL?: string;                    // Override jsDelivr default
  timeout?: number;                    // Fetch timeout in ms (default: 5000)
  headers?: Record<string, string>;    // Custom fetch headers
  cacheSize?: number;                  // LRU max entries (default: 50)
}
```

### Error Handling

```typescript
class NetworkError extends Error {
  constructor(message: string, public url: string, public statusCode?: number)
}

class TimeoutError extends Error {
  constructor(message: string, public timeout: number)
}
```

**Behavior:**
- Invalid country/state codes → `null` or `[]` (graceful, matches server package)
- Network failure → throws `NetworkError` with URL and status
- Fetch timeout → throws `TimeoutError`
- No automatic retries in v1

## Key Implementation Details

### fetcher.ts

```typescript
async function fetchJSON<T>(path: string): Promise<T> {
  const config = getConfig();
  const url = `${config.baseURL}${path}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(config.timeout),
    headers: { 'Accept': 'application/json', ...config.headers },
  });
  if (!response.ok) {
    throw new NetworkError(`Failed to load ${path}: ${response.statusText}`, url, response.status);
  }
  return response.json();
}
```

### config.ts

```typescript
const VERSION = '__VERSION__'; // Replaced at build time by tsup
const DEFAULT_CONFIG: ConfigOptions = {
  baseURL: `https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@${VERSION}/dist`,
  timeout: 5000,
  headers: {},
  cacheSize: 50,
};
```

### loaders.ts (pattern for all functions)

```typescript
async function getStatesOfCountry(countryCode: string): Promise<IState[]> {
  if (!countryCode) return [];
  const key = `states/${countryCode.toUpperCase()}.json`;
  const cached = cache.get(key);
  if (cached) return cached as IState[];
  try {
    const data = await fetchJSON<IState[]>(`/data/${key}`);
    cache.set(key, data);
    return data;
  } catch {
    return [];
  }
}
```

### cache.ts

Map-based LRU. On `get()`, move entry to end (most recently used). On `set()`, evict oldest if over max size.

### Version Injection

tsup `define` option replaces `__VERSION__` at build time:
```typescript
// tsup.config.ts
define: { '__VERSION__': JSON.stringify(require('./package.json').version) }
```

## Data Generation

`scripts/generate-data.cjs` reads from the server package's `src/data/` directory and flattens:

| Server path | Browser path |
|---|---|
| `countries.json` | `countries.json` |
| `{CountryName-ISO2}/meta.json` | `country/{ISO2}.json` |
| `{CountryName-ISO2}/states.json` | `states/{ISO2}.json` |
| `{CountryName-ISO2}/{StateName-CODE}/cities.json` | `cities/{ISO2}-{CODE}.json` |

The script accepts a `--source` argument pointing to the server package data directory.

## Build

- **Tool:** tsup
- **Formats:** ESM + CJS
- **Types:** `.d.ts` + `.d.cts`
- **onSuccess:** Copies `src/data/` to `dist/data/`
- **No UMD in v1** (YAGNI)

## Testing

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest + `vi.fn()` mocked fetch | All functions, cache behavior, config, error paths |
| Integration | Vitest + local HTTP server | End-to-end with real data files |

**Target:** 85%+ coverage. No Playwright in v1 — package uses standard `fetch` which Vitest tests adequately.

## CI/CD Workflows

All three follow the same patterns as `countrystatecity-countries`:

- **ci.yml:** Build, test, typecheck on push/PR
- **publish.yml:** Detect version change → npm publish → GitHub release
- **update-data.yml:** Weekly — pull from upstream database, regenerate flat data, create PR if changes

## Bundle Size Targets

| Asset | Gzipped |
|---|---|
| JS bundle (index.js) | ~5KB |
| countries.json | ~30KB |
| Average state file | ~15KB |
| Average city file | ~25KB |
| **Typical usage** (country + 1 state + 1 city) | **~75KB** |

## Out of Scope for v1

- UMD/IIFE bundle (script tag usage)
- Offline/Service Worker support
- Automatic retry logic
- React hooks package
- Fuzzy search
- Streaming API

## Success Criteria

- Works in Chrome, Firefox, Safari, Edge without configuration
- API is 1:1 compatible with `@countrystatecity/countries`
- JS bundle < 10KB gzipped
- 85%+ test coverage
- Resolves GitHub Issue #1 (getCountryByCode returns null in browser)
