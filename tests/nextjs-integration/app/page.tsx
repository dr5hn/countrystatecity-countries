'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [status, setStatus] = useState<string>('Testing...');
  const [countries, setCountries] = useState<number>(0);
  const [states, setStates] = useState<number>(0);
  const [cities, setCities] = useState<number>(0);

  useEffect(() => {
    // Dynamic import to test webpack bundling
    import('@countrystatecity/countries')
      .then(async (module) => {
        const countriesData = await module.getCountries();
        setCountries(countriesData.length);
        
        const usStates = await module.getStatesOfCountry('US');
        setStates(usStates.length);
        
        const caCities = await module.getCitiesOfState('US', 'CA');
        setCities(caCities.length);
        
        setStatus('✅ Success!');
      })
      .catch((error) => {
        setStatus(`❌ Error: ${error.message}`);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>NextJS Integration Test</h1>
      <p><strong>Status:</strong> {status}</p>
      
      {countries > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Test Results:</h2>
          <ul>
            <li>✓ Loaded {countries} countries</li>
            <li>✓ Loaded {states} US states</li>
            <li>✓ Loaded {cities} California cities</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: status.includes('Success') ? '#e8f5e9' : '#fff3cd', borderRadius: '4px' }}>
        <strong>Result:</strong> {status.includes('Success') 
          ? 'The package builds correctly with NextJS webpack bundler!' 
          : 'Testing in progress or error occurred'}
      </div>
    </div>
  );
}
