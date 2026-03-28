/**
 * Dynamic data loaders for @world/countries
 * Uses dynamic import() to enable code-splitting and lazy loading
 * Falls back to fs.readFileSync for CommonJS environments
 */

import type { ICountry, ICountryMeta, IState, ICity } from './types';

// Cache for country code to directory name mapping
let countryDirMap: Map<string, string> | null = null;
let stateDirMaps: Map<string, Map<string, string>> = new Map();

// Helper to check if we're in a Node.js environment
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

// Helper to conditionally import Node.js modules
// Uses webpack magic comment to prevent bundling in client-side code
async function importNodeModule(moduleName: string): Promise<any> {
  if (!isNodeEnvironment()) {
    throw new Error(`Module ${moduleName} is not available in browser environment`);
  }
  
  // The webpackIgnore magic comment tells webpack to not try to bundle this module
  // This works because webpack will see it's a runtime variable and skip it
  switch (moduleName) {
    case 'fs':
      return import(/* webpackIgnore: true */ 'fs');
    case 'path':
      return import(/* webpackIgnore: true */ 'path');
    case 'url':
      return import(/* webpackIgnore: true */ 'url');
    default:
      throw new Error(`Unsupported module: ${moduleName}`);
  }
}

// Helper function to load JSON data
async function loadJSON<T>(path: string): Promise<T> {
  try {
    // Try dynamic import first (works in ESM and bundlers)
    // @vite-ignore - Prevents Vite from analyzing this import
    const module = await import(/* @vite-ignore */ path, { assert: { type: 'json' } } as any);
    return module.default;
  } catch (error) {
    // Fallback to fs for CommonJS/Node environments only
    if (!isNodeEnvironment()) {
      const browserError = new Error(
        `@countrystatecity/countries cannot load data in browser environments. ` +
        `This package is designed for server-side use only. ` +
        `Please use one of these approaches:\n` +
        `1. Create an API endpoint that calls this package on the server\n` +
        `2. Generate static JSON at build time\n` +
        `3. Use in SSR/SSG context only (e.g., SvelteKit load functions, Next.js server components)\n` +
        `See documentation at: https://github.com/dr5hn/countrystatecity/tree/main/packages/countries#readme`
      );
      throw browserError;
    }
    
    try {
      const fs = await importNodeModule('fs');
      const pathModule = await importNodeModule('path');
      const { fileURLToPath } = await importNodeModule('url');
      
      // Resolve path relative to this file
      let basePath: string;
      if (typeof __dirname !== 'undefined') {
        basePath = __dirname;
      } else {
        basePath = pathModule.dirname(fileURLToPath(import.meta.url));
      }
      
      // Try multiple path resolution strategies for different environments
      const possiblePaths = [
        pathModule.join(basePath, path),
        pathModule.join(basePath, '..', path), // In case dist structure is different
        pathModule.join(process.cwd(), 'node_modules', '@countrystatecity', 'countries', 'dist', path), // Vercel/serverless
      ];
      
      let data: string | null = null;
      let lastError: any = null;
      
      for (const fullPath of possiblePaths) {
        try {
          data = fs.readFileSync(fullPath, 'utf-8');
          break;
        } catch (readError) {
          lastError = readError;
          continue;
        }
      }
      
      if (data === null) {
        // If all paths failed, throw the last error with helpful message
        const err: any = new Error(`Failed to load JSON file: ${path}. Tried paths: ${possiblePaths.join(', ')}`);
        err.code = 'MODULE_NOT_FOUND';
        err.originalError = lastError;
        throw err;
      }
      
      return JSON.parse(data);
    } catch (fsError) {
      throw error; // Throw original error if fs also fails
    }
  }
}

// Helper to get country directory name from ISO2 code
async function getCountryDirName(countryCode: string): Promise<string | null> {
  // Initialize map if not already done
  if (!countryDirMap) {
    if (!isNodeEnvironment()) {
      throw new Error('Directory scanning is only available in Node.js environment');
    }
    
    const fs = await importNodeModule('fs');
    const pathModule = await importNodeModule('path');
    
    let basePath: string;
    if (typeof __dirname !== 'undefined') {
      basePath = __dirname;
    } else {
      const { fileURLToPath } = await importNodeModule('url');
      basePath = pathModule.dirname(fileURLToPath(import.meta.url));
    }
    
    const dataDir = pathModule.join(basePath, 'data');
    const dirs = fs.readdirSync(dataDir, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
      .map((d: any) => d.name);
    
    countryDirMap = new Map();
    for (const dir of dirs) {
      // Extract ISO2 code from directory name (format: CountryName-ISO2)
      const parts = dir.split('-');
      const iso2 = parts[parts.length - 1];
      countryDirMap.set(iso2, dir);
    }
  }
  
  return countryDirMap.get(countryCode) || null;
}

// Helper to get state directory name from state code
async function getStateDirName(countryCode: string, stateCode: string): Promise<string | null> {
  const countryDir = await getCountryDirName(countryCode);
  if (!countryDir) return null;
  
  // Check if we have cached state map for this country
  if (!stateDirMaps.has(countryCode)) {
    if (!isNodeEnvironment()) {
      throw new Error('Directory scanning is only available in Node.js environment');
    }
    
    const fs = await importNodeModule('fs');
    const pathModule = await importNodeModule('path');
    
    let basePath: string;
    if (typeof __dirname !== 'undefined') {
      basePath = __dirname;
    } else {
      const { fileURLToPath } = await importNodeModule('url');
      basePath = pathModule.dirname(fileURLToPath(import.meta.url));
    }
    
    const countryPath = pathModule.join(basePath, 'data', countryDir);
    const dirs = fs.readdirSync(countryPath, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
      .map((d: any) => d.name);
    
    const stateMap = new Map<string, string>();
    for (const dir of dirs) {
      // Extract state code from directory name (format: StateName-CODE)
      const parts = dir.split('-');
      const code = parts[parts.length - 1];
      stateMap.set(code, dir);
    }
    stateDirMaps.set(countryCode, stateMap);
  }
  
  return stateDirMaps.get(countryCode)?.get(stateCode) || null;
}

/**
 * Get lightweight list of all countries
 * @returns Promise with array of countries (basic info only)
 * @bundle ~5KB - Loads countries.json
 */
export async function getCountries(): Promise<ICountry[]> {
  return loadJSON<ICountry[]>('./data/countries.json');
}

/**
 * Get full country metadata including timezones and translations
 * @param countryCode - ISO2 country code (e.g., 'US', 'IN')
 * @returns Promise with full country metadata or null if not found
 * @bundle ~5KB per country - Loads {Country-CODE}/meta.json
 */
export async function getCountryByCode(countryCode: string): Promise<ICountryMeta | null> {
  try {
    const countryDir = await getCountryDirName(countryCode);
    if (!countryDir) return null;
    return await loadJSON<ICountryMeta>(`./data/${countryDir}/meta.json`);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('browser') || error.message.includes('Node.js environment'))) {
      console.warn(`@countrystatecity/countries: ${error.message}`);
    }
    // Country not found or file doesn't exist
    return null;
  }
}

/**
 * Get all states/provinces for a specific country
 * @param countryCode - ISO2 country code
 * @returns Promise with array of states or empty array if not found
 * @bundle ~10-100KB depending on country - Loads {Country-CODE}/states.json
 */
export async function getStatesOfCountry(countryCode: string): Promise<IState[]> {
  try {
    const countryDir = await getCountryDirName(countryCode);
    if (!countryDir) return [];
    return await loadJSON<IState[]>(`./data/${countryDir}/states.json`);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('browser') || error.message.includes('Node.js environment'))) {
      console.warn(`@countrystatecity/countries: ${error.message}`);
    }
    // Country not found or has no states
    return [];
  }
}

/**
 * Get specific state by code
 * @param countryCode - ISO2 country code
 * @param stateCode - State code (e.g., 'CA', 'TX')
 * @returns Promise with state object or null if not found
 * @bundle Same as getStatesOfCountry - filters in memory
 */
export async function getStateByCode(
  countryCode: string,
  stateCode: string
): Promise<IState | null> {
  const states = await getStatesOfCountry(countryCode);
  const state = states.find((s) => s.iso2 === stateCode);
  return state || null;
}

/**
 * Get all cities in a specific state
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns Promise with array of cities or empty array if not found
 * @bundle ~5-200KB depending on state - Loads {Country-CODE}/{State-CODE}/cities.json
 */
export async function getCitiesOfState(
  countryCode: string,
  stateCode: string
): Promise<ICity[]> {
  try {
    const countryDir = await getCountryDirName(countryCode);
    if (!countryDir) return [];
    
    const stateDir = await getStateDirName(countryCode, stateCode);
    if (!stateDir) return [];
    
    return await loadJSON<ICity[]>(`./data/${countryDir}/${stateDir}/cities.json`);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('browser') || error.message.includes('Node.js environment'))) {
      console.warn(`@countrystatecity/countries: ${error.message}`);
    }
    // State not found or has no cities
    return [];
  }
}

/**
 * Get ALL cities in an entire country
 * WARNING: Large data size - loads all state city files for the country
 * @param countryCode - ISO2 country code
 * @returns Promise with array of all cities in country
 * @bundle Large - loads multiple city files
 */
export async function getAllCitiesOfCountry(countryCode: string): Promise<ICity[]> {
  const states = await getStatesOfCountry(countryCode);
  const allCities: ICity[] = [];

  // Load cities for each state
  for (const state of states) {
    const cities = await getCitiesOfState(countryCode, state.iso2);
    allCities.push(...cities);
  }

  return allCities;
}

/**
 * Get every city globally
 * WARNING: MASSIVE data (8MB+) - rarely needed, use sparingly
 * @returns Promise with array of all cities worldwide
 * @bundle 8MB+ - loads ALL city files
 */
export async function getAllCitiesInWorld(): Promise<ICity[]> {
  const countries = await getCountries();
  const allCities: ICity[] = [];

  // Load cities for each country
  for (const country of countries) {
    const cities = await getAllCitiesOfCountry(country.iso2);
    allCities.push(...cities);
  }

  return allCities;
}

/**
 * Get specific city by ID
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param cityId - Database city ID
 * @returns Promise with city object or null if not found
 * @bundle Same as getCitiesOfState - filters in memory
 */
export async function getCityById(
  countryCode: string,
  stateCode: string,
  cityId: number
): Promise<ICity | null> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const city = cities.find((c) => c.id === cityId);
  return city || null;
}
