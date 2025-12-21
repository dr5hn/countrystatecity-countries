# Vercel / Serverless Deployment Guide

This package works in Vercel and other serverless environments with proper configuration.

## Next.js Configuration

### Recommended Configuration (Start Here)

Add this to your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark the package as external to prevent webpack bundling
  serverExternalPackages: ['@countrystatecity/countries'],
}

module.exports = nextConfig
```

This minimal configuration should work for most use cases. The package includes enhanced path resolution that handles different deployment environments.

### If You Get "Cannot find module" Errors in Production

If you encounter JSON file loading issues in production, the package's built-in path resolution should handle it. The code tries multiple path strategies:
1. Direct relative path (local development)
2. Parent directory relative path
3. Absolute path through node_modules (serverless environments)

If issues persist, you can try adding `outputFileTracingIncludes`, but **be aware this may cause build errors on Vercel**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@countrystatecity/countries'],
  
  // ⚠️ Only add if you experience module not found errors
  // This may cause build failures on some Vercel configurations
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/@countrystatecity/countries/dist/data/**/*'],
    },
  },
}

module.exports = nextConfig
```

**Note**: If `outputFileTracingIncludes` causes build errors, remove it and rely on the package's built-in path resolution.

## Why This Configuration Is Needed

### `serverExternalPackages`

This tells Next.js to keep the package external and not bundle it with webpack. This prevents:
- Webpack trying to bundle Node.js modules (`fs`, `path`, `url`)
- Issues with dynamic imports and file system access
- Bundle size inflation
- The "Module not found: Can't resolve 'fs'" error


## Troubleshooting

### "Cannot find module './data/countries.json'"

**Cause**: The JSON data files aren't being included or found in the Vercel deployment.

**Solution**: The package has built-in path resolution that tries multiple strategies. This should work automatically with just `serverExternalPackages` configuration.

If issues persist:
1. Verify `serverExternalPackages: ['@countrystatecity/countries']` is in your config
2. Check Vercel build logs for specific error messages
3. The package will try these paths in order:
   - Relative to the module location
   - Parent directory relative
   - Through node_modules absolute path

### "Module not found: Can't resolve 'fs'"

**Cause**: Webpack is trying to bundle the package for the client side.

**Solution**: Add `serverExternalPackages: ['@countrystatecity/countries']` to your `next.config.js`.

### Build Errors with `outputFileTracingIncludes`

**Cause**: Some Vercel configurations have issues when using `outputFileTracingIncludes` with external packages.

**Solution**: Remove `outputFileTracingIncludes` from your config. The package's enhanced path resolution should handle file location automatically:

```javascript
// Use this instead
const nextConfig = {
  serverExternalPackages: ['@countrystatecity/countries'],
}
```

### Unexpected Build Error on Vercel

**Cause**: Conflict between `serverExternalPackages` and `outputFileTracingIncludes`.

**Solution**: Use only `serverExternalPackages` - the package code handles path resolution internally.

### "Module not found: Can't resolve 'fs'"

**Cause**: Webpack is trying to bundle the package for the client side.

**Solution**: Add `serverExternalPackages: ['@countrystatecity/countries']` to your `next.config.js`.

### Build Errors with `outputFileTracingIncludes`

**Cause**: Path patterns might be incorrect or conflicting with other configuration.

**Solution**: Remove `outputFileTracingIncludes` entirely and rely on the package's built-in path resolution:

```javascript
// Recommended configuration
const nextConfig = {
  serverExternalPackages: ['@countrystatecity/countries'],
}
```

The package code will automatically try multiple path strategies to locate files.

## Example Usage

### Server Component (Next.js App Router)

```typescript
import { getCountries } from '@countrystatecity/countries';

export default async function CountriesPage() {
  const countries = await getCountries();
  
  return (
    <div>
      <h1>Countries</h1>
      <ul>
        {countries.map(country => (
          <li key={country.iso2}>{country.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### API Route

```typescript
import { NextResponse } from 'next/server';
import { getCountries } from '@countrystatecity/countries';

export async function GET() {
  const countries = await getCountries();
  return NextResponse.json(countries);
}
```

## Testing Locally

Before deploying to Vercel, test your configuration locally:

```bash
npm run build
npm run start
```

Visit your pages/API routes to ensure data loads correctly.

## Support

If you encounter issues:
1. Check that `next.config.js` has the correct configuration
2. Verify the package is installed: `npm list @countrystatecity/countries`
3. Check Vercel build logs for specific error messages
4. Report issues at: https://github.com/dr5hn/countrystatecity-countries/issues
