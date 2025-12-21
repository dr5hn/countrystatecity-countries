# Contributing to @countrystatecity/countries

Thank you for your interest in contributing! This document provides guidelines for contributing to the @countrystatecity/countries package.

## 🚀 Quick Start

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/countrystatecity-countries.git
   cd countrystatecity-countries
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Package**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📝 Development Workflow

### Creating a Branch

Create a descriptive branch name:
```bash
git checkout -b feature/add-new-utility
git checkout -b fix/loader-bug
git checkout -b docs/update-readme
```

### Making Changes

1. **Code Changes**
   - Follow existing code style
   - Add TypeScript types for all new code
   - Update tests for any changes
   - Ensure all tests pass: `npm test`

2. **Documentation**
   - Update README files for user-facing changes
   - Add JSDoc comments to public APIs
   - Update CHANGELOG if applicable

3. **Testing**
   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Run specific test file
   npm run vitest tests/unit/loaders.test.ts
   ```

### Commit Guidelines

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `chore:` Maintenance tasks
- `refactor:` Code refactoring

Examples:
```bash
git commit -m "feat: add getCountryByName utility function"
git commit -m "fix: resolve directory mapping issue for special characters"
git commit -m "docs: update API documentation with examples"
```

### Submitting a Pull Request

1. **Push Your Branch**
   ```bash
   git push origin your-branch-name
   ```

2. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link any related issues

3. **CI Checks**
   - All tests must pass
   - Code must build successfully
   - Bundle size checks must pass

4. **Review Process**
   - Address review feedback
   - Keep PR scope focused
   - Respond to comments

## 🧪 Testing

### Test Structure

```
tests/
├── unit/              # Unit tests for individual functions
├── integration/       # Integration tests for workflows
└── compatibility/     # iOS/Safari compatibility tests
```

### Writing Tests

Use Vitest for all tests:

```typescript
import { describe, it, expect } from 'vitest';
import { getCountries } from '../../src/loaders';

describe('getCountries', () => {
  it('should return array of countries', async () => {
    const countries = await getCountries();
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);
  });
});
```

### Running Specific Tests

```bash
# Run all tests
npm test

# Run iOS compatibility tests only
npm run test:ios

# Run with coverage
npm run vitest -- --coverage
```

## 📊 Data Updates

### Manual Data Update

To update the data from the source:

```bash
# Download latest data
curl -L "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/refs/heads/master/json/countries%2Bstates%2Bcities.json.gz" \
  -o /tmp/countries-data.json.gz
gunzip /tmp/countries-data.json.gz

# Generate split structure
node scripts/generate-data.cjs /tmp/countries-data.json

# Test with new data
npm run build
npm test
```

### Automated Updates

Data updates happen automatically:
- **Schedule:** Weekly on Sundays at 00:00 UTC
- **Process:** Downloads → Transforms → Tests → Creates PR
- **Review:** Check the automated PR before merging

## 🔧 Debugging

### Build Issues

```bash
# Clean all build artifacts
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build with verbose output
npm run build
```

### Test Issues

```bash
# Run tests with debug output
DEBUG=* npm test

# Run single test file
npm run vitest tests/unit/loaders.test.ts

# Update test snapshots
npm run vitest -- -u
```

### CI Failures

1. Check workflow logs in GitHub Actions
2. Run the same commands locally
3. Ensure Node version matches (v20)
4. Verify npm is up to date

## 📖 Documentation

### API Documentation

- Use JSDoc for all public functions
- Include `@param`, `@returns`, `@example`
- Document any warnings or limitations

Example:
```typescript
/**
 * Get all cities in a specific state
 * @param countryCode - ISO2 country code (e.g., 'US')
 * @param stateCode - State code (e.g., 'CA')
 * @returns Promise with array of cities
 * @example
 * ```typescript
 * const cities = await getCitiesOfState('US', 'CA');
 * console.log(cities[0].name); // "Los Angeles"
 * ```
 */
export async function getCitiesOfState(
  countryCode: string,
  stateCode: string
): Promise<ICity[]> {
  // Implementation
}
```

### README Updates

Update the README file for any API changes or usage updates.

## 🎯 Code Style

### TypeScript

- Use strict mode
- Prefer `const` over `let`
- Use explicit return types
- Avoid `any` (use `unknown` if needed)

### Formatting

Code is formatted automatically, but follow these guidelines:
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in objects/arrays
- No semicolons

### Naming Conventions

- Functions: `camelCase`
- Types/Interfaces: `PascalCase` with `I` prefix for interfaces
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

## 🐛 Reporting Issues

### Data Issues

**For any data-related issues** (incorrect country names, missing cities, wrong coordinates, etc.), please report them to the source database repository:

📊 **[Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues)**

This package uses data from the above repository. Data fixes should be made there first, then synced to this package.

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node version, OS, etc.)
- Code samples or screenshots

### Feature Requests

Include:
- Use case and motivation
- Proposed API design
- Examples of usage
- Impact on bundle size

## 💬 Getting Help

- 📖 [Documentation](https://github.com/dr5hn/countrystatecity-countries)
- 🐛 [Issues](https://github.com/dr5hn/countrystatecity-countries/issues)
- 💡 [Discussions](https://github.com/dr5hn/countrystatecity-countries/discussions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the Open Database License (ODbL) v1.0, the same license as the project.
