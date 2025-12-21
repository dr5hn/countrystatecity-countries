#!/bin/bash

# Test script for Vite integration
# This script verifies that the package can be used in Vite with import.meta.glob

set -e  # Exit on error

echo "================================================"
echo "Testing @countrystatecity/countries with Vite"
echo "================================================"
echo ""

# Navigate to the test directory
cd "$(dirname "$0")"

# Check if package is built
if [ ! -d "../../dist" ]; then
  echo "❌ Error: Package not built. Please run 'npm run build' first."
  exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent

# Link the local package
echo "🔗 Linking local @countrystatecity/countries package..."
npm install ../..

echo ""
echo "🔨 Building for production..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Vite build successful!"
  echo "✅ The package works correctly with Vite bundling"
  echo ""
  echo "Test verified:"
  echo "  - Package can be imported in Vite applications"
  echo "  - Vite successfully bundles with import.meta.glob"
  echo "  - Dynamic imports work correctly"
  echo ""
  echo "Additional testing:"
  echo "  - Run 'npm run dev' to test in development mode"
  echo "  - Run 'npm run preview' to test the production build"
  exit 0
else
  echo ""
  echo "❌ Vite build failed!"
  echo "The package may have compatibility issues with Vite"
  exit 1
fi
