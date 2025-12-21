# NextJS Integration Test

This directory contains a minimal NextJS application to test the `@countrystatecity/countries` package integration.

## Purpose

This test verifies that the package:
- Can be successfully imported in NextJS server components
- Builds without webpack errors (especially "Module not found: Can't resolve 'fs'")
- Works correctly with NextJS's webpack bundler
- The `webpackIgnore` magic comments prevent Node.js modules from being bundled

## Running the Test

### Prerequisites

1. Build the main package first:
   ```bash
   cd ../..
   npm install
   npm run build
   ```

### Run the Test

From this directory:
```bash
./test.sh
```

Or from the repository root:
```bash
cd tests/nextjs-integration
./test.sh
```

## What the Test Does

1. Installs NextJS and dependencies
2. Links the local `@countrystatecity/countries` package
3. Attempts to build the NextJS application
4. If the build succeeds, the package is compatible with NextJS
5. If the build fails, there are compatibility issues

## Test Application

The test app (`app/page.tsx`) is a simple NextJS server component that:
- Imports functions from `@countrystatecity/countries`
- Calls `getCountries()`, `getStatesOfCountry()`, and `getCitiesOfState()`
- Displays the results on a page

This exercises the actual webpack bundling process that would fail if the `fs` module issue wasn't fixed.

## CI Integration

This test can be added to the CI workflow to ensure ongoing compatibility with NextJS.
