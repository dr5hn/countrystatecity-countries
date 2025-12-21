import { describe, it, expect } from 'vitest';
import {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getCitiesOfState,
  getAllCitiesOfCountry,
} from '../../src';

/**
 * Integration tests demonstrating real-world usage patterns
 */
describe('API Integration Tests', () => {
  it('should handle typical country-state-city selection flow', async () => {
    // Step 1: Load countries for dropdown
    const countries = await getCountries();
    expect(countries.length).toBeGreaterThan(0);
    
    // Step 2: User selects USA
    const usaCountry = countries.find(c => c.iso2 === 'US');
    expect(usaCountry).toBeDefined();
    expect(usaCountry?.name).toBe('United States');
    
    // Step 3: Load states for USA
    const states = await getStatesOfCountry('US');
    expect(states.length).toBeGreaterThan(0);
    
    // Step 4: User selects California
    const californiaState = states.find(s => s.iso2 === 'CA');
    expect(californiaState).toBeDefined();
    expect(californiaState?.name).toBe('California');
    
    // Step 5: Load cities for California
    const cities = await getCitiesOfState('US', 'CA');
    expect(cities.length).toBeGreaterThan(0);
    
    // Step 6: User selects Los Angeles
    const laCity = cities.find(c => c.name === 'Los Angeles');
    expect(laCity).toBeDefined();
    expect(laCity?.latitude).toBeDefined();
    expect(laCity?.longitude).toBeDefined();
  });

  it('should load detailed country information with timezones', async () => {
    const countryMeta = await getCountryByCode('US');
    
    expect(countryMeta).not.toBeNull();
    expect(countryMeta?.timezones).toBeDefined();
    expect(countryMeta?.timezones.length).toBeGreaterThan(0);
    expect(countryMeta?.translations).toBeDefined();
    
    // Should have timezone data
    const firstTimezone = countryMeta?.timezones[0];
    expect(firstTimezone?.zoneName).toBeDefined();
    expect(firstTimezone?.gmtOffset).toBeDefined();
    expect(firstTimezone?.abbreviation).toBeDefined();
  });

  it('should handle loading all cities for a country', async () => {
    // This loads data for all states in India
    const allCities = await getAllCitiesOfCountry('IN');
    
    expect(allCities).toBeDefined();
    expect(allCities.length).toBeGreaterThan(0);
    
    // All cities should be from India
    expect(allCities.every(c => c.country_code === 'IN')).toBe(true);
  });

  it('should handle invalid country codes gracefully', async () => {
    const invalidCountry = await getCountryByCode('INVALID');
    expect(invalidCountry).toBeNull();
    
    const invalidStates = await getStatesOfCountry('INVALID');
    expect(invalidStates).toEqual([]);
    
    const invalidCities = await getCitiesOfState('INVALID', 'INVALID');
    expect(invalidCities).toEqual([]);
  });

  it('should work with different countries', async () => {
    // Test with India
    const inStates = await getStatesOfCountry('IN');
    expect(inStates.length).toBeGreaterThan(0);
    
    const delhiState = inStates.find(s => s.iso2 === 'DL');
    expect(delhiState).toBeDefined();
    expect(delhiState?.name).toBe('Delhi');
    
    const delhiCities = await getCitiesOfState('IN', 'DL');
    expect(delhiCities.length).toBeGreaterThan(0);
    // Check that Delhi is in the list of cities
    expect(delhiCities.some(c => c.name === 'New Delhi' || c.name === 'Delhi')).toBe(true);
  });
});
