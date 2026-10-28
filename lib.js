/* Anaj: pure logic with no DOM or network access, so it can be tested in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnajLib = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Address parsing (Nominatim jsonv2 with addressdetails=1) ---------- */
  function parseAddress(raw) {
    var a = (raw && raw.address) || {};
    var locality = a.hamlet || a.village || a.suburb || a.neighbourhood || a.residential || '';
    var city = a.city || a.town || a.municipality || '';
    var district = a.state_district || a.county || a.district || '';
    var state = a.state || a.union_territory || '';
    var postcode = a.postcode || '';
    var primary = city || locality || district;
    var parts = [];
    [primary, state].forEach(function (p) {
      if (p && !parts.some(function (q) { return q.toLowerCase() === p.toLowerCase(); })) parts.push(p);
    });
    return {
      locality: locality,
      city: city,
      district: district,
      state: state,
      postcode: postcode,
      headline: parts.join(', ')
    };
  }

  /* ---------- Distance ---------- */
  function haversineKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /* ---------- Weather ---------- */
  var WEATHER_CODES = {
    0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers',
    82: 'Heavy showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail'
  };
  function weatherLabel(code) {
    return WEATHER_CODES.hasOwnProperty(code) ? WEATHER_CODES[code] : 'Conditions unavailable';
  }

  /* General guidance only. Thresholds are simple rules of thumb, not a scientific model. */
  function storageRisk(w) {
    var score = 0;
    var reasons = [];
    if (typeof w.humidity === 'number') {
      if (w.humidity >= 80) { score += 2; reasons.push('Humidity is high (' + Math.round(w.humidity) + '%). Stored grain takes up moisture from damp air.'); }
      else if (w.humidity >= 65) { score += 1; reasons.push('Humidity is moderate (' + Math.round(w.humidity) + '%). Keep an eye on damp patches.'); }
    }
    if (typeof w.rainProb === 'number') {
      if (w.rainProb >= 60) { score += 2; reasons.push('Rain is likely today (' + Math.round(w.rainProb) + '% chance).'); }
      else if (w.rainProb >= 30) { score += 1; reasons.push('Some chance of rain today (' + Math.round(w.rainProb) + '%).'); }
    }
    if (typeof w.temp === 'number' && w.temp >= 35) {
      score += 1;
      reasons.push('It is hot (' + Math.round(w.temp) + ' C). Insects become more active in heat.');
    }
    var level = score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
    var advice = {
      low: 'Conditions are favourable. Keep stores closed, dry and ventilated, and continue routine checks.',
      medium: 'Watch for dampness. Keep bags off the floor and away from walls, and check for damp patches or a musty smell.',
      high: 'Damp conditions raise the risk of mould and insects. Keep grain covered and off the ground, avoid opening stores in rain, and check moisture before and after wet spells.'
    }[level];
    if (!reasons.length) reasons.push('No weather risk factors found in the current reading.');
    return { level: level, score: score, reasons: reasons, advice: advice };
  }

  /* ---------- Monitoring thresholds (wheat, for demonstration) ---------- */
  var THRESHOLDS = {
    temp: { warn: 30, danger: 35 },
    humidity: { warn: 70, danger: 80 },
    moisture: { warn: 12, danger: 14 }
  };
  var RANK = { ok: 0, warn: 1, danger: 2 };
  function fieldStatus(field, value) {
    var t = THRESHOLDS[field];
    if (value >= t.danger) return 'danger';
    if (value >= t.warn) return 'warn';
    return 'ok';
  }
  function readingStatus(r) {
    var worst = 'ok';
    ['temp', 'humidity', 'moisture'].forEach(function (f) {
      var s = fieldStatus(f, r[f]);
      if (RANK[s] > RANK[worst]) worst = s;
    });
    return worst;
  }

  /* ---------- Overpass (OpenStreetMap) ---------- */
  function buildOverpassQuery(kind, lat, lon, radiusM) {
    var la = Number(lat).toFixed(5);
    var lo = Number(lon).toFixed(5);
    var r = Math.max(1000, Math.min(50000, Math.round(Number(radiusM) || 25000)));
    var around = '(around:' + r + ',' + la + ',' + lo + ')';
    var body;
    if (kind === 'support') {
      body = [
        'nwr["shop"="agrarian"]' + around + ';',
        'nwr["amenity"="marketplace"]' + around + ';',
        'nwr["office"="government"]["name"~"Agricult|Krishi|Mandi|Kisan",i]' + around + ';'
      ].join('');
    } else {
      body = [
        'nwr["building"="warehouse"]' + around + ';',
        'nwr["industrial"="warehouse"]' + around + ';',
        'nwr["man_made"="silo"]' + around + ';',
        'nwr["amenity"="storage"]' + around + ';'
      ].join('');
    }
    return '[out:json][timeout:25];(' + body + ');out center 60;';
  }

  function parseOverpass(json, lat, lon, kind) {
    var els = (json && json.elements) || [];
    var out = [];
    els.forEach(function (e) {
      var elat = typeof e.lat === 'number' ? e.lat : (e.center && e.center.lat);
      var elon = typeof e.lon === 'number' ? e.lon : (e.center && e.center.lon);
      if (typeof elat !== 'number' || typeof elon !== 'number') return;
      var tags = e.tags || {};
      var fallback = kind === 'support'
        ? (tags.shop === 'agrarian' ? 'Agricultural supply shop' : tags.amenity === 'marketplace' ? 'Marketplace' : 'Agriculture office')
        : (tags.man_made === 'silo' ? 'Silo' : 'Warehouse');
      out.push({
        id: e.type + '/' + e.id,
        name: tags.name || tags['name:en'] || (fallback + ' (unnamed on OpenStreetMap)'),
        named: !!(tags.name || tags['name:en']),
        lat: elat,
        lon: elon,
        distanceKm: haversineKm(lat, lon, elat, elon),
        operator: tags.operator || ''
      });
    });
    out.sort(function (a, b) {
      if (a.named !== b.named) return a.named ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
    return out.slice(0, 30);
  }

  /* ---------- Greeting ---------- */
  function greeting(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return {
    parseAddress: parseAddress,
    haversineKm: haversineKm,
    weatherLabel: weatherLabel,
    storageRisk: storageRisk,
    THRESHOLDS: THRESHOLDS,
    fieldStatus: fieldStatus,
    readingStatus: readingStatus,
    buildOverpassQuery: buildOverpassQuery,
    parseOverpass: parseOverpass,
    greeting: greeting
  };
});
