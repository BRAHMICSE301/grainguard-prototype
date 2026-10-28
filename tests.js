/* Run with: node tests.js */
'use strict';
const assert = require('assert');
const L = require('./lib.js');
const I = require('./i18n.js');

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
  assert.ok(s.includes('[timeout:20]'));
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
  assert.strictEqual(out[2].name, '');
  assert.strictEqual(out[2].kindKey, 'k_warehouse');
  assert.strictEqual(out[1].kindKey, 'k_silo');
  assert.strictEqual(out[0].operator, 'State Warehousing Corporation');
});
t('parseOverpass: empty or bad input', () => {
  assert.deepStrictEqual(L.parseOverpass(null, 0, 0, 'storage'), []);
  assert.deepStrictEqual(L.parseOverpass({}, 0, 0, 'storage'), []);
});

t('nominatimViewbox: order and size', () => {
  const [l, tp, r, b] = L.nominatimViewbox(28.4, 77.3, 25).split(',').map(Number);
  assert.ok(l < 77.3 && r > 77.3 && tp > 28.4 && b < 28.4);
  assert.ok(Math.abs((tp - b) - 2 * 25 / 111) < 0.01);
});
t('parseNominatimPlaces: dedupe, trim, sort, names', () => {
  const list = [
    { osm_type: 'node', osm_id: 1, lat: '28.41', lon: '77.31', name: 'Kisan Godown' },
    { osm_type: 'node', osm_id: 1, lat: '28.41', lon: '77.31', name: 'Kisan Godown' },
    { osm_type: 'way', osm_id: 2, lat: '28.50', lon: '77.40', display_name: 'City Warehouse, Faridabad, Haryana' },
    { osm_type: 'way', osm_id: 3, lat: '29.9', lon: '78.9', name: 'Too far' },
    { osm_type: 'way', osm_id: 4, lat: 'bad', lon: '77', name: 'Broken' }
  ];
  const out = L.parseNominatimPlaces(list, 28.4, 77.3, 25);
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].name, 'Kisan Godown');
  assert.strictEqual(out[1].name, 'City Warehouse');
  assert.deepStrictEqual(L.parseNominatimPlaces(null, 0, 0, 10), []);
});

t('weatherKey and greetingKey', () => {
  assert.strictEqual(L.weatherKey(0), 'wx_0');
  assert.strictEqual(L.weatherKey(95), 'wx_95');
  assert.strictEqual(L.weatherKey(12345), 'wx_unknown');
  assert.strictEqual(L.greetingKey(9), 'greet_morning');
  assert.strictEqual(L.greetingKey(14), 'greet_afternoon');
  assert.strictEqual(L.greetingKey(20), 'greet_evening');
});

t('storageRisk returns message keys that exist in both languages', () => {
  const r = L.storageRisk({ temp: 38, humidity: 85, rainProb: 70 });
  const keys = r.reasons.map(x => x.key).concat([r.adviceKey, 'risk_' + r.level]);
  keys.forEach(k => { assert.ok(I.STRINGS.en[k] && I.STRINGS.hi[k], 'missing key ' + k); });
  assert.strictEqual(r.level, 'high');
  assert.strictEqual(r.reasons.length, 3);
  assert.strictEqual(r.reasons[0].n, 85);
});

t('every weather code the app can return has English and Hindi text', () => {
  [0, 1, 2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 66, 67, 71, 73, 75, 80, 81, 82, 95, 96, 99, 'x'].forEach(c => {
    const k = L.weatherKey(c);
    assert.ok(I.STRINGS.en[k] && I.STRINGS.hi[k], 'missing ' + k);
  });
});

/* ---------- i18n ---------- */
const DEVANAGARI = /[ऀ-ॿ]/;
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');

t('i18n: English and Hindi have exactly the same keys', () => {
  const en = Object.keys(I.STRINGS.en).sort();
  const hi = Object.keys(I.STRINGS.hi).sort();
  assert.deepStrictEqual(en, hi);
  assert.ok(en.length > 150, 'only ' + en.length + ' keys');
});
t('i18n: every Hindi string is Devanagari and no string is empty', () => {
  Object.keys(I.STRINGS.en).forEach((k) => {
    assert.ok(I.STRINGS.en[k].length > 0, 'empty en ' + k);
    assert.ok(DEVANAGARI.test(I.STRINGS.hi[k]), 'Hindi text missing for ' + k);
  });
});
t('i18n: placeholders like {n} match between languages', () => {
  Object.keys(I.STRINGS.en).forEach((k) => {
    assert.strictEqual(placeholders(I.STRINGS.hi[k]), placeholders(I.STRINGS.en[k]), 'placeholder mismatch in ' + k);
  });
});
t('i18n: no em dashes in any text', () => {
  ['en', 'hi'].forEach((l) => Object.keys(I.STRINGS[l]).forEach((k) => {
    assert.ok(!I.STRINGS[l][k].includes('—'), 'em dash in ' + l + ':' + k);
  }));
});
t('i18n: t(), parameters, fallback and language choice', () => {
  I.setLang('en');
  assert.strictEqual(I.t('area_yours', { a: 'Gurugram, Haryana' }), 'Your area: Gurugram, Haryana');
  I.setLang('hi');
  assert.strictEqual(I.t('area_yours', { a: 'गुरुग्राम, हरियाणा' }), 'आपका इलाका: गुरुग्राम, हरियाणा');
  assert.strictEqual(I.t('no_such_key'), 'no_such_key');
  assert.strictEqual(I.tIn('en', 'btn_detect'), 'Use My Current Location');
  assert.strictEqual(I.setLang('fr'), 'en');
  assert.strictEqual(I.detect('hi', 'en-IN'), 'hi');
  assert.strictEqual(I.detect(null, 'hi-IN'), 'hi');
  assert.strictEqual(I.detect(null, 'en-IN'), 'en');
  assert.strictEqual(I.detect('junk', 'en-US'), 'en');
});
t('i18n: exact required error sentence is unchanged in English', () => {
  assert.strictEqual(I.tIn('en', 'loc_err_default'), 'Your location could not be detected. You can try again or select your location manually.');
});

console.log('\n' + passed + ' checks passed' + (process.exitCode ? ', with failures' : ''));
