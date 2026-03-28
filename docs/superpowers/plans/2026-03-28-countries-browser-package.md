# @countrystatecity/countries-browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a browser-native package that provides the same countries/states/cities API as the server package, using fetch + jsDelivr CDN instead of Node.js fs.

**Architecture:** Thin fetch wrapper over jsDelivr CDN. LRU in-memory cache. Flat data structure (ISO-code paths instead of human-readable directory names). Types copied from server package.

**Tech Stack:** TypeScript, tsup (ESM + CJS), Vitest, jsDelivr CDN

---

## File Map

All paths relative to `/Users/darshan/Personal/projects/csc-ecosystem/countrystatecity-countries-browser/`.

| File | Responsibility |
|---|---|
| `src/types.ts` | All TypeScript interfaces (ICountry, IState, ICity, etc.) |
| `src/errors.ts` | NetworkError, TimeoutError classes |
| `src/cache.ts` | LRU cache (Map-based, configurable max size) |
| `src/config.ts` | Configuration store (baseURL, timeout, headers, cacheSize) |
| `src/fetcher.ts` | fetchJSON() — single fetch wrapper with timeout + error handling |
| `src/loaders.ts` | All data loading functions (getCountries, getStatesOfCountry, etc.) |
| `src/utils.ts` | Utility functions (isValidCountryCode, searchCitiesByName, etc.) |
| `src/index.ts` | Public API re-exports |
| `scripts/generate-data.cjs` | Transforms server package data into flat CDN structure |
| `tests/unit/cache.test.ts` | LRU cache behavior |
| `tests/unit/config.test.ts` | Configuration management |
| `tests/unit/fetcher.test.ts` | Fetch wrapper, timeout, errors |
| `tests/unit/loaders.test.ts` | All loader functions |
| `tests/unit/utils.test.ts` | Utility functions |
| `tests/integration/api.test.ts` | End-to-end with local data files |

---

### Task 1: Initialize Repository and Project Structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1: Create the repository directory**

```bash
mkdir -p /Users/darshan/Personal/projects/csc-ecosystem/countrystatecity-countries-browser
cd /Users/darshan/Personal/projects/csc-ecosystem/countrystatecity-countries-browser
git init
```

- [ ] **Step 2: Create package.json**

Create `package.json`:

```json
{
  "name": "@countrystatecity/countries-browser",
  "version": "1.0.0",
  "description": "Browser-native countries, states, and cities data with jsDelivr CDN and lazy loading",
  "keywords": [
    "country-state-city",
    "countries",
    "states",
    "cities",
    "browser",
    "frontend",
    "react",
    "vue",
    "svelte",
    "vite",
    "cdn",
    "jsdelivr",
    "lazy-loading",
    "typescript"
  ],
  "author": "dr5hn",
  "license": "ODbL-1.0",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dr5hn/countrystatecity-countries-browser.git"
  },
  "homepage": "https://github.com/dr5hn/countrystatecity-countries-browser#readme",
  "bugs": {
    "url": "https://github.com/dr5hn/countrystatecity-countries-browser/issues"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./data/*": "./dist/data/*"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "generate-data": "node scripts/generate-data.cjs"
  },
  "devDependencies": {
    "@types/node": "^20.19.19",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3",
    "vitest": "^4.0.16"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Note: `"lib": ["ES2020", "DOM"]` is the key difference from the server package — we need DOM types for `fetch`, `AbortSignal`, `Response`, etc.

- [ ] **Step 4: Create tsup.config.ts**

Create `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';
import { readFileSync, copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  bundle: true,
  define: {
    '__VERSION__': JSON.stringify(pkg.version),
  },
  onSuccess: async () => {
    const copyDir = (src: string, dest: string) => {
      mkdirSync(dest, { recursive: true });
      const entries = readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          copyFileSync(srcPath, destPath);
        }
      }
    };
    copyDir('src/data', 'dist/data');
    console.log('✓ Data files copied to dist/data');
  },
});
```

- [ ] **Step 5: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Create .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 7: Create LICENSE**

Copy the ODbL-1.0 license from the server package:

```bash
cp /Users/darshan/Personal/projects/csc-ecosystem/countrystatecity-countries/LICENSE .
```

- [ ] **Step 8: Install dependencies and verify**

```bash
npm install
npx tsc --noEmit  # Should succeed (no source files yet, but config is valid)
```

- [ ] **Step 9: Create directory structure**

```bash
mkdir -p src scripts tests/unit tests/integration
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: initialize project with build tooling"
```

---

### Task 2: Types and Error Classes

**Files:**
- Create: `src/types.ts`
- Create: `src/errors.ts`
- Test: `tests/unit/errors.test.ts`

- [ ] **Step 1: Write the failing test for error classes**

Create `tests/unit/errors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { NetworkError, TimeoutError } from '../../src/errors';

describe('NetworkError', () => {
  it('stores url and statusCode', () => {
    const error = new NetworkError('Failed to load', 'https://cdn.example.com/data.json', 404);
    expect(error.message).toBe('Failed to load');
    expect(error.url).toBe('https://cdn.example.com/data.json');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NetworkError');
    expect(error).toBeInstanceOf(Error);
  });

  it('works without statusCode', () => {
    const error = new NetworkError('Network failed', 'https://cdn.example.com/data.json');
    expect(error.statusCode).toBeUndefined();
  });
});

describe('TimeoutError', () => {
  it('stores timeout value', () => {
    const error = new TimeoutError('Request timed out', 5000);
    expect(error.message).toBe('Request timed out');
    expect(error.timeout).toBe(5000);
    expect(error.name).toBe('TimeoutError');
    expect(error).toBeInstanceOf(Error);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/errors.test.ts
```

Expected: FAIL — cannot find `../../src/errors`

- [ ] **Step 3: Create src/types.ts**

Create `src/types.ts`:

```typescript
/**
 * TypeScript interfaces for @countrystatecity/countries-browser
 * Copied from @countrystatecity/countries for API compatibility
 */

/**
 * Timezone information for a country
 */
export interface ITimezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
}

/**
 * Translations for country/state/city names
 */
export interface ITranslations {
  [languageCode: string]: string;
}

/**
 * Basic country information (lightweight)
 */
export interface ICountry {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  numeric_code: string;
  phonecode: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  region: string;
  subregion: string;
  nationality: string;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
}

/**
 * Full country metadata including timezones and translations
 */
export interface ICountryMeta extends ICountry {
  timezones: ITimezone[];
  translations: ITranslations;
}

/**
 * State/Province information
 */
export interface IState {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  fips_code: string | null;
  iso2: string;
  type: string | null;
  latitude: string | null;
  longitude: string | null;
  native: string | null;
  timezone: string | null;
  translations: ITranslations;
}

/**
 * City information
 */
export interface ICity {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: string;
  longitude: string;
  native: string | null;
  timezone: string | null;
  translations: ITranslations;
}

/**
 * Browser-specific configuration options
 */
export interface ConfigOptions {
  /** Override jsDelivr default CDN URL */
  baseURL?: string;
  /** Fetch timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Custom fetch headers */
  headers?: Record<string, string>;
  /** LRU cache max entries (default: 50) */
  cacheSize?: number;
}
```

- [ ] **Step 4: Create src/errors.ts**

Create `src/errors.ts`:

```typescript
/**
 * Error classes for @countrystatecity/countries-browser
 */

/**
 * Thrown when a fetch request fails (non-2xx response or network error)
 */
export class NetworkError extends Error {
  public readonly url: string;
  public readonly statusCode?: number;

  constructor(message: string, url: string, statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
    this.url = url;
    this.statusCode = statusCode;
  }
}

/**
 * Thrown when a fetch request exceeds the configured timeout
 */
export class TimeoutError extends Error {
  public readonly timeout: number;

  constructor(message: string, timeout: number) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/unit/errors.test.ts
```

Expected: PASS (2 describe blocks, 3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/errors.ts tests/unit/errors.test.ts
git commit -m "feat: add types and error classes"
```

---

### Task 3: LRU Cache

**Files:**
- Create: `src/cache.ts`
- Test: `tests/unit/cache.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/cache.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../../src/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string, string[]>;

  beforeEach(() => {
    cache = new LRUCache<string, string[]>(3);
  });

  it('returns undefined for cache miss', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves values', () => {
    cache.set('key1', ['a', 'b']);
    expect(cache.get('key1')).toEqual(['a', 'b']);
  });

  it('evicts oldest entry when over max size', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.set('c', ['3']);
    cache.set('d', ['4']); // Should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toEqual(['2']);
    expect(cache.get('d')).toEqual(['4']);
  });

  it('moves accessed entry to most recent on get', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.set('c', ['3']);
    cache.get('a'); // 'a' is now most recently used
    cache.set('d', ['4']); // Should evict 'b', not 'a'
    expect(cache.get('a')).toEqual(['1']);
    expect(cache.get('b')).toBeUndefined();
  });

  it('overwrites existing key without growing size', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.set('c', ['3']);
    cache.set('a', ['updated']); // Overwrite, should not evict
    expect(cache.get('a')).toEqual(['updated']);
    expect(cache.get('b')).toEqual(['2']);
    expect(cache.get('c')).toEqual(['3']);
  });

  it('clears all entries', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/cache.test.ts
```

Expected: FAIL — cannot find `../../src/cache`

- [ ] **Step 3: Implement LRU cache**

Create `src/cache.ts`:

```typescript
/**
 * LRU (Least Recently Used) cache for @countrystatecity/countries-browser
 * Uses Map iteration order (insertion order) for O(1) eviction
 */

export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Get a value from cache, marking it as most recently used
   * @returns The cached value, or undefined if not found
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) return undefined;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Store a value in cache, evicting the oldest entry if at capacity
   */
  set(key: K, value: V): void {
    this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value!;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/cache.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cache.ts tests/unit/cache.test.ts
git commit -m "feat: add LRU cache"
```

---

### Task 4: Configuration Module

**Files:**
- Create: `src/config.ts`
- Test: `tests/unit/config.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/config.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, configure, resetConfiguration } from '../../src/config';

describe('config', () => {
  beforeEach(() => {
    resetConfiguration();
  });

  it('returns default configuration', () => {
    const config = getConfig();
    expect(config.baseURL).toContain('cdn.jsdelivr.net');
    expect(config.baseURL).toContain('@countrystatecity/countries-browser');
    expect(config.timeout).toBe(5000);
    expect(config.headers).toEqual({});
    expect(config.cacheSize).toBe(50);
  });

  it('includes version in default baseURL', () => {
    const config = getConfig();
    // Version should be a semver string in the URL
    expect(config.baseURL).toMatch(/@countrystatecity\/countries-browser@\d+\.\d+\.\d+/);
  });

  it('overrides baseURL', () => {
    configure({ baseURL: 'https://my-cdn.com/data' });
    expect(getConfig().baseURL).toBe('https://my-cdn.com/data');
  });

  it('overrides timeout', () => {
    configure({ timeout: 10000 });
    expect(getConfig().timeout).toBe(10000);
    // Other defaults should remain
    expect(getConfig().baseURL).toContain('cdn.jsdelivr.net');
  });

  it('overrides headers', () => {
    configure({ headers: { 'X-Custom': 'value' } });
    expect(getConfig().headers).toEqual({ 'X-Custom': 'value' });
  });

  it('overrides cacheSize', () => {
    configure({ cacheSize: 100 });
    expect(getConfig().cacheSize).toBe(100);
  });

  it('merges partial overrides with defaults', () => {
    configure({ timeout: 3000 });
    const config = getConfig();
    expect(config.timeout).toBe(3000);
    expect(config.baseURL).toContain('cdn.jsdelivr.net');
    expect(config.cacheSize).toBe(50);
  });

  it('resets to defaults', () => {
    configure({ baseURL: 'https://custom.com', timeout: 999 });
    resetConfiguration();
    const config = getConfig();
    expect(config.baseURL).toContain('cdn.jsdelivr.net');
    expect(config.timeout).toBe(5000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/config.test.ts
```

Expected: FAIL — cannot find `../../src/config`

- [ ] **Step 3: Implement configuration module**

Create `src/config.ts`:

```typescript
/**
 * Configuration management for @countrystatecity/countries-browser
 */

import type { ConfigOptions } from './types';

declare const __VERSION__: string;

interface ResolvedConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  cacheSize: number;
}

const DEFAULT_CONFIG: ResolvedConfig = {
  baseURL: `https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@${__VERSION__}/dist`,
  timeout: 5000,
  headers: {},
  cacheSize: 50,
};

let currentConfig: ResolvedConfig = { ...DEFAULT_CONFIG };

/**
 * Get the current resolved configuration
 */
export function getConfig(): ResolvedConfig {
  return currentConfig;
}

/**
 * Override default configuration options
 * @param options - Partial configuration to merge with defaults
 */
export function configure(options: ConfigOptions): void {
  currentConfig = { ...currentConfig, ...options } as ResolvedConfig;
}

/**
 * Reset configuration to defaults
 */
export function resetConfiguration(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/config.test.ts
```

Expected: PASS (8 tests)

Note: `__VERSION__` will be `undefined` in tests since tsup `define` only runs at build time. The tests check for the pattern in the URL, not the exact version. If tests fail because `__VERSION__` is literally `undefined`, add to `vitest.config.ts`:

```typescript
define: {
  '__VERSION__': JSON.stringify('0.0.0-test'),
},
```

- [ ] **Step 5: Commit**

```bash
git add src/config.ts tests/unit/config.test.ts vitest.config.ts
git commit -m "feat: add configuration module"
```

---

### Task 5: Fetch Wrapper

**Files:**
- Create: `src/fetcher.ts`
- Test: `tests/unit/fetcher.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/fetcher.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJSON } from '../../src/fetcher';
import { resetConfiguration, configure } from '../../src/config';
import { NetworkError } from '../../src/errors';

describe('fetchJSON', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses JSON', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const result = await fetchJSON('/data/countries.json');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.test.com/data/countries.json',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Accept': 'application/json' }),
      }),
    );
  });

  it('throws NetworkError on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }));

    await expect(fetchJSON('/data/missing.json'))
      .rejects
      .toThrow(NetworkError);
  });

  it('includes status code in NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }));

    try {
      await fetchJSON('/data/broken.json');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
      expect((error as NetworkError).statusCode).toBe(500);
      expect((error as NetworkError).url).toBe('https://cdn.test.com/data/broken.json');
    }
  });

  it('passes custom headers from config', async () => {
    configure({ baseURL: 'https://cdn.test.com', headers: { 'X-Api-Key': 'secret' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }));

    await fetchJSON('/data/countries.json');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Api-Key': 'secret' }),
      }),
    );
  });

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(fetchJSON('/data/countries.json'))
      .rejects
      .toThrow(TypeError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/fetcher.test.ts
```

Expected: FAIL — cannot find `../../src/fetcher`

- [ ] **Step 3: Implement fetch wrapper**

Create `src/fetcher.ts`:

```typescript
/**
 * Fetch wrapper for @countrystatecity/countries-browser
 * Handles timeout, error classification, and header management
 */

import { getConfig } from './config';
import { NetworkError } from './errors';

/**
 * Fetch a JSON resource from the configured CDN
 * @param path - Path relative to baseURL (e.g., '/data/countries.json')
 * @returns Parsed JSON data
 * @throws NetworkError on non-2xx response
 * @throws TimeoutError if request exceeds configured timeout
 */
export async function fetchJSON<T>(path: string): Promise<T> {
  const config = getConfig();
  const url = `${config.baseURL}${path}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(config.timeout),
    headers: {
      'Accept': 'application/json',
      ...config.headers,
    },
  });

  if (!response.ok) {
    throw new NetworkError(
      `Failed to load ${path}: ${response.statusText}`,
      url,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/fetcher.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/fetcher.ts tests/unit/fetcher.test.ts
git commit -m "feat: add fetch wrapper with timeout and error handling"
```

---

### Task 6: Loader Functions

**Files:**
- Create: `src/loaders.ts`
- Test: `tests/unit/loaders.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/loaders.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getCityById,
  getAllCitiesOfCountry,
  clearCache,
} from '../../src/loaders';
import { configure, resetConfiguration } from '../../src/config';

// Mock fetch globally
function mockFetch(responses: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
  }));
}

const mockCountries = [
  { id: 1, name: 'TestCountry', iso2: 'TC', iso3: 'TST', numeric_code: '001', phonecode: '1', capital: 'TestCity', currency: 'TCD', currency_name: 'Test Dollar', currency_symbol: '$', tld: '.tc', native: 'TestCountry', region: 'TestRegion', subregion: 'TestSub', nationality: 'Tester', latitude: '0.00', longitude: '0.00', emoji: '🏳️', emojiU: 'U+1F3F3' },
];

const mockMeta = {
  ...mockCountries[0],
  timezones: [{ zoneName: 'Test/Zone', gmtOffset: 0, gmtOffsetName: 'UTC+00:00', abbreviation: 'TZ', tzName: 'Test Zone' }],
  translations: { en: 'TestCountry' },
};

const mockStates = [
  { id: 10, name: 'TestState', country_id: 1, country_code: 'TC', fips_code: null, iso2: 'TS', type: 'state', latitude: '1.00', longitude: '1.00', native: null, timezone: 'Test/Zone', translations: {} },
  { id: 11, name: 'OtherState', country_id: 1, country_code: 'TC', fips_code: null, iso2: 'OS', type: 'state', latitude: '2.00', longitude: '2.00', native: null, timezone: 'Test/Zone', translations: {} },
];

const mockCities = [
  { id: 100, name: 'TestVille', state_id: 10, state_code: 'TS', country_id: 1, country_code: 'TC', latitude: '1.10', longitude: '1.10', native: null, timezone: 'Test/Zone', translations: {} },
  { id: 101, name: 'OtherVille', state_id: 10, state_code: 'TS', country_id: 1, country_code: 'TC', latitude: '1.20', longitude: '1.20', native: null, timezone: 'Test/Zone', translations: {} },
];

const mockOtherCities = [
  { id: 200, name: 'AnotherCity', state_id: 11, state_code: 'OS', country_id: 1, country_code: 'TC', latitude: '2.10', longitude: '2.10', native: null, timezone: 'Test/Zone', translations: {} },
];

describe('loaders', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    clearCache();
    vi.restoreAllMocks();
    mockFetch({
      'countries.json': mockCountries,
      'country/TC.json': mockMeta,
      'states/TC.json': mockStates,
      'cities/TC-TS.json': mockCities,
      'cities/TC-OS.json': mockOtherCities,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCountries', () => {
    it('returns list of countries', async () => {
      const result = await getCountries();
      expect(result).toEqual(mockCountries);
    });

    it('caches result on second call', async () => {
      await getCountries();
      await getCountries();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCountryByCode', () => {
    it('returns country meta for valid code', async () => {
      const result = await getCountryByCode('TC');
      expect(result).toEqual(mockMeta);
    });

    it('returns null for invalid code', async () => {
      const result = await getCountryByCode('XX');
      expect(result).toBeNull();
    });

    it('returns null for empty string', async () => {
      const result = await getCountryByCode('');
      expect(result).toBeNull();
    });
  });

  describe('getStatesOfCountry', () => {
    it('returns states for valid country code', async () => {
      const result = await getStatesOfCountry('TC');
      expect(result).toEqual(mockStates);
    });

    it('returns empty array for invalid code', async () => {
      const result = await getStatesOfCountry('XX');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', async () => {
      const result = await getStatesOfCountry('');
      expect(result).toEqual([]);
    });
  });

  describe('getStateByCode', () => {
    it('returns state for valid codes', async () => {
      const result = await getStateByCode('TC', 'TS');
      expect(result?.name).toBe('TestState');
    });

    it('returns null for invalid state code', async () => {
      const result = await getStateByCode('TC', 'ZZ');
      expect(result).toBeNull();
    });
  });

  describe('getCitiesOfState', () => {
    it('returns cities for valid codes', async () => {
      const result = await getCitiesOfState('TC', 'TS');
      expect(result).toEqual(mockCities);
    });

    it('returns empty array for invalid codes', async () => {
      const result = await getCitiesOfState('XX', 'YY');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty strings', async () => {
      const result = await getCitiesOfState('', '');
      expect(result).toEqual([]);
    });
  });

  describe('getCityById', () => {
    it('returns city for valid id', async () => {
      const result = await getCityById('TC', 'TS', 100);
      expect(result?.name).toBe('TestVille');
    });

    it('returns null for invalid id', async () => {
      const result = await getCityById('TC', 'TS', 999);
      expect(result).toBeNull();
    });
  });

  describe('getAllCitiesOfCountry', () => {
    it('loads cities from all states', async () => {
      const result = await getAllCitiesOfCountry('TC');
      expect(result).toHaveLength(3); // 2 from TS + 1 from OS
      expect(result.map(c => c.name)).toContain('TestVille');
      expect(result.map(c => c.name)).toContain('AnotherCity');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/loaders.test.ts
```

Expected: FAIL — cannot find `../../src/loaders`

- [ ] **Step 3: Implement loader functions**

Create `src/loaders.ts`:

```typescript
/**
 * Data loaders for @countrystatecity/countries-browser
 * Uses fetch API to load JSON from jsDelivr CDN with LRU caching
 */

import type { ICountry, ICountryMeta, IState, ICity } from './types';
import { getConfig } from './config';
import { fetchJSON } from './fetcher';
import { LRUCache } from './cache';

let cache = new LRUCache<string, unknown>(getConfig().cacheSize);

/**
 * Reinitialize cache (called when config changes or manually)
 */
export function clearCache(): void {
  cache = new LRUCache<string, unknown>(getConfig().cacheSize);
}

/**
 * Load JSON with caching
 */
async function loadCached<T>(key: string): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;
  const data = await fetchJSON<T>(`/data/${key}`);
  cache.set(key, data);
  return data;
}

/**
 * Get lightweight list of all countries
 * @returns Array of countries (basic info only)
 * @bundle ~30KB gzipped - Loads countries.json from CDN
 */
export async function getCountries(): Promise<ICountry[]> {
  return loadCached<ICountry[]>('countries.json');
}

/**
 * Get full country metadata including timezones and translations
 * @param countryCode - ISO2 country code (e.g., 'US', 'IN')
 * @returns Full country metadata or null if not found
 */
export async function getCountryByCode(countryCode: string): Promise<ICountryMeta | null> {
  if (!countryCode) return null;
  try {
    return await loadCached<ICountryMeta>(`country/${countryCode.toUpperCase()}.json`);
  } catch {
    return null;
  }
}

/**
 * Get all states/provinces for a specific country
 * @param countryCode - ISO2 country code
 * @returns Array of states or empty array if not found
 */
export async function getStatesOfCountry(countryCode: string): Promise<IState[]> {
  if (!countryCode) return [];
  try {
    return await loadCached<IState[]>(`states/${countryCode.toUpperCase()}.json`);
  } catch {
    return [];
  }
}

/**
 * Get specific state by code
 * @param countryCode - ISO2 country code
 * @param stateCode - State code (e.g., 'CA', 'TX')
 * @returns State object or null if not found
 */
export async function getStateByCode(
  countryCode: string,
  stateCode: string,
): Promise<IState | null> {
  const states = await getStatesOfCountry(countryCode);
  return states.find((s) => s.iso2 === stateCode) || null;
}

/**
 * Get all cities in a specific state
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns Array of cities or empty array if not found
 */
export async function getCitiesOfState(
  countryCode: string,
  stateCode: string,
): Promise<ICity[]> {
  if (!countryCode || !stateCode) return [];
  try {
    return await loadCached<ICity[]>(
      `cities/${countryCode.toUpperCase()}-${stateCode.toUpperCase()}.json`,
    );
  } catch {
    return [];
  }
}

/**
 * Get specific city by ID
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param cityId - City ID
 * @returns City object or null if not found
 */
export async function getCityById(
  countryCode: string,
  stateCode: string,
  cityId: number,
): Promise<ICity | null> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  return cities.find((c) => c.id === cityId) || null;
}

/**
 * Get ALL cities in an entire country
 * WARNING: Loads all state city files — can be large
 * @param countryCode - ISO2 country code
 * @returns Array of all cities in country
 */
export async function getAllCitiesOfCountry(countryCode: string): Promise<ICity[]> {
  const states = await getStatesOfCountry(countryCode);
  const allCities: ICity[] = [];
  for (const state of states) {
    const cities = await getCitiesOfState(countryCode, state.iso2);
    allCities.push(...cities);
  }
  return allCities;
}

/**
 * Get every city globally
 * WARNING: MASSIVE data — loads ALL city files from CDN
 * @returns Array of all cities worldwide
 */
export async function getAllCitiesInWorld(): Promise<ICity[]> {
  const countries = await getCountries();
  const allCities: ICity[] = [];
  for (const country of countries) {
    const cities = await getAllCitiesOfCountry(country.iso2);
    allCities.push(...cities);
  }
  return allCities;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/loaders.test.ts
```

Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/loaders.ts tests/unit/loaders.test.ts
git commit -m "feat: add loader functions with CDN fetch and caching"
```

---

### Task 7: Utility Functions

**Files:**
- Create: `src/utils.ts`
- Test: `tests/unit/utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/utils.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getTimezoneForCity,
  getCountryTimezones,
} from '../../src/utils';
import { configure, resetConfiguration } from '../../src/config';
import { clearCache } from '../../src/loaders';

// Reuse mock setup from loaders test
function mockFetch(responses: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
  }));
}

const mockCountries = [
  { id: 1, name: 'Testland', iso2: 'TL', iso3: 'TLD', numeric_code: '001', phonecode: '1', capital: 'TestCity', currency: 'TLD', currency_name: 'Test Dollar', currency_symbol: '$', tld: '.tl', native: 'Testland', region: 'Test', subregion: 'Test', nationality: 'Tester', latitude: '0.00', longitude: '0.00', emoji: '🏳️', emojiU: 'U+1F3F3' },
];

const mockMeta = {
  ...mockCountries[0],
  timezones: [
    { zoneName: 'Test/North', gmtOffset: 0, gmtOffsetName: 'UTC+00:00', abbreviation: 'TN', tzName: 'Test North' },
    { zoneName: 'Test/South', gmtOffset: 3600, gmtOffsetName: 'UTC+01:00', abbreviation: 'TS', tzName: 'Test South' },
  ],
  translations: { en: 'Testland' },
};

const mockStates = [
  { id: 10, name: 'Alpha State', country_id: 1, country_code: 'TL', fips_code: null, iso2: 'AS', type: 'state', latitude: '1.00', longitude: '1.00', native: null, timezone: 'Test/North', translations: {} },
];

const mockCities = [
  { id: 100, name: 'Springfield', state_id: 10, state_code: 'AS', country_id: 1, country_code: 'TL', latitude: '1.10', longitude: '1.10', native: null, timezone: 'Test/North', translations: {} },
  { id: 101, name: 'Springville', state_id: 10, state_code: 'AS', country_id: 1, country_code: 'TL', latitude: '1.20', longitude: '1.20', native: null, timezone: 'Test/South', translations: {} },
  { id: 102, name: 'Oaktown', state_id: 10, state_code: 'AS', country_id: 1, country_code: 'TL', latitude: '1.30', longitude: '1.30', native: null, timezone: 'Test/North', translations: {} },
];

describe('utils', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    clearCache();
    vi.restoreAllMocks();
    mockFetch({
      'countries.json': mockCountries,
      'country/TL.json': mockMeta,
      'states/TL.json': mockStates,
      'cities/TL-AS.json': mockCities,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidCountryCode', () => {
    it('returns true for valid code', async () => {
      expect(await isValidCountryCode('TL')).toBe(true);
    });

    it('returns false for invalid code', async () => {
      expect(await isValidCountryCode('ZZ')).toBe(false);
    });
  });

  describe('isValidStateCode', () => {
    it('returns true for valid state code', async () => {
      expect(await isValidStateCode('TL', 'AS')).toBe(true);
    });

    it('returns false for invalid state code', async () => {
      expect(await isValidStateCode('TL', 'ZZ')).toBe(false);
    });
  });

  describe('searchCitiesByName', () => {
    it('finds cities by partial name match (case-insensitive)', async () => {
      const results = await searchCitiesByName('TL', 'AS', 'spring');
      expect(results).toHaveLength(2);
      expect(results.map(c => c.name)).toEqual(['Springfield', 'Springville']);
    });

    it('returns empty array when no match', async () => {
      const results = await searchCitiesByName('TL', 'AS', 'nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getCountryNameByCode', () => {
    it('returns country name for valid code', async () => {
      expect(await getCountryNameByCode('TL')).toBe('Testland');
    });

    it('returns null for invalid code', async () => {
      expect(await getCountryNameByCode('ZZ')).toBeNull();
    });
  });

  describe('getStateNameByCode', () => {
    it('returns state name for valid codes', async () => {
      expect(await getStateNameByCode('TL', 'AS')).toBe('Alpha State');
    });

    it('returns null for invalid codes', async () => {
      expect(await getStateNameByCode('TL', 'ZZ')).toBeNull();
    });
  });

  describe('getTimezoneForCity', () => {
    it('returns timezone for valid city', async () => {
      expect(await getTimezoneForCity('TL', 'AS', 'Springfield')).toBe('Test/North');
    });

    it('returns null for unknown city', async () => {
      expect(await getTimezoneForCity('TL', 'AS', 'Unknown')).toBeNull();
    });
  });

  describe('getCountryTimezones', () => {
    it('returns all timezone names for country', async () => {
      const timezones = await getCountryTimezones('TL');
      expect(timezones).toEqual(['Test/North', 'Test/South']);
    });

    it('returns empty array for invalid country', async () => {
      const timezones = await getCountryTimezones('ZZ');
      expect(timezones).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/utils.test.ts
```

Expected: FAIL — cannot find `../../src/utils`

- [ ] **Step 3: Implement utility functions**

Create `src/utils.ts`:

```typescript
/**
 * Utility functions for @countrystatecity/countries-browser
 */

import type { ICountry, IState, ICity } from './types';
import { getCountries, getStatesOfCountry, getCitiesOfState, getCountryByCode } from './loaders';

/**
 * Validate if a country code exists
 * @param countryCode - ISO2 country code
 * @returns Whether the country code is valid
 */
export async function isValidCountryCode(countryCode: string): Promise<boolean> {
  const countries = await getCountries();
  return countries.some((c) => c.iso2 === countryCode);
}

/**
 * Validate if a state code exists in a country
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns Whether the state code is valid for the given country
 */
export async function isValidStateCode(
  countryCode: string,
  stateCode: string,
): Promise<boolean> {
  const states = await getStatesOfCountry(countryCode);
  return states.some((s) => s.iso2 === stateCode);
}

/**
 * Search cities by name (partial match, case-insensitive)
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param searchTerm - Search term
 * @returns Array of matching cities
 */
export async function searchCitiesByName(
  countryCode: string,
  stateCode: string,
  searchTerm: string,
): Promise<ICity[]> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const lowerTerm = searchTerm.toLowerCase();
  return cities.filter((city) => city.name.toLowerCase().includes(lowerTerm));
}

/**
 * Get country name from ISO2 code
 * @param countryCode - ISO2 country code
 * @returns Country name or null if not found
 */
export async function getCountryNameByCode(countryCode: string): Promise<string | null> {
  const countries = await getCountries();
  const country = countries.find((c) => c.iso2 === countryCode);
  return country ? country.name : null;
}

/**
 * Get state name from codes
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns State name or null if not found
 */
export async function getStateNameByCode(
  countryCode: string,
  stateCode: string,
): Promise<string | null> {
  const states = await getStatesOfCountry(countryCode);
  const state = states.find((s) => s.iso2 === stateCode);
  return state ? state.name : null;
}

/**
 * Get timezone for a specific city
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param cityName - City name (exact match)
 * @returns Timezone string or null if not found
 */
export async function getTimezoneForCity(
  countryCode: string,
  stateCode: string,
  cityName: string,
): Promise<string | null> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const city = cities.find((c) => c.name === cityName);
  return city ? city.timezone : null;
}

/**
 * Get all timezone names for a country
 * @param countryCode - ISO2 country code
 * @returns Array of IANA timezone names
 */
export async function getCountryTimezones(countryCode: string): Promise<string[]> {
  const meta = await getCountryByCode(countryCode);
  if (!meta || !meta.timezones) return [];
  return meta.timezones.map((tz) => tz.zoneName);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/utils.test.ts
```

Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils.ts tests/unit/utils.test.ts
git commit -m "feat: add utility functions"
```

---

### Task 8: Public API Entry Point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create the public API**

Create `src/index.ts`:

```typescript
/**
 * @countrystatecity/countries-browser
 * Browser-native countries, states, and cities data with jsDelivr CDN
 */

// Export all types
export type {
  ICountry,
  ICountryMeta,
  IState,
  ICity,
  ITimezone,
  ITranslations,
  ConfigOptions,
} from './types';

// Export error classes
export { NetworkError } from './errors';
export { TimeoutError } from './errors';

// Export configuration
export { configure, resetConfiguration } from './config';

// Export cache management
export { clearCache } from './loaders';

// Export all loaders
export {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getCityById,
  getAllCitiesOfCountry,
  getAllCitiesInWorld,
} from './loaders';

// Export utilities
export {
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getTimezoneForCity,
  getCountryTimezones,
} from './utils';

// Default export for convenience
export { getCountries as default } from './loaders';
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: Build succeeds, creates `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`

- [ ] **Step 3: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass (across all test files)

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: add public API entry point"
```

---

### Task 9: Data Generation Script

**Files:**
- Create: `scripts/generate-data.cjs`

- [ ] **Step 1: Create the data generation script**

Create `scripts/generate-data.cjs`:

```javascript
#!/usr/bin/env node
/**
 * Data generation script for @countrystatecity/countries-browser
 * Reads the server package's nested data and flattens it for CDN access
 *
 * Usage:
 *   node scripts/generate-data.cjs <server-data-dir>
 *   node scripts/generate-data.cjs ../countrystatecity-countries/src/data
 */

const fs = require('fs');
const path = require('path');

function generateBrowserData(sourceDir, outputDir) {
  console.log(`📥 Reading server data from: ${sourceDir}`);

  const dataDir = outputDir;
  if (fs.existsSync(dataDir)) {
    console.log('🗑️  Removing existing data directory...');
    fs.rmSync(dataDir, { recursive: true });
  }

  // Create output directories
  fs.mkdirSync(path.join(dataDir, 'country'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'states'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'cities'), { recursive: true });

  // 1. Copy countries.json as-is
  const countriesSource = path.join(sourceDir, 'countries.json');
  if (!fs.existsSync(countriesSource)) {
    console.error(`❌ Error: countries.json not found at ${countriesSource}`);
    process.exit(1);
  }
  fs.copyFileSync(countriesSource, path.join(dataDir, 'countries.json'));
  const countries = JSON.parse(fs.readFileSync(countriesSource, 'utf-8'));
  console.log(`✓ Copied countries.json (${countries.length} countries)`);

  // 2. Process each country directory
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const countryDirs = entries.filter((e) => e.isDirectory());

  let totalStates = 0;
  let totalCityFiles = 0;

  for (const dir of countryDirs) {
    // Extract ISO2 code from directory name (format: CountryName-ISO2)
    const parts = dir.name.split('-');
    const iso2 = parts[parts.length - 1];
    const countryPath = path.join(sourceDir, dir.name);

    // meta.json -> country/{ISO2}.json
    const metaPath = path.join(countryPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
      fs.copyFileSync(metaPath, path.join(dataDir, 'country', `${iso2}.json`));
    }

    // states.json -> states/{ISO2}.json
    const statesPath = path.join(countryPath, 'states.json');
    if (fs.existsSync(statesPath)) {
      fs.copyFileSync(statesPath, path.join(dataDir, 'states', `${iso2}.json`));
      const states = JSON.parse(fs.readFileSync(statesPath, 'utf-8'));
      totalStates += states.length;
    }

    // {StateName-CODE}/cities.json -> cities/{ISO2}-{CODE}.json
    const stateEntries = fs.readdirSync(countryPath, { withFileTypes: true });
    const stateDirs = stateEntries.filter((e) => e.isDirectory());

    for (const stateDir of stateDirs) {
      const stateParts = stateDir.name.split('-');
      const stateCode = stateParts[stateParts.length - 1];
      const citiesPath = path.join(countryPath, stateDir.name, 'cities.json');

      if (fs.existsSync(citiesPath)) {
        fs.copyFileSync(
          citiesPath,
          path.join(dataDir, 'cities', `${iso2}-${stateCode}.json`),
        );
        totalCityFiles++;
      }
    }
  }

  console.log('\n✅ Browser data generation complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Countries: ${countries.length}`);
  console.log(`   - Country directories processed: ${countryDirs.length}`);
  console.log(`   - Total states: ${totalStates}`);
  console.log(`   - City files created: ${totalCityFiles}`);
  console.log(`   - Output directory: ${dataDir}`);
}

// Main execution
const sourceDir = process.argv[2];
const outputDir = process.argv[3] || path.join(__dirname, '..', 'src', 'data');

if (!sourceDir) {
  console.error('❌ Error: Source data directory required');
  console.log('\nUsage: node scripts/generate-data.cjs <server-data-dir> [output-dir]');
  console.log('\nExample:');
  console.log('  node scripts/generate-data.cjs ../countrystatecity-countries/src/data');
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Error: Source directory not found: ${sourceDir}`);
  process.exit(1);
}

generateBrowserData(sourceDir, outputDir);
```

- [ ] **Step 2: Run the script against the server package data**

```bash
node scripts/generate-data.cjs /Users/darshan/Personal/projects/csc-ecosystem/countrystatecity-countries/src/data
```

Expected: Completes successfully with statistics output. Creates `src/data/` with flat structure.

- [ ] **Step 3: Verify the generated data structure**

```bash
ls src/data/
ls src/data/country/ | head -5
ls src/data/states/ | head -5
ls src/data/cities/ | head -5
# Verify a specific file
cat src/data/country/US.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'], d['iso2'])"
cat src/data/states/US.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'states')"
cat src/data/cities/US-CA.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'cities')"
```

Expected:
- `src/data/countries.json` exists
- `src/data/country/US.json` shows "United States US"
- `src/data/states/US.json` shows 57 states
- `src/data/cities/US-CA.json` shows 1123 cities

- [ ] **Step 4: Verify build includes data files**

```bash
npm run build
ls dist/data/
ls dist/data/country/ | head -3
ls dist/data/cities/ | head -3
```

Expected: `dist/data/` mirrors `src/data/` structure

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-data.cjs
git commit -m "feat: add data generation script"
```

- [ ] **Step 6: Commit generated data separately**

```bash
git add src/data/
git commit -m "chore: add generated browser data files"
```

---

### Task 10: Integration Test

**Files:**
- Create: `tests/integration/api.test.ts`

- [ ] **Step 1: Write the integration test**

This test uses the real generated data files via a local file-based approach instead of mocking fetch.

Create `tests/integration/api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getCityById,
  getAllCitiesOfCountry,
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getCountryTimezones,
  configure,
  resetConfiguration,
  clearCache,
} from '../../src/index';

/**
 * Integration tests using real data files
 * Mocks fetch to read from local dist/data/ directory
 */
describe('integration: real data', () => {
  const dataDir = join(__dirname, '..', '..', 'src', 'data');

  beforeAll(() => {
    // Mock fetch to read from local data files
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      // Extract the data path from the URL
      const dataPath = url.replace(/^.*\/data\//, '');
      const filePath = join(dataDir, dataPath);
      try {
        const content = readFileSync(filePath, 'utf-8');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(JSON.parse(content)),
        });
      } catch {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });
      }
    }));
    configure({ baseURL: 'https://local.test' });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    resetConfiguration();
  });

  beforeEach(() => {
    clearCache();
  });

  it('loads all countries', async () => {
    const countries = await getCountries();
    expect(countries.length).toBe(250);
    expect(countries[0]).toHaveProperty('id');
    expect(countries[0]).toHaveProperty('name');
    expect(countries[0]).toHaveProperty('iso2');
  });

  it('gets US metadata with timezones', async () => {
    const us = await getCountryByCode('US');
    expect(us).not.toBeNull();
    expect(us!.name).toBe('United States');
    expect(us!.iso2).toBe('US');
    expect(us!.timezones).toBeDefined();
    expect(us!.timezones.length).toBeGreaterThan(0);
    expect(us!.translations).toBeDefined();
  });

  it('returns null for nonexistent country', async () => {
    const result = await getCountryByCode('ZZ');
    expect(result).toBeNull();
  });

  it('loads US states', async () => {
    const states = await getStatesOfCountry('US');
    expect(states.length).toBeGreaterThan(50);
    const california = states.find((s) => s.iso2 === 'CA');
    expect(california).toBeDefined();
    expect(california!.name).toBe('California');
  });

  it('gets specific state by code', async () => {
    const state = await getStateByCode('US', 'CA');
    expect(state).not.toBeNull();
    expect(state!.name).toBe('California');
  });

  it('loads California cities', async () => {
    const cities = await getCitiesOfState('US', 'CA');
    expect(cities.length).toBeGreaterThan(1000);
    const la = cities.find((c) => c.name === 'Los Angeles');
    expect(la).toBeDefined();
  });

  it('gets city by ID', async () => {
    const cities = await getCitiesOfState('US', 'CA');
    const firstCity = cities[0];
    const found = await getCityById('US', 'CA', firstCity.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe(firstCity.name);
  });

  it('validates country codes', async () => {
    expect(await isValidCountryCode('US')).toBe(true);
    expect(await isValidCountryCode('IN')).toBe(true);
    expect(await isValidCountryCode('ZZ')).toBe(false);
  });

  it('validates state codes', async () => {
    expect(await isValidStateCode('US', 'CA')).toBe(true);
    expect(await isValidStateCode('US', 'ZZ')).toBe(false);
  });

  it('searches cities by name', async () => {
    const results = await searchCitiesByName('US', 'CA', 'Los Angeles');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Los Angeles');
  });

  it('gets country name by code', async () => {
    expect(await getCountryNameByCode('US')).toBe('United States');
    expect(await getCountryNameByCode('IN')).toBe('India');
    expect(await getCountryNameByCode('ZZ')).toBeNull();
  });

  it('gets state name by code', async () => {
    expect(await getStateNameByCode('US', 'CA')).toBe('California');
    expect(await getStateNameByCode('US', 'ZZ')).toBeNull();
  });

  it('gets country timezones', async () => {
    const timezones = await getCountryTimezones('US');
    expect(timezones.length).toBeGreaterThan(0);
    expect(timezones).toContain('America/New_York');
  });

  it('handles India data', async () => {
    const states = await getStatesOfCountry('IN');
    expect(states.length).toBeGreaterThan(30);
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
npx vitest run tests/integration/api.test.ts
```

Expected: PASS (14 tests)

- [ ] **Step 3: Run all tests together**

```bash
npm test
```

Expected: All unit + integration tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/integration/api.test.ts
git commit -m "test: add integration tests with real data"
```

---

### Task 11: CI/CD Workflows

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/publish.yml`
- Create: `.github/workflows/update-data.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-test-build:
    name: Lint, Test & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm test

      - name: Build package
        run: npm run build

      - name: Check bundle sizes
        run: |
          echo "=== Bundle Sizes ==="
          du -sh dist/index.js
          du -sh dist/index.cjs
          du -sh dist/data/countries.json
          echo "=== Total dist size ==="
          du -sh dist/

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-package
          path: dist/
          retention-days: 7
```

- [ ] **Step 2: Create publish workflow**

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    branches: [main]
    paths:
      - 'package.json'
      - 'src/**'
  workflow_dispatch:

jobs:
  publish:
    name: Publish Package
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Check if version already published
        id: check-version
        run: |
          PACKAGE_NAME="@countrystatecity/countries-browser"
          PACKAGE_VERSION=$(node -p "require('./package.json').version")

          echo "version=$PACKAGE_VERSION" >> $GITHUB_OUTPUT

          if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version 2>/dev/null; then
            echo "published=true" >> $GITHUB_OUTPUT
            echo "Version $PACKAGE_VERSION already published"
          else
            echo "published=false" >> $GITHUB_OUTPUT
            echo "Version $PACKAGE_VERSION not yet published"
          fi

      - name: Publish to NPM
        if: steps.check-version.outputs.published == 'false'
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        if: steps.check-version.outputs.published == 'false'
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.check-version.outputs.version }}
          name: v${{ steps.check-version.outputs.version }}
          body: |
            ## @countrystatecity/countries-browser v${{ steps.check-version.outputs.version }}

            Published to NPM: https://www.npmjs.com/package/@countrystatecity/countries-browser

            ### Installation
            ```bash
            npm install @countrystatecity/countries-browser
            ```

            See the [README](https://github.com/dr5hn/countrystatecity-countries-browser/blob/main/README.md) for usage instructions.
          draft: false
          prerelease: false
```

- [ ] **Step 3: Create data update workflow**

Create `.github/workflows/update-data.yml`:

```yaml
name: Update Data

on:
  schedule:
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  update-data:
    name: Update Browser Data
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Download latest source data
        run: |
          curl -L "https://github.com/dr5hn/countries-states-cities-database/releases/latest/download/json-countries%2Bstates%2Bcities.json.gz" \
            -o /tmp/countries-data.json.gz
          gunzip /tmp/countries-data.json.gz
          echo "Downloaded data size:"
          ls -lh /tmp/countries-data.json

      - name: Generate server-format data (temp)
        run: |
          mkdir -p /tmp/server-data
          node -e "
            const fs = require('fs');
            const path = require('path');
            const rawData = JSON.parse(fs.readFileSync('/tmp/countries-data.json', 'utf-8'));

            const dataDir = '/tmp/server-data';
            // countries.json
            const countriesList = rawData.map(c => ({
              id: c.id, name: c.name, iso2: c.iso2, iso3: c.iso3,
              numeric_code: c.numeric_code, phonecode: c.phonecode, capital: c.capital,
              currency: c.currency, currency_name: c.currency_name, currency_symbol: c.currency_symbol,
              tld: c.tld, native: c.native, region: c.region, subregion: c.subregion,
              nationality: c.nationality, latitude: c.latitude, longitude: c.longitude,
              emoji: c.emoji, emojiU: c.emojiU
            }));
            fs.writeFileSync(path.join(dataDir, 'countries.json'), JSON.stringify(countriesList));

            for (const country of rawData) {
              if (!country.states || country.states.length === 0) continue;
              const dirName = country.name.replace(/\s+/g, '_') + '-' + country.iso2;
              const countryDir = path.join(dataDir, dirName);
              fs.mkdirSync(countryDir, { recursive: true });

              // meta.json
              const meta = { ...countriesList.find(c => c.id === country.id), timezones: country.timezones, translations: country.translations };
              fs.writeFileSync(path.join(countryDir, 'meta.json'), JSON.stringify(meta));

              // states.json
              const states = country.states.map(s => ({
                id: s.id, name: s.name, country_id: country.id, country_code: country.iso2,
                fips_code: null, iso2: s.iso2, type: s.type, latitude: s.latitude,
                longitude: s.longitude, native: s.native || null, timezone: s.timezone || null, translations: {}
              }));
              fs.writeFileSync(path.join(countryDir, 'states.json'), JSON.stringify(states));

              for (const state of country.states) {
                if (!state.cities || state.cities.length === 0) continue;
                const stateDir = path.join(countryDir, state.name.replace(/\s+/g, '_') + '-' + state.iso2);
                fs.mkdirSync(stateDir, { recursive: true });
                const cities = state.cities.map(c => ({
                  id: c.id, name: c.name, state_id: state.id, state_code: state.iso2,
                  country_id: country.id, country_code: country.iso2,
                  latitude: c.latitude, longitude: c.longitude,
                  native: null, timezone: c.timezone || null, translations: {}
                }));
                fs.writeFileSync(path.join(stateDir, 'cities.json'), JSON.stringify(cities));
              }
            }
            console.log('Server-format data generated');
          "

      - name: Generate browser-format data
        run: node scripts/generate-data.cjs /tmp/server-data

      - name: Collect statistics
        id: data-stats
        run: |
          COUNTRIES=$(cat src/data/countries.json | grep -o '"id"' | wc -l | tr -d ' ')
          CITY_FILES=$(ls src/data/cities/ | wc -l | tr -d ' ')
          echo "countries=$COUNTRIES" >> $GITHUB_OUTPUT
          echo "city_files=$CITY_FILES" >> $GITHUB_OUTPUT

      - name: Build and test
        run: |
          npm run build
          npm test

      - name: Configure git
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"

      - name: Check for changes
        id: check-changes
        run: |
          git add src/data
          if git diff --cached --quiet; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.check-changes.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update browser data from upstream'
          title: 'Automated Data Update'
          body: |
            ## Automated Data Update

            Updated browser-format data from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database).

            ### Statistics
            - Countries: ${{ steps.data-stats.outputs.countries }}
            - City files: ${{ steps.data-stats.outputs.city_files }}

            - Build successful
            - All tests passing
          branch: automated-data-update
          delete-branch: true
          labels: |
            automated
            data-update

      - name: No changes detected
        if: steps.check-changes.outputs.changed == 'false'
        run: echo "Data is already up to date."
```

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "ci: add CI, publish, and data update workflows"
```

---

### Task 12: README and CLAUDE.md

**Files:**
- Create: `README.md`
- Create: `CLAUDE.md`

- [ ] **Step 1: Create README.md**

Create `README.md`:

```markdown
# @countrystatecity/countries-browser

Browser-native countries, states, and cities data with jsDelivr CDN and lazy loading. Same API as the server package — works in React, Vue, Svelte, Vite, and any browser environment.

## Installation

```bash
npm install @countrystatecity/countries-browser
```

## Quick Start

```typescript
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries-browser';

// Load all countries (~30KB gzipped)
const countries = await getCountries();

// Load states for a country (on-demand)
const states = await getStatesOfCountry('US');

// Load cities for a state (on-demand)
const cities = await getCitiesOfState('US', 'CA');
```

## Why This Package?

The server package (`@countrystatecity/countries`) requires Node.js file system access and cannot run in browsers. This package provides the **same API** using `fetch()` and jsDelivr CDN instead.

| | `countries` (server) | `countries-browser` |
|---|---|---|
| Environment | Node.js only | Browser + Node.js |
| Data loading | `fs.readFileSync` | `fetch()` from CDN |
| Initial bundle | ~5KB | ~5KB |
| Configuration | None needed | Optional CDN override |
| Lazy loading | Yes | Yes |

## API Reference

### Data Functions

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

### Utility Functions

```typescript
isValidCountryCode(code: string): Promise<boolean>
isValidStateCode(countryCode: string, stateCode: string): Promise<boolean>
searchCitiesByName(countryCode: string, stateCode: string, term: string): Promise<ICity[]>
getCountryNameByCode(code: string): Promise<string | null>
getStateNameByCode(countryCode: string, stateCode: string): Promise<string | null>
getTimezoneForCity(countryCode: string, stateCode: string, cityName: string): Promise<string | null>
getCountryTimezones(countryCode: string): Promise<string[]>
```

### Configuration

```typescript
import { configure, resetConfiguration, clearCache } from '@countrystatecity/countries-browser';

// Self-host data instead of jsDelivr
configure({
  baseURL: 'https://my-cdn.com/data',
  timeout: 10000,        // 10s timeout (default: 5s)
  cacheSize: 100,        // LRU cache entries (default: 50)
});

// Reset to defaults
resetConfiguration();

// Clear in-memory cache
clearCache();
```

## React Example

```tsx
import { useState, useEffect } from 'react';
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries-browser';
import type { ICountry, IState, ICity } from '@countrystatecity/countries-browser';

export function LocationSelector() {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (!selectedCountry) { setStates([]); return; }
    getStatesOfCountry(selectedCountry).then(setStates);
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedState) { setCities([]); return; }
    getCitiesOfState(selectedCountry, selectedState).then(setCities);
  }, [selectedCountry, selectedState]);

  return (
    <div>
      <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedState(''); }}>
        <option value="">Select Country</option>
        {countries.map(c => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}
      </select>

      <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} disabled={!selectedCountry}>
        <option value="">Select State</option>
        {states.map(s => <option key={s.iso2} value={s.iso2}>{s.name}</option>)}
      </select>

      <select disabled={!selectedState}>
        <option value="">Select City</option>
        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}
```

## Error Handling

```typescript
import { getCountries, NetworkError } from '@countrystatecity/countries-browser';

try {
  const countries = await getCountries();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error(`CDN request failed: ${error.statusCode} at ${error.url}`);
  }
}
```

Invalid codes return `null` or `[]` gracefully (no exceptions).

## Data

- 250 countries
- 5,000+ states/provinces
- 150,000+ cities
- Translations in 18+ languages
- Timezone data per location

Data sourced from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) and updated weekly via automated PR.

## License

[ODbL-1.0](LICENSE)
```

- [ ] **Step 2: Create CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# CLAUDE.md

## Project Overview

**@countrystatecity/countries-browser** - A browser-native package providing lazy-loaded geographic data (countries, states, cities) via jsDelivr CDN with in-memory LRU caching.

**Critical Constraint**: This is a **browser-first** package. No Node.js dependencies (`fs`, `path`, `url`). All data loading uses the Fetch API.

## Development Commands

```bash
npm run build          # Build with tsup (ESM + CJS + types)
npm run dev            # Build in watch mode
npm run typecheck      # TypeScript type checking
npm test               # Run all tests with Vitest
npm run test:watch     # Tests in watch mode
npm run generate-data  # Transform server data into flat browser structure
```

## Architecture

### Data Loading Strategy

The package uses **fetch + jsDelivr CDN** with LRU in-memory caching:

1. Check LRU cache for requested data
2. On miss: `fetch()` from `cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@{VERSION}/dist/data/{path}`
3. Parse JSON, store in cache, return

### File Structure

```
src/
├── index.ts      # Public API re-exports
├── types.ts      # TypeScript interfaces (copied from server package)
├── errors.ts     # NetworkError, TimeoutError
├── config.ts     # Configuration management (baseURL, timeout, cacheSize)
├── cache.ts      # LRU cache implementation
├── fetcher.ts    # fetch wrapper with timeout and error handling
├── loaders.ts    # Core data loading functions
├── utils.ts      # Helper utilities (validation, search)
└── data/         # Flat JSON files (served by jsDelivr)
    ├── countries.json
    ├── country/{ISO2}.json
    ├── states/{ISO2}.json
    └── cities/{ISO2}-{STATE}.json
```

### Relationship to Server Package

This package mirrors the API of `@countrystatecity/countries` but replaces `fs.readFileSync` with `fetch()`. Types are copied (not imported) to avoid a dependency on a server-side package.

### Version Pinning

`__VERSION__` is replaced at build time by tsup's `define` option. CDN URLs include the exact package version for immutable caching.

### Data Generation

`scripts/generate-data.cjs` reads the server package's nested data structure and flattens it:
- `{CountryName-ISO2}/meta.json` -> `country/{ISO2}.json`
- `{CountryName-ISO2}/states.json` -> `states/{ISO2}.json`
- `{CountryName-ISO2}/{StateName-CODE}/cities.json` -> `cities/{ISO2}-{CODE}.json`

## Testing Strategy

- **Unit tests**: Mock `globalThis.fetch` with `vi.fn()`, test all code paths
- **Integration tests**: Mock fetch to read from local data files, verify real data

## Data Source

All data from: https://github.com/dr5hn/countries-states-cities-database
Data issues should be reported upstream.
```

- [ ] **Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: add README and CLAUDE.md"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf dist node_modules
npm install
npm run build
```

Expected: Build succeeds

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass (unit + integration)

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 4: Verify dist contents**

```bash
echo "=== JS bundle ==="
ls -lh dist/index.js dist/index.cjs
echo "=== Types ==="
ls dist/index.d.ts dist/index.d.cts
echo "=== Data samples ==="
ls dist/data/countries.json
ls dist/data/country/ | wc -l
ls dist/data/states/ | wc -l
ls dist/data/cities/ | wc -l
```

Expected: JS bundles exist, types exist, data directories populated

- [ ] **Step 5: Verify exports work**

```bash
node -e "
  import('@countrystatecity/countries-browser')
    .then(m => console.log('ESM exports:', Object.keys(m).join(', ')))
    .catch(e => console.error(e));
" --input-type=module 2>/dev/null || echo "Skipping ESM import check (not installed globally)"

# At minimum, check the dist files exist and are valid JS
node -e "const m = require('./dist/index.cjs'); console.log('CJS exports:', Object.keys(m).join(', '));"
```

Expected: Lists all exported function names

- [ ] **Step 6: Final commit if any changes**

```bash
git status
# If clean, nothing to commit
# If any loose changes, stage and commit
```
