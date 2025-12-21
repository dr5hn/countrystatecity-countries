import { useState, useEffect } from 'react';
import { getCountries, getStatesOfCountry, getCitiesOfState } from './lib/countries';
import type { ICountry, IState, ICity } from '@countrystatecity/countries';
import './App.css';

function App() {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState({ 
    countries: true, 
    states: false, 
    cities: false 
  });

  // Load countries on mount
  useEffect(() => {
    getCountries().then(data => {
      setCountries(data);
      setLoading(prev => ({ ...prev, countries: false }));
    });
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setSelectedState('');
      return;
    }
    
    setLoading(prev => ({ ...prev, states: true }));
    getStatesOfCountry(selectedCountry).then(data => {
      setStates(data);
      setLoading(prev => ({ ...prev, states: false }));
    });
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (!selectedCountry || !selectedState) {
      setCities([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, cities: true }));
    getCitiesOfState(selectedCountry, selectedState).then(data => {
      setCities(data);
      setLoading(prev => ({ ...prev, cities: false }));
    });
  }, [selectedCountry, selectedState]);

  return (
    <div className="App">
      <h1>Vite + @countrystatecity/countries</h1>
      <p className="success">
        ✅ Successfully using @countrystatecity/countries in Vite browser environment!
      </p>
      
      <div className="card">
        <div className="form-group">
          <label htmlFor="country">Country:</label>
          <select 
            id="country"
            value={selectedCountry} 
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedState('');
            }}
            disabled={loading.countries}
          >
            <option value="">
              {loading.countries ? 'Loading countries...' : 'Select Country'}
            </option>
            {countries.map(country => (
              <option key={country.iso2} value={country.iso2}>
                {country.emoji} {country.name}
              </option>
            ))}
          </select>
          <small>Loaded {countries.length} countries</small>
        </div>

        {selectedCountry && (
          <div className="form-group">
            <label htmlFor="state">State:</label>
            <select 
              id="state"
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={loading.states}
            >
              <option value="">
                {loading.states ? 'Loading states...' : 'Select State'}
              </option>
              {states.map(state => (
                <option key={state.iso2} value={state.iso2}>
                  {state.name}
                </option>
              ))}
            </select>
            <small>Loaded {states.length} states (lazy-loaded)</small>
          </div>
        )}

        {selectedCountry && selectedState && (
          <div className="form-group">
            <label htmlFor="city">City:</label>
            <select 
              id="city"
              disabled={loading.cities}
            >
              <option value="">
                {loading.cities ? 'Loading cities...' : 'Select City'}
              </option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <small>Loaded {cities.length} cities (lazy-loaded)</small>
          </div>
        )}
      </div>

      <div className="info">
        <h3>How This Works</h3>
        <ul>
          <li>✅ Uses Vite's <code>import.meta.glob</code> to access JSON files</li>
          <li>✅ No backend API required</li>
          <li>✅ Automatic code splitting and lazy loading</li>
          <li>✅ Small initial bundle (~5KB)</li>
          <li>✅ Data loaded on-demand</li>
        </ul>
        <p>
          Open DevTools Network tab to see chunks loading on-demand!
        </p>
      </div>
    </div>
  );
}

export default App;
