# @countrystatecity/countries

[![npm](https://img.shields.io/npm/v/@countrystatecity/countries)](https://www.npmjs.com/package/@countrystatecity/countries)
[![CI](https://github.com/dr5hn/countrystatecity-countries/workflows/CI/badge.svg)](https://github.com/dr5hn/countrystatecity-countries/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/countries)](https://www.npmjs.com/package/@countrystatecity/countries)

Official countries, states, and cities database with iOS/Safari support and minimal bundle size.

**Environment:** 🖥️ **Server-side only** (Node.js, Next.js API routes, Express, etc.)

## ✨ Features

- 🌍 **Complete Data**: 250+ countries, 5,000+ states, 150,000+ cities
- 📱 **iOS Compatible**: No stack overflow errors on Safari/iOS browsers
- 🚀 **Minimal Bundle**: <10KB initial load, lazy-load everything else
- 🔄 **Lazy Loading**: Dynamic imports for optimal performance
- 🌐 **Translations**: 18+ languages supported
- ⏰ **Timezone Data**: Full timezone information per location
- 📝 **TypeScript**: Full type definitions included
- 🔧 **Tree-Shakeable**: Only bundle what you use

### Why This Package?

The popular `country-state-city` package (162K weekly downloads) has critical issues:
- 🔴 8MB bundle size (includes ALL data)
- 🔴 iOS Safari crashes with stack overflow errors
- 🔴 Unmaintained for 2+ years
- 🔴 Static imports force entire bundle

This package solves each of those problems:
- ✅ Minimal bundle (<10KB initial)
- ✅ Dynamic imports & lazy loading
- ✅ iOS/Safari compatible
- ✅ Always updated from authoritative database
- ✅ Tree-shakeable & code-splittable

## 📦 Installation

```bash
npm install @countrystatecity/countries
# or
yarn add @countrystatecity/countries
# or
pnpm add @countrystatecity/countries
```

> **⚠️ Server-Side Only**: This package requires Node.js file system access and cannot be used in browser environments. For frontend use, install [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser) instead — same API, works in React/Vue/Svelte/Vite.

## 🚀 Quick Start

```typescript
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries';

// Get all countries (lightweight - ~5KB)
const countries = await getCountries();
console.log(countries[0]);
// { id: 1, name: "United States", iso2: "US", emoji: "🇺🇸", ... }

// Get all states in a country (~10-100KB depending on country)
const states = await getStatesOfCountry('US');
console.log(states[0]);
// { id: 1, name: "California", iso2: "CA", ... }

// Get all cities in a state (~5-200KB depending on state)
const cities = await getCitiesOfState('US', 'CA');
console.log(cities[0]);
// { id: 1, name: "Los Angeles", latitude: "34.05", ... }
```

## 📖 API Reference

### Core Functions

#### `getCountries()`
Get lightweight list of all countries (basic info only).
- **Returns:** `Promise<ICountry[]>`
- **Bundle Impact:** ~5KB

#### `getCountryByCode(countryCode: string)`
Get full country metadata including timezones and translations.
- **Parameters:** `countryCode` - ISO2 code (e.g., 'US')
- **Returns:** `Promise<ICountryMeta | null>`
- **Bundle Impact:** ~5KB per country

#### `getStatesOfCountry(countryCode: string)`
Get all states/provinces for a country.
- **Parameters:** `countryCode` - ISO2 code
- **Returns:** `Promise<IState[]>`
- **Bundle Impact:** ~10-100KB depending on country

#### `getStateByCode(countryCode: string, stateCode: string)`
Get specific state details.
- **Parameters:** `countryCode`, `stateCode`
- **Returns:** `Promise<IState | null>`

#### `getCitiesOfState(countryCode: string, stateCode: string)`
Get all cities in a specific state.
- **Parameters:** `countryCode`, `stateCode`
- **Returns:** `Promise<ICity[]>`
- **Bundle Impact:** ~5-200KB depending on state

#### `getAllCitiesOfCountry(countryCode: string)`
Get ALL cities in an entire country.
- **Warning:** Large data size, use sparingly
- **Returns:** `Promise<ICity[]>`

#### `getAllCitiesInWorld()`
Get every city globally.
- **Warning:** MASSIVE data (8MB+), rarely needed
- **Returns:** `Promise<ICity[]>`

### Utility Functions

#### `isValidCountryCode(countryCode: string)`
Check if country code exists.
- **Returns:** `Promise<boolean>`

#### `isValidStateCode(countryCode: string, stateCode: string)`
Check if state code exists in a country.
- **Returns:** `Promise<boolean>`

#### `searchCitiesByName(countryCode: string, stateCode: string, searchTerm: string)`
Search cities by partial name match.
- **Returns:** `Promise<ICity[]>`

#### `getCountryNameByCode(countryCode: string)`
Get country name from code.
- **Returns:** `Promise<string | null>`

#### `getStateNameByCode(countryCode: string, stateCode: string)`
Get state name from code.
- **Returns:** `Promise<string | null>`

#### `getTimezoneForCity(countryCode: string, stateCode: string, cityName: string)`
Get timezone for specific city.
- **Returns:** `Promise<string | null>`

#### `getCountryTimezones(countryCode: string)`
Get all timezones for a country.
- **Returns:** `Promise<string[]>`

## 🔧 TypeScript Types

```typescript
import type { ICountry, ICountryMeta, IState, ICity, ITimezone } from '@countrystatecity/countries';
```

## 📊 Bundle Size

| Action | @countrystatecity/countries | country-state-city |
|--------|----------------------------|-------------------|
| Install & import | 5KB | 8MB |
| Load countries | +2KB | - |
| Load US states | +30KB | - |
| Load CA cities | +15KB | - |
| **Total for typical use** | **~50KB** | **8MB** |

**160x smaller bundle size!**

## 🧪 Testing

```bash
# Run all tests
npm test

# Run iOS compatibility tests specifically
npm run test:ios

# Watch mode
npm run test:watch
```

All packages include comprehensive tests:
- ✅ Unit tests
- ✅ Integration tests
- ✅ iOS/Safari compatibility tests

## 🔄 CI/CD & Automation

### Continuous Integration
Every push and PR automatically:
- ✅ Runs type checking
- ✅ Executes comprehensive tests
- ✅ Builds the package
- ✅ Validates bundle sizes
- ✅ Tests iOS/Safari compatibility

### Automated Publishing
Automated publishing to NPM on version changes:
- 🔍 Detects version bumps in package.json
- 📦 Builds and tests before publishing
- 🚀 Publishes to NPM registry
- 🏷️ Creates GitHub release with changelog

## 📄 License

[ODbL-1.0](LICENSE) © [dr5hn](https://github.com/dr5hn)

This package and its data are licensed under the Open Database License (ODbL) v1.0. The data is sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) which is also licensed under ODbL-1.0.

You are free to share, create, and adapt this database as long as you attribute the original sources, distribute adaptations under the same license, and don't use technical restrictions to lock down the data.

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

**For data-related issues** (incorrect country names, missing cities, wrong coordinates, etc.), please report them to the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues) repository, which is the source of data for this package.

## 📦 Package Ecosystem

This package is part of the [@countrystatecity package ecosystem](https://github.com/dr5hn/countrystatecity-countries):

- **[@countrystatecity/countries](https://www.npmjs.com/package/@countrystatecity/countries)** (This package) — Server-side countries, states, and cities database. Environment: Node.js, Next.js API routes, Express. Bundle: <10KB initial load.

- **[@countrystatecity/countries-browser](https://www.npmjs.com/package/@countrystatecity/countries-browser)** — Browser-native version with jsDelivr CDN and lazy loading. Environment: React, Vue, Svelte, Vite, any browser. Same API as this package — zero config, just import and use.

- **[@countrystatecity/timezones](https://www.npmjs.com/package/@countrystatecity/timezones)** — Comprehensive timezone data with conversion utilities. Environment: Server-side only. Bundle: <20KB initial load.

### Environment Guide

**Use this package (`@countrystatecity/countries`) when:**
- ✅ Building API endpoints or backends
- ✅ Using Next.js App Router server components
- ✅ Running in Node.js, serverless functions (Vercel, AWS Lambda)
- ✅ You have file system access
- ✅ Building command-line tools

**For browser/frontend use:**

Use [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser) — same API, works directly in React, Vue, Svelte, Vite:

```bash
npm install @countrystatecity/countries-browser
```

```typescript
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries-browser';

const countries = await getCountries();
const states = await getStatesOfCountry('US');
const cities = await getCitiesOfState('US', 'CA');
```

## 🔗 Links

- [GitHub Repository](https://github.com/dr5hn/countrystatecity-countries)
- [Issues](https://github.com/dr5hn/countrystatecity-countries/issues)
- [NPM Package](https://www.npmjs.com/package/@countrystatecity/countries)
- [NPM Organization](https://www.npmjs.com/org/countrystatecity)
