# Changelog

All notable changes to `@countrystatecity/countries` will be documented in this file.

## [1.0.5] - 2025-12-30

### Added
- Initial public release as standalone package (extracted from monorepo)
- 250+ countries, 5,000+ states, 150,000+ cities
- Lazy-loaded data with dynamic imports
- iOS/Safari compatibility (no stack overflow errors)
- Multi-path fallback for data loading (ESM, CJS, serverless)
- TypeScript types for all data models
- Utility functions: validation, search, timezone lookup
- Deployment guides for Vercel and Vite
- Automated weekly data updates from upstream database
- CI/CD with automated npm publishing

### Fixed
- Warn instead of silently returning null in browser environments
- Data download URL updated to use GitHub Releases

### Changed
- Auto-bump patch version on data updates for automatic publishing
- Standardized README structure across ecosystem
