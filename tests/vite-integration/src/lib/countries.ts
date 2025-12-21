/**
 * Browser-compatible wrapper for @countrystatecity/countries
 * Uses Vite's import.meta.glob to bypass Node.js file system dependency
 * 
 * Credits: Community solution by @tech-andgar and @sweethuman
 */

import type { ICity, ICountry, IState } from '@countrystatecity/countries';

// Lazy-load the countries list
const getCountriesModule = () => import('@countrystatecity/countries/data/countries.json');

// Map of state loaders - Vite will split these into separate chunks
const stateModules = import.meta.glob(
  '/node_modules/@countrystatecity/countries/dist/data/*/states.json'
);

// Map of city loaders - Vite will split these into separate chunks
const cityModules = import.meta.glob(
  '/node_modules/@countrystatecity/countries/dist/data/*/*/cities.json'
);

/**
 * Get lightweight list of all countries
 * @returns Promise with array of countries (basic info only)
 * @bundle ~5KB - Loads countries.json
 */
export async function getCountries(): Promise<ICountry[]> {
  const module = await getCountriesModule();
  return (module as any).default as ICountry[];
}

/**
 * Get all states/provinces for a specific country
 * @param countryCode - ISO2 country code
 * @returns Promise with array of states or empty array if not found
 * @bundle ~10-100KB depending on country - Loads lazily
 */
export async function getStatesOfCountry(countryCode: string): Promise<IState[]> {
  if (!countryCode) return [];

  // Find the module that matches the country code
  // Key format: /node_modules/@countrystatecity/countries/dist/data/{CountryName}-{CountryCode}/states.json
  const key = Object.keys(stateModules).find((k) => 
    k.includes(`-${countryCode}/states.json`)
  );

  if (!key) {
    console.warn(`No states found for country code: ${countryCode}`);
    return [];
  }

  try {
    const loader = stateModules[key];
    if (!loader) return [];
    const module = await loader();
    return (module as any).default as IState[];
  } catch (error) {
    console.error(`Failed to load states for ${countryCode}:`, error);
    return [];
  }
}

/**
 * Get all cities in a specific state
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns Promise with array of cities or empty array if not found
 * @bundle ~5-200KB depending on state - Loads lazily
 */
export async function getCitiesOfState(
  countryCode: string, 
  stateCode: string
): Promise<ICity[]> {
  if (!countryCode || !stateCode) return [];

  // Find the module that matches the country and state code
  // Key format: /node_modules/@countrystatecity/countries/dist/data/{CountryName}-{CountryCode}/{StateName}-{StateCode}/cities.json
  const key = Object.keys(cityModules).find((k) =>
    k.includes(`-${countryCode}/`) && k.includes(`-${stateCode}/cities.json`)
  );

  if (!key) {
    console.warn(`No cities found for country: ${countryCode}, state: ${stateCode}`);
    return [];
  }

  try {
    const loader = cityModules[key];
    if (!loader) return [];
    const module = await loader();
    return (module as any).default as ICity[];
  } catch (error) {
    console.error(`Failed to load cities for ${countryCode}, ${stateCode}:`, error);
    return [];
  }
}
