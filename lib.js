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
  /* Text lives in i18n.js. This file returns message keys so the page can show them in any language. */
  var WEATHER_CODES = { 0: 1, 1: 1, 2: 1, 3: 1, 45: 1, 48: 1, 51: 1, 53: 1, 55: 1, 61: 1, 63: 1, 65: 1, 66: 1, 67: 1,
    71: 1, 73: 1, 75: 1, 80: 1, 81: 1, 82: 1, 95: 1, 96: 1, 99: 1 };
  function weatherKey(code) {
    return WEATHER_CODES.hasOwnProperty(code) ? 'wx_' + code : 'wx_unknown';
  }

  /* General guidance only. Thresholds are simple rules of thumb, not a scientific model.
     Returns reasons as {key, n} so the page can translate and fill in the number. */
  function storageRisk(w) {
    var score = 0;
    var reasons = [];
    if (typeof w.humidity === 'number') {
      if (w.humidity >= 80) { score += 2; reasons.push({ key: 'r_hum_high', n: Math.round(w.humidity) }); }
      else if (w.humidity >= 65) { score += 1; reasons.push({ key: 'r_hum_mid', n: Math.round(w.humidity) }); }
    }
    if (typeof w.rainProb === 'number') {
      if (w.rainProb >= 60) { score += 2; reasons.push({ key: 'r_rain_high', n: Math.round(w.rainProb) }); }
      else if (w.rainProb >= 30) { score += 1; reasons.push({ key: 'r_rain_mid', n: Math.round(w.rainProb) }); }
    }
    if (typeof w.temp === 'number' && w.temp >= 35) {
      score += 1;
      reasons.push({ key: 'r_hot', n: Math.round(w.temp) });
    }
    var level = score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
    if (!reasons.length) reasons.push({ key: 'r_none', n: null });
    return { level: level, score: score, reasons: reasons, adviceKey: 'adv_' + level };
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
        'nwr["office"="government"]["government"="agriculture"]' + around + ';'
      ].join('');
    } else {
      body = [
        'nwr["building"="warehouse"]' + around + ';',
        'nwr["industrial"="warehouse"]' + around + ';',
        'nwr["man_made"="silo"]' + around + ';',
        'nwr["amenity"="storage"]' + around + ';'
      ].join('');
    }
    return '[out:json][timeout:20];(' + body + ');out center 60;';
  }

  function parseOverpass(json, lat, lon, kind) {
    var els = (json && json.elements) || [];
    var out = [];
    els.forEach(function (e) {
      var elat = typeof e.lat === 'number' ? e.lat : (e.center && e.center.lat);
      var elon = typeof e.lon === 'number' ? e.lon : (e.center && e.center.lon);
      if (typeof elat !== 'number' || typeof elon !== 'number') return;
      var tags = e.tags || {};
      var kindKey = kind === 'support'
        ? (tags.shop === 'agrarian' ? 'k_shop' : tags.amenity === 'marketplace' ? 'k_market' : 'k_office')
        : (tags.man_made === 'silo' ? 'k_silo' : 'k_warehouse');
      out.push({
        id: e.type + '/' + e.id,
        name: tags.name || tags['name:en'] || '',
        kindKey: kindKey,
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

  /* ---------- Nominatim search fallback (used when Overpass servers are busy) ---------- */
  function nominatimViewbox(lat, lon, radiusKm) {
    var r = Math.max(1, Math.min(50, Number(radiusKm) || 25));
    var dLat = r / 111;
    var dLon = r / (111 * Math.max(0.2, Math.cos(lat * Math.PI / 180)));
    /* viewbox order is left,top,right,bottom = lon_min,lat_max,lon_max,lat_min */
    return [lon - dLon, lat + dLat, lon + dLon, lat - dLat].map(function (n) { return n.toFixed(5); }).join(',');
  }

  function parseNominatimPlaces(list, lat, lon, radiusKm) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (r) {
      var elat = parseFloat(r.lat), elon = parseFloat(r.lon);
      if (!isFinite(elat) || !isFinite(elon)) return;
      var key = r.osm_type + '/' + r.osm_id;
      if (seen[key]) return;
      seen[key] = true;
      var d = haversineKm(lat, lon, elat, elon);
      if (radiusKm && d > radiusKm * 1.05) return; /* viewbox is a square, so trim the corners */
      var name = r.name || (r.display_name ? String(r.display_name).split(',')[0].trim() : '');
      out.push({
        id: key,
        name: name || '',
        kindKey: 'k_place',
        named: !!name,
        lat: elat,
        lon: elon,
        distanceKm: d,
        operator: ''
      });
    });
    out.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
    return out.slice(0, 30);
  }

  /* ---------- Greeting ---------- */
  function greetingKey(hour) {
    if (hour < 12) return 'greet_morning';
    if (hour < 17) return 'greet_afternoon';
    return 'greet_evening';
  }

  return {
    parseAddress: parseAddress,
    haversineKm: haversineKm,
    weatherKey: weatherKey,
    storageRisk: storageRisk,
    THRESHOLDS: THRESHOLDS,
    fieldStatus: fieldStatus,
    readingStatus: readingStatus,
    buildOverpassQuery: buildOverpassQuery,
    parseOverpass: parseOverpass,
    nominatimViewbox: nominatimViewbox,
    parseNominatimPlaces: parseNominatimPlaces,
    greetingKey: greetingKey
  };
});
