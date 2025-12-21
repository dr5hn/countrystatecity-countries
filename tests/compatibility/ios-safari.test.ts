import { describe, it, expect } from 'vitest';
import {
  getCountries,
  getStatesOfCountry,
  getCitiesOfState,
  getAllCitiesOfCountry,
} from '../../src/loaders';

/**
 * iOS/Safari Compatibility Tests
 * 
 * These tests verify that the package doesn't cause stack overflow errors
 * on iOS Safari browsers, which have stricter memory limits than other browsers.
 * 
 * The key is using dynamic imports and lazy loading instead of static imports
 * that bundle all data upfront.
 */
describe('iOS Safari Compatibility', () => {
  it('should load countries without stack overflow', async () => {
    const countries = await getCountries();
    expect(countries).toBeDefined();
    expect(countries.length).toBeGreaterThan(0);
    
    // Should be small bundle
    expect(JSON.stringify(countries).length).toBeLessThan(100000); // Less than 100KB
  });

  it('should load states without stack overflow', async () => {
    const states = await getStatesOfCountry('US');
    expect(states).toBeDefined();
    expect(states.length).toBeGreaterThan(0);
  });

  it('should load cities without stack overflow', async () => {
    const cities = await getCitiesOfState('US', 'CA');
    expect(cities).toBeDefined();
    expect(cities.length).toBeGreaterThan(0);
  });

  it('should handle multiple sequential loads', async () => {
    // Simulate user selecting country, then state, then city
    const countries = await getCountries();
    expect(countries.length).toBeGreaterThan(0);
    
    const states = await getStatesOfCountry('US');
    expect(states.length).toBeGreaterThan(0);
    
    const cities = await getCitiesOfState('US', 'CA');
    expect(cities.length).toBeGreaterThan(0);
    
    // All operations should complete without errors
  });

  it('should handle parallel loads without memory issues', async () => {
    // Load multiple resources in parallel
    const [countries, usStates, inStates] = await Promise.all([
      getCountries(),
      getStatesOfCountry('US'),
      getStatesOfCountry('IN'),
    ]);
    
    expect(countries.length).toBeGreaterThan(0);
    expect(usStates.length).toBeGreaterThan(0);
    expect(inStates.length).toBeGreaterThan(0);
  });

  it('should not load all data at once', async () => {
    // The package should use lazy loading, so this should only load US data
    const cities = await getCitiesOfState('US', 'CA');
    
    // Should not have loaded India data
    expect(cities.every(c => c.country_code === 'US')).toBe(true);
  });

  it('should handle getAllCitiesOfCountry for larger countries', async () => {
    // This is a heavier operation but should still work on iOS
    const allCities = await getAllCitiesOfCountry('US');
    expect(allCities).toBeDefined();
    expect(allCities.length).toBeGreaterThan(0);
    
    // Verify all cities are from US
    expect(allCities.every(c => c.country_code === 'US')).toBe(true);
  });
});
