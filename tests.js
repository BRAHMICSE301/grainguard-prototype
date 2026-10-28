/* Run with: node tests.js */
'use strict';
const assert = require('assert');
const L = require('./lib.js');

let passed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { console.error('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

t('parseAddress: city and state', () => {
  const p = L.parseAddress({ address: { city: 'Gurugram', state_district: 'Gurugram', state: 'Haryana', postcode: '122001', suburb: 'Sector 14' } });
  assert.strictEqual(p.headline, 'Gurugram, Haryana');
  assert.strictEqual(p.locality, 'Sector 14');
  assert.strictEqual(p.district, 'Gurugram');
  assert.strictEqual(p.postcode, '122001');
});
t('parseAddress: village falls back when no city', () => {
  const p = L.parseAddress({ address: { village: 'Khandsa', county: 'Gurugram', state: 'Haryana' } });
  assert.strictEqual(p.headline, 'Khandsa, Haryana');
});
t('parseAddress: de-duplicates city equal to state', () => {
  const p = L.parseAddress({ address: { city: 'Delhi', state: 'Delhi' } });
  assert.strictEqual(p.headline, 'Delhi');
});
t('parseAddress: empty or missing input gives empty headline', () => {
  assert.strictEqual(L.parseAddress({}).headline, '');
  assert.strictEqual(L.parseAddress(null).headline, '');
});

t('haversine: zero distance and a known pair', () => {
  assert.strictEqual(L.haversineKm(28.4595, 77.0266, 28.4595, 77.0266), 0);
  const d = L.haversineKm(28.6139, 77.2090, 28.4595, 77.0266); /* Delhi to Gurugram, roughly 23 km */
  assert.ok(d > 20 && d < 27, 'distance was ' + d);
});

t('storageRisk: low, medium, high', () => {
  assert.strictEqual(L.storageRisk({ temp: 24, humidity: 45, rainProb: 5 }).level, 'low');
  assert.strictEqual(L.storageRisk({ temp: 30, humidity: 70, rainProb: 10 }).level, 'medium');
  assert.strictEqual(L.storageRisk({ temp: 31, humidity: 85, rainProb: 70 }).level, 'high');
});
t('storageRisk: tolerates missing rain probability', () => {
  const r = L.storageRisk({ temp: 30, humidity: 50, rainProb: null });
  assert.strictEqual(r.level, 'low');
  assert.ok(r.reasons.length >= 1);
});

t('monitor thresholds', () => {
  assert.strictEqual(L.fieldStatus('humidity', 69.9), 'ok');
  assert.strictEqual(L.fieldStatus('humidity', 70), 'warn');
  assert.strictEqual(L.fieldStatus('humidity', 80), 'danger');
  assert.strictEqual(L.readingStatus({ temp: 25, humidity: 50, moisture: 14.1 }), 'danger');
  assert.strictEqual(L.readingStatus({ temp: 25, humidity: 50, moisture: 10 }), 'ok');
});

t('buildOverpassQuery: clamps radius and includes coordinates', () => {
  const q = L.buildOverpassQuery('storage', 28.4595, 77.0266, 999999);
  assert.ok(q.includes('around:50000,28.45950,77.02660'));
  assert.ok(q.includes('"building"="warehouse"'));
  const s = L.buildOverpassQuery('support', 28, 77, 25000);
  assert.ok(s.includes('"shop"="agrarian"'));
  assert.ok(L.buildOverpassQuery('storage', 28, 77, 'abc').includes('around:25000'));
  assert.ok(!s.includes('~'), 'support query should not use slow regex matching');
  assert.ok(s.includes('[timeout:15]'));
});

t('parseOverpass: nodes, ways with center, unnamed fallback, sorting', () => {
  const json = { elements: [
    { type: 'way', id: 1, center: { lat: 28.50, lon: 77.05 }, tags: { building: 'warehouse' } },
    { type: 'node', id: 2, lat: 28.47, lon: 77.03, tags: { name: 'Far Silo', man_made: 'silo' } },
    { type: 'node', id: 3, lat: 28.46, lon: 77.03, tags: { name: 'Near Store', operator: 'State Warehousing Corporation' } },
    { type: 'relation', id: 4, tags: { name: 'No coordinates' } }
  ] };
  const out = L.parseOverpass(json, 28.4595, 77.0266, 'storage');
  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[0].name, 'Near Store');
  assert.strictEqual(out[1].name, 'Far Silo');
  assert.ok(out[2].name.includes('unnamed'));
  assert.strictEqual(out[0].operator, 'State Warehousing Corporation');
});
t('parseOverpass: empty or bad input', () => {
  assert.deepStrictEqual(L.parseOverpass(null, 0, 0, 'storage'), []);
  assert.deepStrictEqual(L.parseOverpass({}, 0, 0, 'storage'), []);
});

t('weatherLabel and greeting', () => {
  assert.strictEqual(L.weatherLabel(0), 'Clear sky');
  assert.strictEqual(L.weatherLabel(12345), 'Conditions unavailable');
  assert.strictEqual(L.greeting(9), 'Good morning');
  assert.strictEqual(L.greeting(14), 'Good afternoon');
  assert.strictEqual(L.greeting(20), 'Good evening');
});

console.log('\n' + passed + ' checks passed' + (process.exitCode ? ', with failures' : ''));
