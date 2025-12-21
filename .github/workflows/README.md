# GitHub Actions Workflows

This directory contains automated workflows for the @countrystatecity package ecosystem.

## Workflows

### 1. CI (`ci.yml`)

**Triggers:** Push to main/develop, Pull requests

Runs on every push and PR to ensure code quality:
- ✅ Installs dependencies
- ✅ Runs type checking
- ✅ Runs all tests (42 tests)
- ✅ Builds all packages
- ✅ Checks bundle sizes
- ✅ Runs iOS compatibility tests on macOS

### 2. Update Data (`update-data.yml`)

**Triggers:**
- Weekly schedule (Sundays at 00:00 UTC)
- Manual dispatch via GitHub UI

Automatically updates the countries/states/cities data:
- 📥 Downloads latest data from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)
- 🔄 Transforms into split structure
- 🧪 Builds and tests with new data
- 📝 Creates PR if changes detected
- ✅ Auto-labels with `automated` and `data-update`

**To manually trigger:**
1. Go to Actions tab
2. Select "Update Data" workflow
3. Click "Run workflow"

### 3. Publish to NPM (`publish.yml`)

**Triggers:**
- Push to main (when package.json or src changes)
- Manual dispatch

Publishes packages to NPM:
- 📦 Builds all packages
- 🧪 Runs tests
- 🔍 Checks if version already published
- 📤 Publishes to NPM (requires NPM_TOKEN secret)
- 🏷️ Creates GitHub release

**Setup Required:**
Add `NPM_TOKEN` to repository secrets:
1. Generate token at https://www.npmjs.com/settings/tokens
2. Add to Settings > Secrets and variables > Actions
3. Name: `NPM_TOKEN`

## Monitoring

### CI Status
Check the status of builds and tests:
- Badge: `[![CI](https://github.com/dr5hn/countrystatecity/workflows/CI/badge.svg)](https://github.com/dr5hn/countrystatecity/actions/workflows/ci.yml)`

### Data Updates
Review automated data update PRs:
- Filter by label: `automated`, `data-update`
- Check test results before merging

## Maintenance

### Updating Data Schedule
Edit `update-data.yml` cron expression:
```yaml
schedule:
  - cron: '0 0 * * 0'  # Weekly on Sunday
  # or
  - cron: '0 0 * * *'  # Daily
  # or
  - cron: '0 0 1 * *'  # Monthly on 1st
```

### Testing Workflows Locally
Use [act](https://github.com/nektos/act) to test workflows:
```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act -j lint-test-build

# Run data update workflow
act -j update-data
```

## Troubleshooting

### CI Failures
1. Check test results in workflow logs
2. Run tests locally: `npm test`
3. Ensure all dependencies installed: `npm install`

### Data Update Failures
1. Check if source URL is accessible
2. Verify data generation script works: `cd packages/countries && node scripts/generate-data.cjs /tmp/countries-data.json`
3. Review workflow logs for specific errors

### Publish Failures
1. Verify NPM_TOKEN is valid
2. Check package version isn't already published
3. Ensure all tests pass locally
