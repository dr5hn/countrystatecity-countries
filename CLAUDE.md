# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@countrystatecity/countries** - A server-side Node.js package providing lazy-loaded geographic data (countries, states, cities) with iOS/Safari compatibility and minimal bundle size (<10KB initial load).

**Critical Constraint**: This is a **server-side only** package that requires Node.js file system access. It cannot run directly in browsers.

## Development Commands

### Build & Development
```bash
npm run build          # Build package with tsup (ESM + CJS + types)
npm run dev            # Build in watch mode
npm run typecheck      # Run TypeScript type checking
```

### Testing
```bash
npm test               # Run all tests with Vitest
npm run test:watch     # Run tests in watch mode
npm run test:ios       # Run iOS/Safari compatibility tests only
npx vitest tests/unit/loaders.test.ts  # Run specific test file
```

### Data Management
```bash
npm run generate-data  # Transform source data into split structure
                       # Expects data file path as argument
```

### Publishing
Publishing is fully automated via GitHub Actions on version bumps. Do not run `npm publish` manually.

## Architecture

### Data Loading Strategy

The package uses **dynamic imports with multi-path fallback** to work across different environments:

1. **Primary**: Dynamic `import()` for ESM/bundlers
2. **Fallback**: Node.js `fs.readFileSync()` for CommonJS/serverless
3. **Path Resolution**: Tries 3 paths to locate data files:
   - Relative to module location (local dev)
   - Parent directory relative (bundler variations)
   - Absolute through node_modules (Vercel/serverless)

### File Structure

```
src/
├── index.ts        # Public API exports
├── loaders.ts      # Core data loading functions with environment detection
├── utils.ts        # Helper utilities (validation, search)
├── types.ts        # TypeScript interfaces
└── data/
    ├── countries.json                    # ~5KB - All countries list
    └── {CountryName-CODE}/
        ├── meta.json                     # ~5KB - Country metadata
        ├── states.json                   # ~10-100KB - States list
        └── {StateName-CODE}/
            └── cities.json               # ~5-200KB - Cities list
```

**Why this structure?**
- Enables lazy loading (load only what you need)
- Prevents iOS stack overflow (no massive static imports)
- Keeps initial bundle <10KB
- Allows granular code-splitting

### Webpack Magic Comments

The `loaders.ts` file uses `/* webpackIgnore: true */` to prevent webpack from bundling Node.js modules (`fs`, `path`, `url`):

```typescript
case 'fs':
  return import(/* webpackIgnore: true */ 'fs');
```

**Expected behavior**: Webpack will show a "Critical dependency" warning - this is harmless and indicates the protection is working.

### Build Process (tsup.config.ts)

1. Bundles TypeScript code (ESM + CJS)
2. Generates type definitions (.d.ts + .d.cts)
3. **Important**: `onSuccess` hook copies `src/data/` to `dist/data/`
4. Data files are NOT bundled, kept as separate JSON files

### Environment Detection

```typescript
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' &&
         process.versions != null &&
         process.versions.node != null;
}
```

This prevents errors when Node.js modules aren't available and provides helpful error messages for browser usage.

## Deployment Considerations

### Next.js / Vercel

Users MUST add to `next.config.js`:
```javascript
module.exports = {
  serverExternalPackages: ['@countrystatecity/countries'],
}
```

**Why**: Prevents webpack from bundling the package, which would break fs imports.

See `docs/VERCEL_DEPLOYMENT.md` for full details.

### Vite / Browser

Package cannot run in Vite frontend code. Two solutions documented in `docs/VITE_DEPLOYMENT.md`:

1. **Recommended**: Use `import.meta.glob` to load JSON files directly from node_modules
2. **Alternative**: Create backend API endpoints that use this package

## Testing Strategy

```
tests/
├── unit/              # Individual function tests
├── integration/       # Workflow tests (multiple function calls)
└── compatibility/     # iOS/Safari stack overflow prevention tests
```

**iOS Tests**: Verify that loading data doesn't cause stack overflow errors on Safari/iOS by testing deep recursive operations.

## Data Updates

**Automated**: GitHub Actions workflow runs weekly (Sundays 00:00 UTC):
1. Downloads latest from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)
2. Transforms into split structure via `scripts/generate-data.cjs`
3. Runs tests
4. Creates PR if changes detected

**Manual**: Run `npm run generate-data <path-to-source-json>` then test and commit.

## Common Issues & Solutions

### "Module not found: Can't resolve 'fs'"
**Cause**: Code is running in browser or webpack is trying to bundle
**Solution**: Ensure `webpackIgnore` comments are present and user has correct Next.js config

### "Cannot find module './data/countries.json'"
**Cause**: Data files not included in deployment or path resolution failed
**Solution**: Check that `dist/data/` exists after build; verify multi-path fallback logic

### Browser Usage Error
**Expected**: Package throws clear error explaining it's server-side only
**Solution**: Point users to `docs/VITE_DEPLOYMENT.md` for workarounds

## Package Exports

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  },
  "./data/*": "./dist/data/*"
}
```

**Direct data access**: Users can import JSON directly via `@countrystatecity/countries/data/countries.json` (useful for Vite `import.meta.glob`).

## Data Sources

**All data-related issues** (wrong names, missing cities, incorrect coordinates) should be reported to:
https://github.com/dr5hn/countries-states-cities-database/issues

This package consumes that data; fixes happen upstream first.

## CI/CD Workflows

- **ci.yml**: Runs on every push/PR - builds, tests, type checks
- **publish.yml**: Triggers on version change in package.json - publishes to npm
- **update-data.yml**: Weekly schedule + manual trigger - updates data from source

## Key Implementation Details

### Directory Name Mapping

Country/state codes don't always match directory names (e.g., "United States-US" vs "US"). The package:

1. Scans `data/` directory on first use
2. Builds maps: `countryCode → directoryName`
3. Caches maps for performance

This allows users to call `getStatesOfCountry('US')` without knowing the directory is "United States-US".

### Lazy Loading Pattern

All data loading is async and on-demand:
- `getCountries()` - 5KB
- `getStatesOfCountry('US')` - Loads only when requested
- `getCitiesOfState('US', 'CA')` - Loads only specific state

**Anti-pattern**: `getAllCitiesInWorld()` exists but loads 8MB+ - document when advising against.

## Code Style Notes

- Use explicit return types for all functions
- Functions include JSDoc with `@bundle` tag indicating size impact
- Prefer `null` over `undefined` for "not found" cases
- Always provide helpful error messages mentioning server-side requirement
