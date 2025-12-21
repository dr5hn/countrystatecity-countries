import { describe, it, expect } from 'vitest';
import {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getCityById,
} from '../../src/loaders';

describe('Data Loaders', () => {
  describe('getCountries', () => {
    it('should return array of countries', async () => {
      const countries = await getCountries();
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);
    });

    it('should have required country properties', async () => {
      const countries = await getCountries();
      const country = countries[0];
      
      expect(country).toHaveProperty('id');
      expect(country).toHaveProperty('name');
      expect(country).toHaveProperty('iso2');
      expect(country).toHaveProperty('iso3');
      expect(country).toHaveProperty('phonecode');
      expect(country).toHaveProperty('currency');
      expect(country).toHaveProperty('emoji');
    });

    it('should not include timezones in country list', async () => {
      const countries = await getCountries();
      const country = countries[0];
      expect(country).not.toHaveProperty('timezones');
    });
  });

  describe('getCountryByCode', () => {
    it('should return country metadata with timezones', async () => {
      const country = await getCountryByCode('US');
      expect(country).not.toBeNull();
      expect(country?.name).toBe('United States');
      expect(country?.timezones).toBeDefined();
      expect(Array.isArray(country?.timezones)).toBe(true);
      expect(country?.translations).toBeDefined();
    });

    it('should return null for invalid country code', async () => {
      const country = await getCountryByCode('INVALID');
      expect(country).toBeNull();
    });
  });

  describe('getStatesOfCountry', () => {
    it('should return array of states for valid country', async () => {
      const states = await getStatesOfCountry('US');
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });

    it('should have required state properties', async () => {
      const states = await getStatesOfCountry('US');
      const state = states[0];
      
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('name');
      expect(state).toHaveProperty('country_code');
      expect(state).toHaveProperty('iso2');
    });

    it('should return empty array for invalid country', async () => {
      const states = await getStatesOfCountry('INVALID');
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBe(0);
    });
  });

  describe('getStateByCode', () => {
    it('should return specific state', async () => {
      const state = await getStateByCode('US', 'CA');
      expect(state).not.toBeNull();
      expect(state?.name).toBe('California');
      expect(state?.iso2).toBe('CA');
    });

    it('should return null for invalid state code', async () => {
      const state = await getStateByCode('US', 'INVALID');
      expect(state).toBeNull();
    });
  });

  describe('getCitiesOfState', () => {
    it('should return array of cities for valid state', async () => {
      const cities = await getCitiesOfState('US', 'CA');
      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBeGreaterThan(0);
    });

    it('should have required city properties', async () => {
      const cities = await getCitiesOfState('US', 'CA');
      const city = cities[0];
      
      expect(city).toHaveProperty('id');
      expect(city).toHaveProperty('name');
      expect(city).toHaveProperty('state_code');
      expect(city).toHaveProperty('country_code');
      expect(city).toHaveProperty('latitude');
      expect(city).toHaveProperty('longitude');
    });

    it('should return empty array for invalid state', async () => {
      const cities = await getCitiesOfState('US', 'INVALID');
      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBe(0);
    });
  });

  describe('getCityById', () => {
    it('should return specific city by ID', async () => {
      // Use a real city ID from the actual data
      const city = await getCityById('US', 'CA', 110992);
      expect(city).not.toBeNull();
      expect(city?.name).toBeDefined();
      expect(city?.country_code).toBe('US');
      expect(city?.state_code).toBe('CA');
    });

    it('should return null for invalid city ID', async () => {
      const city = await getCityById('US', 'CA', 99999999);
      expect(city).toBeNull();
    });
  });
});
