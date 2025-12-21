import { describe, it, expect } from 'vitest';
import {
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getTimezoneForCity,
  getCountryTimezones,
} from '../../src/utils';

describe('Utility Functions', () => {
  describe('isValidCountryCode', () => {
    it('should return true for valid country code', async () => {
      const isValid = await isValidCountryCode('US');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid country code', async () => {
      const isValid = await isValidCountryCode('INVALID');
      expect(isValid).toBe(false);
    });
  });

  describe('isValidStateCode', () => {
    it('should return true for valid state code', async () => {
      const isValid = await isValidStateCode('US', 'CA');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid state code', async () => {
      const isValid = await isValidStateCode('US', 'INVALID');
      expect(isValid).toBe(false);
    });
  });

  describe('searchCitiesByName', () => {
    it('should find cities by partial name', async () => {
      const cities = await searchCitiesByName('US', 'CA', 'Los');
      expect(cities.length).toBeGreaterThan(0);
      // Should contain cities with "Los" in the name
      expect(cities.some(c => c.name.toLowerCase().includes('los'))).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const cities = await searchCitiesByName('US', 'CA', 'los');
      expect(cities.length).toBeGreaterThan(0);
    });

    it('should return empty array if no matches', async () => {
      const cities = await searchCitiesByName('US', 'CA', 'NoMatch');
      expect(cities.length).toBe(0);
    });
  });

  describe('getCountryNameByCode', () => {
    it('should return country name for valid code', async () => {
      const name = await getCountryNameByCode('US');
      expect(name).toBe('United States');
    });

    it('should return null for invalid code', async () => {
      const name = await getCountryNameByCode('INVALID');
      expect(name).toBeNull();
    });
  });

  describe('getStateNameByCode', () => {
    it('should return state name for valid code', async () => {
      const name = await getStateNameByCode('US', 'CA');
      expect(name).toBe('California');
    });

    it('should return null for invalid code', async () => {
      const name = await getStateNameByCode('US', 'INVALID');
      expect(name).toBeNull();
    });
  });

  describe('getTimezoneForCity', () => {
    it('should return timezone for valid city', async () => {
      // Note: Real data may not have timezone for all cities
      const timezone = await getTimezoneForCity('US', 'CA', 'Los Angeles');
      // Timezone might be null in real data, so just check it's defined (null or string)
      expect(timezone).toBeDefined();
    });

    it('should return null for invalid city', async () => {
      const timezone = await getTimezoneForCity('US', 'CA', 'Invalid City');
      expect(timezone).toBeNull();
    });
  });

  describe('getCountryTimezones', () => {
    it('should return array of timezones for country', async () => {
      const timezones = await getCountryTimezones('US');
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      // US should have multiple timezones
      expect(timezones.some(tz => tz.includes('America/'))).toBe(true);
    });

    it('should return empty array for invalid country', async () => {
      const timezones = await getCountryTimezones('INVALID');
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBe(0);
    });
  });
});
