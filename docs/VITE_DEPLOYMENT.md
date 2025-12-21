# Vite / Browser Compatibility Guide

The `@countrystatecity/countries` package is designed for **server-side use**, but you can use it in Vite/browser environments with the right approach.

## Why Direct Usage Doesn't Work

The package uses Node.js file system APIs and cannot run directly in browser/frontend code:

1. **File System Dependency**: Uses `fs.readFileSync()` to load JSON data
2. **Node.js Modules**: Requires built-in modules (`fs`, `path`, `url`) unavailable in browsers
3. **Path Resolution**: Dynamic imports expect Node.js file paths, not HTTP URLs

## The Error You're Seeing

```
Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: 
https://localhost:3000/node_modules/.vite/deps/data/countries.json?import
```

This happens because Vite tries to serve the dynamic `import('./data/countries.json')` as an HTTP module, but the package expects Node.js file system access.

## ✅ Recommended Solution: Use Vite's `import.meta.glob` (Community-Tested)

**This solution works perfectly in Vite** and provides the same lazy-loading benefits as the server version. It uses Vite's built-in `import.meta.glob` feature to map JSON files directly from `node_modules`.

### Implementation (Credit: @tech-andgar, @sweethuman)

Create a utility file in your project (e.g., `src/lib/countries.ts`):

```typescript
import type { ICity, ICountry, IState } from '@countrystatecity/countries';

// Lazy-load the countries list
const getCountriesModule = () => import('@countrystatecity/countries/data/countries.json');

// Map of state loaders - Vite will split these into separate chunks
const stateModules = import.meta.glob(
  '/node_modules/@countrystatecity/countries/dist/data/*/states.json'
);

// Map of city loaders - Vite will split these into separate chunks
const cityModules = import.meta.glob(
  '/node_modules/@countrystatecity/countries/dist/data/*/*/cities.json'
);

export async function getCountries(): Promise<ICountry[]> {
  const module = await getCountriesModule();
  return (module as any).default as ICountry[];
}

export async function getStatesOfCountry(countryCode: string): Promise<IState[]> {
  if (!countryCode) return [];

  // Find the module that matches the country code
  // Key format: /node_modules/@countrystatecity/countries/dist/data/{CountryName}-{CountryCode}/states.json
  const key = Object.keys(stateModules).find((k) => 
    k.includes(`-${countryCode}/states.json`)
  );

  if (!key) {
    console.warn(`No states found for country code: ${countryCode}`);
    return [];
  }

  try {
    const loader = stateModules[key];
    if (!loader) return [];
    const module = await loader();
    return (module as any).default as IState[];
  } catch (error) {
    console.error(`Failed to load states for ${countryCode}:`, error);
    return [];
  }
}

export async function getCitiesOfState(
  countryCode: string, 
  stateCode: string
): Promise<ICity[]> {
  if (!countryCode || !stateCode) return [];

  // Find the module that matches the country and state code
  // Key format: /node_modules/@countrystatecity/countries/dist/data/{CountryName}-{CountryCode}/{StateName}-{StateCode}/cities.json
  const key = Object.keys(cityModules).find((k) =>
    k.includes(`-${countryCode}/`) && k.includes(`-${stateCode}/cities.json`)
  );

  if (!key) {
    console.warn(`No cities found for country: ${countryCode}, state: ${stateCode}`);
    return [];
  }

  try {
    const loader = cityModules[key];
    if (!loader) return [];
    const module = await loader();
    return (module as any).default as ICity[];
  } catch (error) {
    console.error(`Failed to load cities for ${countryCode}, ${stateCode}:`, error);
    return [];
  }
}
```

### Usage in Your Components

```typescript
import { getCountries, getStatesOfCountry, getCitiesOfState } from './lib/countries';

// Load countries on component mount
const countries = await getCountries();

// Load states when user selects a country
const states = await getStatesOfCountry('US');

// Load cities when user selects a state
const cities = await getCitiesOfState('US', 'CA');
```

### Benefits of This Approach

1. ✅ **Zero Backend Required**: Works entirely in the browser
2. ✅ **Lazy Loading**: Each state/city file is loaded only when needed
3. ✅ **Small Initial Bundle**: Only loads countries.json (~5KB) upfront
4. ✅ **Automatic Code Splitting**: Vite splits data into ~4k small chunks
5. ✅ **Type Safety**: Full TypeScript support from the original package
6. ✅ **PWA Friendly**: Can be cached with Workbox for offline support
7. ✅ **No Config Needed**: Works without any `vite.config.ts` changes

### Performance Comparison

| Approach | Initial Load | On-Demand Load | Total Data |
|----------|--------------|----------------|------------|
| Direct Package (breaks) | ❌ Fails | - | - |
| Backend API | 5KB | Network request | Depends on API |
| **import.meta.glob** | **~5KB** | **Lazy chunks** | **~52MB split** |
| Build-time generation | ~8MB+ | Immediate | 8MB+ |

## Alternative Solutions

If the `import.meta.glob` approach doesn't work for your setup, here are other options:

### Option 1: Backend API Endpoint

If you need server-side processing or can't use `import.meta.glob`, create a backend API:

#### Using Vite + Express Backend

```javascript
// server.js (Node.js backend)
import express from 'express';
import { getCountries } from '@countrystatecity/countries';

const app = express();

app.get('/api/countries', async (req, res) => {
  const countries = await getCountries();
  res.json(countries);
});

app.listen(3001, () => {
  console.log('API server running on http://localhost:3001');
});
```

Fetch from your Vite frontend:
```javascript
// Your Vite component
async function loadCountries() {
  const response = await fetch('http://localhost:3001/api/countries');
  const countries = await response.json();
  return countries;
}
```

### Option 2: Build-Time Static Generation

Generate static JSON files at build time (warning: larger bundle size):

```javascript
// scripts/generate-countries.js (run with Node.js)
import { getCountries, getStatesOfCountry } from '@countrystatecity/countries';
import fs from 'fs';

async function generateData() {
  const countries = await getCountries();
  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync('src/data/countries.json', JSON.stringify(countries, null, 2));
  
  // Generate states for specific countries you need
  const usStates = await getStatesOfCountry('US');
  fs.writeFileSync('src/data/us-states.json', JSON.stringify(usStates, null, 2));
}

generateData();
```

Add to `package.json`:
```json
{
  "scripts": {
    "generate-data": "node scripts/generate-countries.js",
    "prebuild": "npm run generate-data"
  }
}
```

Import in your Vite app:
```javascript
import countries from './data/countries.json';
```

### Option 3: SSR/SSG Frameworks

If using SvelteKit, Astro, or similar frameworks with server-side capabilities, use the package only in server-side code:

#### SvelteKit Example

```typescript
// src/routes/+page.server.ts
import { getCountries } from '@countrystatecity/countries';

export async function load() {
  const countries = await getCountries();
  return { countries };
}
```

```svelte
<!-- src/routes/+page.svelte -->
<script>
  export let data;
  const { countries } = data;
</script>

<ul>
  {#each countries as country}
    <li>{country.name}</li>
  {/each}
</ul>
```

#### Astro Example

```astro
---
// src/pages/countries.astro
import { getCountries } from '@countrystatecity/countries';

const countries = await getCountries();
---

<ul>
  {countries.map(country => (
    <li>{country.name}</li>
  ))}
</ul>
```

### Option 4: Different Package (Not Recommended)

If none of the above work, consider alternatives:
- `country-state-city` - Includes all data (8MB+ bundle, no lazy loading)
- `countries-list` - Countries only, smaller bundle
- Host your own CDN with the JSON files

## Why Vite Config Attempts Don't Work

You may have tried these configurations, but they **cannot fix the issue**:

```javascript
// ❌ This doesn't help
export default defineConfig({
  optimizeDeps: {
    include: ['@countrystatecity/countries']
  }
})

// ❌ This doesn't help either
export default defineConfig({
  ssr: {
    external: ['@countrystatecity/countries']
  }
})

// ❌ Or this
export default defineConfig({
  ssr: {
    noExternal: ['@countrystatecity/countries']
  }
})
```

**Why they don't work**: These configurations control how Vite pre-bundles or externalizes dependencies, but they cannot make Node.js file system APIs (`fs`, `path`) available in the browser. The package's internal code tries to use `fs.readFileSync()` which simply doesn't exist in browser environments.

**The solution**: Use `import.meta.glob` (shown above) which bypasses the package's internal loader and directly accesses the JSON files using Vite's built-in features.

## Complete Example: Vite + React Country Selector

Here's a complete working example using the `import.meta.glob` approach:

**1. Create the utility file** (`src/lib/countries.ts`):

```typescript
import type { ICity, ICountry, IState } from '@countrystatecity/countries';

const getCountriesModule = () => import('@countrystatecity/countries/data/countries.json');

const stateModules = import.meta.glob(
  '/node_modules/@countrystatecity/countries/dist/data/*/states.json'
);

const cityModules = import.meta.glob(
  '/node_modules/@countrystatecity/countries/dist/data/*/*/cities.json'
);

export async function getCountries(): Promise<ICountry[]> {
  const module = await getCountriesModule();
  return (module as any).default as ICountry[];
}

export async function getStatesOfCountry(countryCode: string): Promise<IState[]> {
  if (!countryCode) return [];
  const key = Object.keys(stateModules).find((k) => k.includes(`-${countryCode}/states.json`));
  if (!key) return [];
  
  try {
    const loader = stateModules[key];
    if (!loader) return [];
    const module = await loader();
    return (module as any).default as IState[];
  } catch (error) {
    console.error(`Failed to load states for ${countryCode}:`, error);
    return [];
  }
}

export async function getCitiesOfState(countryCode: string, stateCode: string): Promise<ICity[]> {
  if (!countryCode || !stateCode) return [];
  const key = Object.keys(cityModules).find((k) =>
    k.includes(`-${countryCode}/`) && k.includes(`-${stateCode}/cities.json`)
  );
  if (!key) return [];
  
  try {
    const loader = cityModules[key];
    if (!loader) return [];
    const module = await loader();
    return (module as any).default as ICity[];
  } catch (error) {
    console.error(`Failed to load cities for ${countryCode}, ${stateCode}:`, error);
    return [];
  }
}
```

**2. Use in a React component**:

```tsx
import { useState, useEffect } from 'react';
import { getCountries, getStatesOfCountry, getCitiesOfState } from './lib/countries';
import type { ICountry, IState, ICity } from '@countrystatecity/countries';

export function LocationSelector() {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState({ countries: true, states: false, cities: false });

  // Load countries on mount
  useEffect(() => {
    getCountries().then(data => {
      setCountries(data);
      setLoading(prev => ({ ...prev, countries: false }));
    });
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, states: true }));
    getStatesOfCountry(selectedCountry).then(data => {
      setStates(data);
      setLoading(prev => ({ ...prev, states: false }));
    });
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (!selectedCountry || !selectedState) {
      setCities([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, cities: true }));
    getCitiesOfState(selectedCountry, selectedState).then(data => {
      setCities(data);
      setLoading(prev => ({ ...prev, cities: false }));
    });
  }, [selectedCountry, selectedState]);

  return (
    <div>
      <div>
        <label>Country:</label>
        <select 
          value={selectedCountry} 
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState('');
          }}
          disabled={loading.countries}
        >
          <option value="">Select Country</option>
          {countries.map(country => (
            <option key={country.iso2} value={country.iso2}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCountry && (
        <div>
          <label>State:</label>
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            disabled={loading.states}
          >
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state.iso2} value={state.iso2}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCountry && selectedState && (
        <div>
          <label>City:</label>
          <select disabled={loading.cities}>
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

This example demonstrates:
- ✅ Initial load only fetches countries (~5KB)
- ✅ States load on-demand when user selects a country
- ✅ Cities load on-demand when user selects a state
- ✅ Proper loading states for better UX
- ✅ Full TypeScript type safety

## Alternative: Backend API Approach

If you need more control or can't use `import.meta.glob`, here's the backend API pattern:

### Complete Example: Vite + Express API

1. **Install dependencies**:
```bash
npm install express @countrystatecity/countries
npm install -D @types/express
```

2. **Create API server** (`server.js`):
```javascript
import express from 'express';
import cors from 'cors';
import { 
  getCountries, 
  getStatesOfCountry, 
  getCitiesOfState 
} from '@countrystatecity/countries';

const app = express();
app.use(cors());

app.get('/api/countries', async (req, res) => {
  try {
    const countries = await getCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/countries/:countryCode/states', async (req, res) => {
  try {
    const states = await getStatesOfCountry(req.params.countryCode);
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/countries/:countryCode/states/:stateCode/cities', async (req, res) => {
  try {
    const cities = await getCitiesOfState(
      req.params.countryCode, 
      req.params.stateCode
    );
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
```

3. **Create Vite composable/hook** (`src/api/countries.ts`):
```typescript
const API_BASE = 'http://localhost:3001/api';

export async function fetchCountries() {
  const response = await fetch(`${API_BASE}/countries`);
  if (!response.ok) throw new Error('Failed to fetch countries');
  return response.json();
}

export async function fetchStates(countryCode: string) {
  const response = await fetch(`${API_BASE}/countries/${countryCode}/states`);
  if (!response.ok) throw new Error('Failed to fetch states');
  return response.json();
}

export async function fetchCities(countryCode: string, stateCode: string) {
  const response = await fetch(
    `${API_BASE}/countries/${countryCode}/states/${stateCode}/cities`
  );
  if (!response.ok) throw new Error('Failed to fetch cities');
  return response.json();
}
```

4. **Use in your Vite component**:
```typescript
import { fetchCountries } from './api/countries';

// In your component
const countries = await fetchCountries();
```

5. **Run both servers**:
```bash
# Terminal 1 - API server
node server.js

# Terminal 2 - Vite dev server
npm run dev
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/dr5hn/countrystatecity-countries/issues
- Documentation: https://github.com/dr5hn/countrystatecity-countries

## Related Guides

- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) - For Next.js and serverless environments
