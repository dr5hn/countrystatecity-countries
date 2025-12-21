# Copilot Instructions for countrystatecity Repository

## Project Overview

This repository contains the `@countrystatecity/countries` npm package - a comprehensive database of countries, states, and cities with support for various deployment environments including NextJS, Vercel, and serverless platforms.

## Key Learnings from NextJS/Vercel Compatibility Fix

### Problem Context

Users reported issues when deploying the package to NextJS applications, particularly on Vercel:
1. **Webpack bundling errors**: "Module not found: Can't resolve 'fs'" 
2. **Missing JSON data files**: "Cannot find module './data/countries.json'" in production
3. **Serverless path resolution**: Different file system structures in serverless environments

### Solution Approach

#### 1. Webpack Magic Comments (`webpackIgnore`)

Used `/* webpackIgnore: true */` to prevent webpack from bundling Node.js modules:

```typescript
// Prevents webpack from trying to bundle 'fs', 'path', 'url'
case 'fs':
  return import(/* webpackIgnore: true */ 'fs');
```

**Important**: This generates an expected webpack warning: "Critical dependency: the request of a dependency is an expression"
- This warning is **harmless** and indicates the fix is working correctly
- It means webpack detected the dynamic import but respects the ignore directive

#### 2. Multiple Path Resolution Strategies

Enhanced the `loadJSON` function to try multiple paths for different environments:

```typescript
const possiblePaths = [
  pathModule.join(basePath, path),                    // Local development
  pathModule.join(basePath, '..', path),              // Alternative bundling
  pathModule.join(process.cwd(), 'node_modules', '@countrystatecity', 'countries', 'dist', path), // Vercel/serverless
];
```

This handles:
- Local development
- Different bundler output structures
- Vercel's serverless file system layout
- AWS Lambda and other serverless platforms

#### 3. Next.js Configuration Requirements

Users need to add this to their `next.config.js`:

```javascript
module.exports = {
  // Prevents webpack from bundling the package
  serverExternalPackages: ['@countrystatecity/countries'],
  
  // Ensures JSON data files are included in Vercel deployment
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@countrystatecity/countries/dist/data/**/*'],
  },
}
```

**Why both config AND code changes are needed**:
- Configuration prevents bundling issues and ensures file inclusion
- Code changes provide runtime fallbacks for different environments
- Together they create a robust solution across all platforms

### Testing Strategy

1. **Unit Tests** (`packages/countries/tests/`): 42 tests for core functionality
2. **Integration Test** (`tests/nextjs-integration/`): Real NextJS app build test
3. **CI Integration**: Automated NextJS build on every commit

### Documentation Structure

- **Main README** (`packages/countries/README.md`): Quick start and API reference
- **Vercel Guide** (`docs/VERCEL_DEPLOYMENT.md`): Detailed Vercel/serverless deployment instructions
- **Integration Test README** (`tests/nextjs-integration/README.md`): Test documentation

## Architecture Decisions

### Environment Detection

```typescript
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}
```

This approach:
- Safely detects Node.js vs browser environments
- Prevents errors when Node.js modules aren't available
- Allows code to work in both SSR and client-side contexts

### Dynamic Import Pattern

Used a switch statement for known modules rather than a generic dynamic import:

```typescript
switch (moduleName) {
  case 'fs':
    return import(/* webpackIgnore: true */ 'fs');
  // ...
}
```

**Why**: More secure and explicit than allowing arbitrary module imports

### Data File Structure

The package maintains split JSON files:
- `data/countries.json` - Lightweight country list
- `data/{Country-CODE}/meta.json` - Country details
- `data/{Country-CODE}/states.json` - States list
- `data/{Country-CODE}/{State-CODE}/cities.json` - Cities list

This structure enables:
- Lazy loading (load only what you need)
- Minimal bundle size
- Better performance on mobile/iOS

## Common Issues and Solutions

### "Module not found: Can't resolve 'fs'"

**Cause**: Webpack trying to bundle Node.js modules
**Solution**: Ensure `webpackIgnore` comments are in place and `serverExternalPackages` is configured

### "Cannot find module './data/countries.json'"

**Cause**: JSON files not included in deployment or wrong path resolution
**Solution**: Add `outputFileTracingIncludes` to Next.js config + enhanced path resolution in code

### "Critical dependency: the request of a dependency is an expression"

**Status**: Expected warning, not an error
**Reason**: Webpack detecting dynamic imports with `webpackIgnore`
**Action**: No action needed - this indicates the fix is working

## Best Practices for Future Changes

1. **Always test with real NextJS app**: Use `tests/nextjs-integration/` to verify changes
2. **Consider serverless environments**: File paths work differently in Lambda/Vercel
3. **Maintain fallback strategies**: Multiple path resolution attempts ensure reliability
4. **Document configuration requirements**: Users need clear setup instructions
5. **Keep warnings documented**: Explain expected webpack warnings to avoid confusion

## CI/CD Considerations

The CI workflow runs:
1. Standard build and unit tests
2. **NextJS integration test**: Builds actual NextJS app to verify webpack compatibility
3. Both must pass for changes to be merged

This ensures ongoing compatibility with NextJS and webpack-based builds.
