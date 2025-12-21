/**
 * Utility functions for @world/countries
 */

import type { ICountry, IState, ICity } from './types';
import { getCountries, getStatesOfCountry, getCitiesOfState, getCountryByCode } from './loaders';

/**
 * Validate if a country code exists
 * @param countryCode - ISO2 country code
 * @returns Promise with boolean indicating if country exists
 */
export async function isValidCountryCode(countryCode: string): Promise<boolean> {
  const countries = await getCountries();
  return countries.some((c) => c.iso2 === countryCode);
}

/**
 * Validate if a state code exists in a country
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns Promise with boolean indicating if state exists
 */
export async function isValidStateCode(
  countryCode: string,
  stateCode: string
): Promise<boolean> {
  const states = await getStatesOfCountry(countryCode);
  return states.some((s) => s.iso2 === stateCode);
}

/**
 * Search cities by name (partial match)
 * Note: This loads cities for the specified state only
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param searchTerm - Search term (case-insensitive partial match)
 * @returns Promise with array of matching cities
 */
export async function searchCitiesByName(
  countryCode: string,
  stateCode: string,
  searchTerm: string
): Promise<ICity[]> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const lowerSearchTerm = searchTerm.toLowerCase();
  return cities.filter((city) => city.name.toLowerCase().includes(lowerSearchTerm));
}

/**
 * Get country name from code
 * @param countryCode - ISO2 country code
 * @returns Promise with country name or null if not found
 */
export async function getCountryNameByCode(countryCode: string): Promise<string | null> {
  const countries = await getCountries();
  const country = countries.find((c) => c.iso2 === countryCode);
  return country ? country.name : null;
}

/**
 * Get state name from code
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns Promise with state name or null if not found
 */
export async function getStateNameByCode(
  countryCode: string,
  stateCode: string
): Promise<string | null> {
  const states = await getStatesOfCountry(countryCode);
  const state = states.find((s) => s.iso2 === stateCode);
  return state ? state.name : null;
}

/**
 * Get timezone for specific city
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param cityName - City name
 * @returns Promise with timezone string or null if not found
 */
export async function getTimezoneForCity(
  countryCode: string,
  stateCode: string,
  cityName: string
): Promise<string | null> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const city = cities.find((c) => c.name === cityName);
  return city ? city.timezone : null;
}

/**
 * Get all timezones for country
 * @param countryCode - ISO2 country code
 * @returns Promise with array of timezone names
 */
export async function getCountryTimezones(countryCode: string): Promise<string[]> {
  const countryMeta = await getCountryByCode(countryCode);
  if (!countryMeta || !countryMeta.timezones) {
    return [];
  }
  return countryMeta.timezones.map((tz) => tz.zoneName);
}
