#!/usr/bin/env node
/**
 * Data generation script for @world/countries
 * Converts the monolithic JSON file from countries-states-cities-database
 * into the split structure required by this package
 */

const fs = require('fs');
const path = require('path');

// Helper to create safe directory names (replace spaces with underscores)
function safeDirName(name, code) {
  return `${name.replace(/\s+/g, '_')}-${code}`;
}

// Generate the split data structure
function generateSplitData(sourceFile, outputDir) {
  console.log('📥 Loading source data...');
  const rawData = fs.readFileSync(sourceFile, 'utf-8');
  const countries = JSON.parse(rawData);
  
  console.log(`✓ Loaded ${countries.length} countries`);
  
  // Create output directory
  const dataDir = path.join(outputDir, 'src', 'data');
  if (fs.existsSync(dataDir)) {
    console.log('🗑️  Removing existing data directory...');
    fs.rmSync(dataDir, { recursive: true });
  }
  fs.mkdirSync(dataDir, { recursive: true });
  
  // Generate countries.json (lightweight list)
  console.log('\n📝 Generating countries.json...');
  const countriesList = countries.map(country => ({
    id: country.id,
    name: country.name,
    iso2: country.iso2,
    iso3: country.iso3,
    numeric_code: country.numeric_code,
    phonecode: country.phonecode,
    capital: country.capital,
    currency: country.currency,
    currency_name: country.currency_name,
    currency_symbol: country.currency_symbol,
    tld: country.tld,
    native: country.native,
    region: country.region,
    subregion: country.subregion,
    nationality: country.nationality,
    latitude: country.latitude,
    longitude: country.longitude,
    emoji: country.emoji,
    emojiU: country.emojiU
  }));
  
  fs.writeFileSync(
    path.join(dataDir, 'countries.json'),
    JSON.stringify(countriesList, null, 2)
  );
  console.log(`✓ Created countries.json (${countriesList.length} countries)`);
  
  // Generate per-country data
  let totalStates = 0;
  let totalCities = 0;
  let countriesWithData = 0;
  
  countries.forEach((country, idx) => {
    const countryDir = safeDirName(country.name, country.iso2);
    const countryPath = path.join(dataDir, countryDir);
    
    if ((idx + 1) % 50 === 0) {
      console.log(`  Processing country ${idx + 1}/${countries.length}...`);
    }
    
    // Skip if no states
    if (!country.states || country.states.length === 0) {
      return;
    }
    
    countriesWithData++;
    fs.mkdirSync(countryPath, { recursive: true });
    
    // Create meta.json with full country data including timezones
    const meta = {
      ...countriesList.find(c => c.id === country.id),
      timezones: country.timezones,
      translations: country.translations
    };
    fs.writeFileSync(
      path.join(countryPath, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );
    
    // Create states.json
    const statesList = country.states.map(state => ({
      id: state.id,
      name: state.name,
      country_id: country.id,
      country_code: country.iso2,
      fips_code: null, // Not in source data
      iso2: state.iso2,
      type: state.type,
      latitude: state.latitude,
      longitude: state.longitude,
      native: state.native || null,
      timezone: state.timezone || null,
      translations: {} // Not in source data for states
    }));
    
    fs.writeFileSync(
      path.join(countryPath, 'states.json'),
      JSON.stringify(statesList, null, 2)
    );
    totalStates += statesList.length;
    
    // Create per-state city files
    country.states.forEach(state => {
      if (!state.cities || state.cities.length === 0) {
        return;
      }
      
      const stateDir = safeDirName(state.name, state.iso2);
      const statePath = path.join(countryPath, stateDir);
      fs.mkdirSync(statePath, { recursive: true });
      
      const citiesList = state.cities.map(city => ({
        id: city.id,
        name: city.name,
        state_id: state.id,
        state_code: state.iso2,
        country_id: country.id,
        country_code: country.iso2,
        latitude: city.latitude,
        longitude: city.longitude,
        native: null, // Not in source data
        timezone: city.timezone || null,
        translations: {} // Not in source data for cities
      }));
      
      fs.writeFileSync(
        path.join(statePath, 'cities.json'),
        JSON.stringify(citiesList, null, 2)
      );
      totalCities += citiesList.length;
    });
  });
  
  console.log('\n✅ Data generation complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Countries: ${countries.length}`);
  console.log(`   - Countries with states/cities: ${countriesWithData}`);
  console.log(`   - States: ${totalStates}`);
  console.log(`   - Cities: ${totalCities}`);
  console.log(`   - Output directory: ${dataDir}`);
}

// Main execution
const sourceFile = process.argv[2] || '/tmp/countries-data.json';
const outputDir = process.argv[3] || path.join(__dirname, '..');

if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Error: Source file not found: ${sourceFile}`);
  console.log('\nUsage: node generate-data.js <source-file> [output-dir]');
  console.log('\nExample:');
  console.log('  node generate-data.js /tmp/countries-data.json');
  process.exit(1);
}

generateSplitData(sourceFile, outputDir);
