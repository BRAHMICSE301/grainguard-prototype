
/* Anaj: location service, weather, nearby search, inventory and monitor.
   Depends on lib.js (window.AnajLib). Classic script so it also works without a module server. */
(function () {
  'use strict';
 
  var Lib = window.AnajLib;
 
  /* ---------- Small DOM helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === false || v == null) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var kids = [].concat(arguments[i]);
      for (var j = 0; j < kids.length; j++) {
        var kid = kids[j];
        if (kid == null || kid === false) continue;
        el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
      }
    }
    return el;
  }
  function icon(svgMarkup) {
    var s = document.createElement('span');
    s.className = 'icon';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = svgMarkup; /* trusted constants only */
    return s;
  }
  var PIN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
 
  /* ---------- Location service ---------- */
  var DEMO_PLACE = { locality: '', city: 'Gurugram', district: 'Gurugram', state: 'Haryana', postcode: '', headline: 'Gurugram, Haryana' };
  var DEMO_COORDS = { lat: 28.4595, lon: 77.0266, accuracy: null };
 
  var Loc = {
    state: { status: 'idle', source: null, coords: null, place: null, geocodeFailed: false, error: null },
    listeners: [],
    log: [],
    counters: { geocode: 0, weather: 0, overpass: 0 },
    busy: false,
    lastGeocodeAt: 0,
 
    subscribe: function (fn) { this.listeners.push(fn); },
    note: function (msg) {
      var d = new Date();
      this.log.unshift({ t: d.toLocaleTimeString('en-IN', { hour12: false }), msg: msg });
      if (this.log.length > 14) this.log.pop();
    },
    set: function (patch, why) {
      Object.keys(patch).forEach(function (k) { Loc.state[k] = patch[k]; });
      if (why) this.note(why);
      this.listeners.forEach(function (fn) { try { fn(Loc.state); } catch (e) { console.error(e); } });
    },
 
    /* Ask the browser for the position. Only called from a user action, or silently when
       permission is already granted (the Permissions API says so), so no surprise prompts. */
    detect: function () {
      var self = this;
      if (self.busy) return Promise.resolve();
      if (!('geolocation' in navigator)) {
        self.set({ status: 'error', error: 'unsupported' }, 'Geolocation API not available in this browser');
        return Promise.resolve();
      }
      if (!window.isSecureContext) {
        self.set({ status: 'error', error: 'insecure' }, 'Page is not served over HTTPS or localhost');
        return Promise.resolve();
      }
      self.busy = true;
      self.set({ status: 'loading', error: null }, 'Requesting position from browser');
      return new Promise(function (resolve) {
        navigator.geolocation.getCurrentPosition(function (pos) {
          var coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
          self.set({ status: 'resolving', source: 'device', coords: coords, place: null, geocodeFailed: false },
            'Browser returned a position (accuracy about ' + Math.round(coords.accuracy) + ' m)');
          self.reverse(coords.lat, coords.lon).then(function (place) {
            self.set({ status: 'ready', place: place, geocodeFailed: !place },
              place ? 'Place name resolved' : 'Place name lookup failed; coordinates kept');
          }).then(function () { self.busy = false; resolve(); });
        }, function (err) {
          self.busy = false;
          if (err && err.code === 1) self.set({ status: 'denied', error: 'denied' }, 'Permission denied by user or browser');
          else if (err && err.code === 3) self.set({ status: 'error', error: 'timeout' }, 'Browser timed out');
          else self.set({ status: 'error', error: 'unavailable' }, 'Position unavailable');
          resolve();
        }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 });
      });
    },
 
    /* Reverse geocoding with Nominatim. Rate limited to one request per 1.1 s, cached per
       session at about 1 km precision so we never store precise coordinates. */
    reverse: function (lat, lon) {
      var self = this;
      var key = 'anaj.geo.' + lat.toFixed(2) + ',' + lon.toFixed(2);
      try {
        var cached = sessionStorage.getItem(key);
        if (cached) { self.note('Place name served from session cache'); return Promise.resolve(JSON.parse(cached)); }
      } catch (e) { /* storage may be blocked */ }
      var wait = Math.max(0, 1100 - (Date.now() - self.lastGeocodeAt));
      return new Promise(function (r) { setTimeout(r, wait); }).then(function () {
        self.lastGeocodeAt = Date.now();
        self.counters.geocode++;
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 10000);
        var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=14&accept-language=en' +
          '&lat=' + encodeURIComponent(lat.toFixed(5)) + '&lon=' + encodeURIComponent(lon.toFixed(5));
        return fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } })
          .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
          .then(function (json) {
            clearTimeout(timer);
            var place = Lib.parseAddress(json);
            if (!place.headline) return null;
            try { sessionStorage.setItem(key, JSON.stringify(place)); } catch (e) { /* ignore */ }
            return place;
          })
          .catch(function (e) { clearTimeout(timer); console.warn('Reverse geocoding failed', e); return null; });
      });
    },
 
    /* Optional manual fallback: forward search for a place name (India only). */
    search: function (q) {
      var self = this;
      var wait = Math.max(0, 1100 - (Date.now() - self.lastGeocodeAt));
      return new Promise(function (r) { setTimeout(r, wait); }).then(function () {
        self.lastGeocodeAt = Date.now();
        self.counters.geocode++;
        var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&accept-language=en&q=' + encodeURIComponent(q);
        return fetch(url, { headers: { 'Accept': 'application/json' } })
          .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
          .then(function (arr) {
            return arr.map(function (r) {
              var p = Lib.parseAddress(r);
              return { place: p, coords: { lat: parseFloat(r.lat), lon: parseFloat(r.lon), accuracy: null }, label: r.display_name };
            }).filter(function (x) { return isFinite(x.coords.lat) && isFinite(x.coords.lon); });
          });
      });
    },
 
    useManual: function (item) {
      this.set({ status: 'ready', source: 'manual', coords: item.coords, place: item.place.headline ? item.place : null, geocodeFailed: !item.place.headline, error: null },
        'Location chosen manually');
    },
    useDemo: function () {
      this.set({ status: 'ready', source: 'demo', coords: DEMO_COORDS, place: DEMO_PLACE, geocodeFailed: false, error: null },
        'Demo location selected (not the farmer\'s real location)');
    }
  };
 
  /* ---------- Location panel (hero) and dashboard header ---------- */
  function areaText(s) {
    if (s.place && s.place.headline) return s.place.headline;
    if (s.coords) return 'Location detected (place name unavailable)';
    return '';
  }
 
  function btn(label, action, cls) {
    return h('button', { type: 'button', 'data-action': action, class: cls || 'btn' }, label);
  }
  function linkBtn(label, action) { return btn(label, action, 'linkbtn'); }
 
  function renderPanel() {
    var s = Loc.state;
    var box = $('#locPanel');
    var kids;
    if (s.status === 'idle') {
      kids = [
        h('p', { class: 'loc-title', text: 'Find storage facilities near you' }),
        h('p', { class: 'loc-help', text: 'We ask for your location once, only to show nearby stores and local weather. You do not need to type anything.' }),
        h('div', { class: 'loc-row' }, btn('Use My Current Location', 'detect', 'btn btn-primary')),
        h('p', { class: 'loc-alt' }, linkBtn('Look at the demo location', 'demo'), ' or ', linkBtn('choose a place yourself', 'manual'))
      ];
    } else if (s.status === 'loading') {
      kids = [
        h('p', { class: 'loc-title', text: 'Finding your location' }),
        h('p', { class: 'loc-help' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Please allow location access when your browser asks.')
      ];
    } else if (s.status === 'resolving') {
      kids = [
        h('p', { class: 'loc-title', text: 'Location received' }),
        h('p', { class: 'loc-help' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Looking up the name of your area.')
      ];
    } else if (s.status === 'ready') {
      var sub, badge = null;
      if (s.source === 'device') sub = s.place ? 'Location detected automatically' : 'Location detected. We could not look up the place name, but nearby search still works.';
      else if (s.source === 'manual') sub = 'Location chosen by you';
      else { sub = 'This is a sample location for demonstration. It is not your actual location.'; badge = h('span', { class: 'tag tag-demo', text: 'Demo' }); }
      var headline = s.source === 'demo' ? 'Demo Location: ' + areaText(s) : areaText(s);
      kids = [
        h('p', { class: 'loc-title' }, 'Your location'),
        h('p', { class: 'loc-now' }, icon(PIN), h('span', { text: headline }), badge),
        h('p', { class: 'loc-help', text: sub }),
        h('p', { class: 'loc-alt' },
          s.source === 'demo' ? linkBtn('Use my current location', 'detect') : linkBtn('Refresh location', 'refresh'),
          ' · ', linkBtn('Change', 'manual'))
      ];
      if (s.place && s.source === 'device' && (s.place.locality || s.place.district || s.place.postcode)) {
        var bits = [s.place.locality, s.place.district && s.place.district + ' district', s.place.postcode && 'PIN ' + s.place.postcode].filter(Boolean);
        kids.splice(3, 0, h('p', { class: 'loc-detail', text: bits.join(' · ') }));
      }
    } else if (s.status === 'denied') {
      kids = [
        h('p', { class: 'loc-title', text: 'Location access is turned off' }),
        h('p', { class: 'loc-help', text: 'We need your location to show stores near you. Allow location for this site in your browser settings, then try again. The rest of the site works without it.' }),
        h('div', { class: 'loc-row' }, btn('Try again', 'detect', 'btn btn-primary')),
        h('p', { class: 'loc-alt' }, 'Optional: ', linkBtn('choose a place yourself', 'manual'), ' or ', linkBtn('look at the demo location', 'demo'))
      ];
    } else {
      var msg = 'Your location could not be detected. You can try again or select your location manually.';
      if (s.error === 'insecure') msg = 'Location only works on a secure (HTTPS) page. Open the site through its https address and try again.';
      if (s.error === 'unsupported') msg = 'This browser does not support location. You can select your location manually.';
      kids = [
        h('p', { class: 'loc-title', text: 'Location not available' }),
        h('p', { class: 'loc-help', text: msg }),
        h('div', { class: 'loc-row' }, btn('Try again', 'detect', 'btn btn-primary'), btn('Select manually', 'manual', 'btn')),
      ];
    }
    box.replaceChildren.apply(box, kids);
  }
 
  function renderDashHead() {
    var s = Loc.state;
    $('#greeting').textContent = Lib.greeting(new Date().getHours()) + ', Farmer!';
    var line = $('#areaLine');
    if (s.status === 'ready') {
      line.textContent = s.source === 'demo'
        ? 'Demo location: ' + areaText(s) + ' (sample, not your actual location)'
        : 'Your area: ' + areaText(s);
    } else if (s.status === 'loading' || s.status === 'resolving') {
      line.textContent = 'Finding your area...';
    } else {
      line.textContent = 'Your area is not set. Use the location button above to see local information.';
    }
    var acts = $('#dashActions');
    acts.replaceChildren();
    if (s.status === 'ready') {
      acts.append(btn('Refresh location', s.source === 'demo' ? 'detect' : 'refresh', 'btn btn-small'), btn('Change', 'manual', 'btn btn-small'));
    } else if (s.status === 'idle' || s.status === 'denied' || s.status === 'error') {
      acts.append(btn('Use My Current Location', 'detect', 'btn btn-small btn-primary'));
    }
  }
 
  /* ---------- Weather (Open-Meteo, no API key needed) ---------- */
  var weatherCache = {};
  var Weather = {
    fetch: function (lat, lon) {
      var la = lat.toFixed(2), lo = lon.toFixed(2); /* rounded before sending */
      var key = la + ',' + lo;
      var hit = weatherCache[key];
      if (hit && Date.now() - hit.at < 20 * 60 * 1000) return Promise.resolve(hit.data);
      Loc.counters.weather++;
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + lo +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=precipitation_probability_max&timezone=auto&forecast_days=1';
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 10000);
      return fetch(url, { signal: ctrl.signal }).then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function (j) {
        if (!j.current) throw new Error('No current data');
        var data = {
          temp: j.current.temperature_2m,
          humidity: j.current.relative_humidity_2m,
          wind: j.current.wind_speed_10m,
          code: j.current.weather_code,
          rainProb: j.daily && j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[0] : null
        };
        weatherCache[key] = { at: Date.now(), data: data };
        return data;
      });
    }
  };
  var SAMPLE_WEATHER = { temp: 31, humidity: 78, wind: 9, code: 3, rainProb: 40 };
 
  function stat(label, value) {
    return h('div', { class: 'stat' }, h('dt', { text: label }), h('dd', { text: value }));
  }
 
  function renderWeather(mode, w) {
    var box = $('#weatherBox');
    var head = h('h3', { text: 'Weather today' });
    var kids;
    if (mode === 'none') {
      kids = [head, h('p', { class: 'muted', text: 'Set your location to see the weather for your area.' })];
    } else if (mode === 'loading') {
      kids = [head, h('p', { class: 'muted' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Loading weather...')];
    } else {
      var live = mode === 'live';
      var src = live
        ? (Loc.state.source === 'demo' ? 'Live data from Open-Meteo, for the demo location' : 'Live data from Open-Meteo')
        : 'Demo weather. Sample values, not live. Live weather could not be loaded.';
      kids = [
        head,
        h('p', { class: live ? 'src' : 'src src-demo', text: src }),
        h('p', { class: 'big-num' }, Math.round(w.temp) + ' °C', h('span', { text: Lib.weatherLabel(w.code) })),
        h('dl', { class: 'stats' },
          stat('Humidity', Math.round(w.humidity) + '%'),
          stat('Chance of rain', w.rainProb == null ? 'n/a' : Math.round(w.rainProb) + '%'),
          stat('Wind', Math.round(w.wind) + ' km/h'))
      ];
    }
    box.replaceChildren.apply(box, kids);
  }
 
  function renderRisk(mode, w) {
    var box = $('#riskBox');
    var head = h('h3', { text: 'Storage risk' });
    if (mode === 'none' || mode === 'loading') {
      box.replaceChildren(head, h('p', { class: 'muted', text: 'Storage guidance appears here once weather for your area is available.' }));
      return;
    }
    var r = Lib.storageRisk(w);
    var label = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }[r.level];
    var items = r.reasons.map(function (t) { return h('li', { text: t }); });
    box.replaceChildren(
      head,
      mode === 'demo' ? h('p', { class: 'src src-demo', text: 'Based on demo weather values' }) : h('p', { class: 'src', text: 'Based on today\'s weather. General guidance only.' }),
      h('p', { class: 'status status-' + (r.level === 'low' ? 'ok' : r.level === 'medium' ? 'warn' : 'danger') }, h('span', { class: 'dot', 'aria-hidden': 'true' }), label),
      h('ul', { class: 'plain' }, items),
      h('p', { class: 'advice', text: r.advice })
    );
  }
 
  var weatherReq = 0;
  function refreshWeather() {
    var s = Loc.state;
    var id = ++weatherReq;
    if (s.status !== 'ready' || !s.coords) { renderWeather('none'); renderRisk('none'); return; }
    renderWeather('loading'); renderRisk('loading');
    Weather.fetch(s.coords.lat, s.coords.lon).then(function (w) {
      if (id !== weatherReq) return;
      renderWeather('live', w); renderRisk('live', w);
    }).catch(function (e) {
      if (id !== weatherReq) return;
      console.warn('Weather failed', e);
      renderWeather('demo', SAMPLE_WEATHER); renderRisk('demo', SAMPLE_WEATHER);
    });
  }
 
  /* ---------- Local support box ---------- */
  function renderSupport() {
    var s = Loc.state;
    var box = $('#supportBox');
    var list = h('ul', { class: 'plain links' },
      h('li', null, h('a', { href: 'https://enam.gov.in', target: '_blank', rel: 'noopener' }, 'eNAM'), ' (national agriculture market)'),
      h('li', null, h('a', { href: 'https://soilhealth.dac.gov.in', target: '_blank', rel: 'noopener' }, 'Soil Health Card portal')),
      h('li', null, h('a', { href: 'https://kvk.icar.gov.in', target: '_blank', rel: 'noopener' }, 'Krishi Vigyan Kendra locator')),
      h('li', null, 'Kisan Call Centre: ', h('strong', { text: '1800-180-1551' }), ' (toll free)')
    );
    var kids = [h('h3', { text: 'Local agricultural support' })];
    if (s.status === 'ready' && s.place && s.place.district) {
      var q = encodeURIComponent('Krishi Vigyan Kendra ' + s.place.district + ' ' + (s.place.state || ''));
      kids.push(h('p', { class: 'src', text: 'For ' + s.place.district + ' district' }));
      kids.push(h('p', null, h('a', { class: 'btn btn-small', href: 'https://www.google.com/search?q=' + q, target: '_blank', rel: 'noopener' }, 'Find your district KVK')));
    } else {
      kids.push(h('p', { class: 'muted', text: 'Set your location to find support for your district. National services are listed below.' }));
    }
    kids.push(list);
    box.replaceChildren.apply(box, kids);
  }
 
  /* ---------- Nearby (OpenStreetMap via Overpass) ---------- */
  var Nearby = {
    kind: 'storage', radiusKm: 25, map: null, layer: null, cache: {}, reqId: 0,
 
    ensureMap: function () {
      if (this.map || !window.L) return;
      var el = $('#map');
      this.map = L.map(el, { scrollWheelZoom: false }).setView([22.5, 79], 4);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
    },
 
    run: function () {
      var self = this;
      var s = Loc.state;
      var status = $('#nearbyStatus');
      var list = $('#nearbyList');
      if (s.status !== 'ready' || !s.coords) {
        status.textContent = 'Set your location to see nearby places.';
        list.replaceChildren();
        if (this.layer) this.layer.clearLayers();
        return;
      }
      var c = s.coords;
      var key = [this.kind, this.radiusKm, c.lat.toFixed(2), c.lon.toFixed(2)].join('|');
      var id = ++this.reqId;
      status.replaceChildren('Searching OpenStreetMap. This can take up to 30 seconds. Or ', self.mapsLink(c), '.');
      list.replaceChildren();
      if (this.layer) this.layer.clearLayers();
      /* Show where the user is on the map straight away, even before results arrive. */
      this.ensureMap();
      if (this.map) this.map.setView([c.lat, c.lon], 11);
      this.showYou(c);
      var p;
      if (this.cache[key]) p = Promise.resolve(this.cache[key]);
      else {
        var q = Lib.buildOverpassQuery(this.kind, c.lat, c.lon, this.radiusKm * 1000);
        p = this.fetchOverpass(q).then(function (j) {
          var items = Lib.parseOverpass(j, c.lat, c.lon, self.kind);
          self.cache[key] = items;
          return items;
        });
      }
      p.then(function (items) {
        if (id !== self.reqId) return;
        self.render(items, c);
      }).catch(function (e) {
        if (id !== self.reqId) return;
        console.warn('Nearby search failed', e);
        status.replaceChildren(
          'Nearby places could not be loaded right now. The free map data servers are sometimes busy. ',
          h('button', { type: 'button', class: 'linkbtn', 'data-action': 'nearby-retry' }, 'Try again'),
          ' or ', self.mapsLink(c), '.'
        );
      });
    },
 
    /* Free public Overpass servers are often busy, so try several, failing fast on each. */
    ENDPOINTS: [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.private.coffee/api/interpreter'
    ],
    tryEndpoint: function (url, q) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 14000);
      Loc.counters.overpass++;
      Loc.note('Nearby search: asking ' + url.split('/')[2]);
      renderLog();
      return fetch(url, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(q)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function (j) {
        clearTimeout(timer);
        /* Overpass reports some failures with HTTP 200 and a remark. Treat an empty remark result as a failure. */
        if (j && j.remark && !(j.elements && j.elements.length)) throw new Error('Server remark: ' + j.remark);
        return j;
      }, function (err) { clearTimeout(timer); throw err; });
    },
    fetchOverpass: function (q) {
      var self = this;
      return self.ENDPOINTS.reduce(function (chain, url) {
        return chain.catch(function (err) {
          if (err && err.message !== 'start') { Loc.note('Nearby search failed: ' + err.message); renderLog(); }
          return self.tryEndpoint(url, q);
        });
      }, Promise.reject(new Error('start')));
    },
 
    showYou: function (c) {
      if (!this.map || !this.layer) return;
      var you = L.circleMarker([c.lat, c.lon], { radius: 7, color: '#1f3d2b', weight: 2, fillColor: '#c99a2e', fillOpacity: 1 });
      you.bindTooltip(Loc.state.source === 'demo' ? 'Demo location' : 'Your location');
      you.addTo(this.layer);
    },
 
    mapsLink: function (c) {
      var term = this.kind === 'support' ? 'agriculture+office' : 'grain+warehouse';
      return h('a', { href: 'https://www.google.com/maps/search/' + term + '/@' + c.lat.toFixed(3) + ',' + c.lon.toFixed(3) + ',12z', target: '_blank', rel: 'noopener' }, 'Search on Google Maps');
    },
 
    render: function (items, c) {
      var status = $('#nearbyStatus');
      var list = $('#nearbyList');
      this.ensureMap();
      if (this.layer) this.layer.clearLayers();
      this.showYou(c);
      if (!items.length) {
        status.replaceChildren(
          'No listings found within ' + this.radiusKm + ' km on OpenStreetMap. Coverage is incomplete in many rural areas, so this does not mean none exist. ',
          this.mapsLink(c)
        );
        list.replaceChildren();
        if (this.map) this.map.setView([c.lat, c.lon], 10);
        return;
      }
      status.replaceChildren(items.length + ' places found within ' + this.radiusKm + ' km. Listings come from OpenStreetMap contributors and may be incomplete or out of date. ', this.mapsLink(c));
      var bounds = [[c.lat, c.lon]];
      var rows = items.map(function (it) {
        if (Nearby.map) {
          var m = L.marker([it.lat, it.lon]);
          m.bindTooltip(it.name); /* Leaflet escapes tooltip text only when given a DOM node */
          m.addTo(Nearby.layer);
          bounds.push([it.lat, it.lon]);
        }
        return h('li', null,
          h('span', { class: 'place-name', text: it.name }),
          h('span', { class: 'place-dist', text: it.distanceKm.toFixed(1) + ' km' }),
          it.operator ? h('span', { class: 'place-op', text: it.operator }) : null);
      });
      list.replaceChildren.apply(list, rows);
      if (this.map) this.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 });
    }
  };
 
  /* Leaflet tooltips accept HTML strings; pass a text node instead to avoid injecting OSM names as HTML. */
  (function patchTooltip() {
    if (!window.L) return;
    var orig = L.Layer.prototype.bindTooltip;
    L.Layer.prototype.bindTooltip = function (content, opts) {
      if (typeof content === 'string') { var span = document.createElement('span'); span.textContent = content; content = span; }
      return orig.call(this, content, opts);
    };
  })();
 
  /* ---------- Inventory (localStorage, no location data) ---------- */
  var INV_KEY = 'anaj.inventory.v1';
  function loadInv() { try { return JSON.parse(localStorage.getItem(INV_KEY)) || []; } catch (e) { return []; } }
  function saveInv(items) { try { localStorage.setItem(INV_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ } }
  function renderInventory() {
    var items = loadInv();
    var body = $('#invBody');
    body.replaceChildren();
    $('#invEmpty').hidden = items.length > 0;
    $('#invTable').hidden = items.length === 0;
    var totals = {};
    items.forEach(function (it, idx) {
      totals[it.crop] = (totals[it.crop] || 0) + it.qty;
      body.append(h('tr', null,
        h('td', { text: it.crop }),
        h('td', { class: 'num', text: String(it.qty) }),
        h('td', { text: it.place || '-' }),
        h('td', { text: it.date || '-' }),
        h('td', null, h('button', { type: 'button', class: 'linkbtn', 'data-action': 'inv-remove', 'data-idx': String(idx), 'aria-label': 'Remove ' + it.crop + ' entry' }, 'Remove'))));
    });
    var keys = Object.keys(totals);
    $('#invTotals').textContent = keys.length
      ? 'Total in store: ' + keys.map(function (k) { return totals[k] + ' quintal ' + k; }).join(', ')
      : '';
  }
 
  /* ---------- Monitor (simulated) ---------- */
  var BINS = [
    { name: 'Store A, wheat', temp: 27, humidity: 58, moisture: 10.8 },
    { name: 'Store B, wheat', temp: 29, humidity: 66, moisture: 11.6 },
    { name: 'Store C, paddy', temp: 31, humidity: 73, moisture: 12.9 },
    { name: 'Store D, wheat', temp: 33, humidity: 82, moisture: 14.2 }
  ];
  var monitor = [];
  function seeded(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function resetMonitor() {
    monitor = BINS.map(function (b, i) {
      var rnd = seeded(7 + i * 13);
      var hist = [];
      var cur = { temp: b.temp, humidity: b.humidity, moisture: b.moisture };
      for (var k = 0; k < 12; k++) {
        hist.push({ temp: cur.temp, humidity: cur.humidity, moisture: cur.moisture });
        cur = { temp: clamp(cur.temp + (rnd() - 0.5) * 1.2, 18, 42), humidity: clamp(cur.humidity + (rnd() - 0.5) * 3, 35, 95), moisture: clamp(cur.moisture + (rnd() - 0.5) * 0.3, 8, 18) };
      }
      return { name: b.name, hist: hist };
    });
  }
  function stepMonitor() {
    monitor.forEach(function (b) {
      var last = b.hist[b.hist.length - 1];
      b.hist.push({
        temp: clamp(last.temp + (Math.random() - 0.5) * 1.6, 18, 42),
        humidity: clamp(last.humidity + (Math.random() - 0.5) * 4, 35, 95),
        moisture: clamp(last.moisture + (Math.random() - 0.5) * 0.4, 8, 18)
      });
      if (b.hist.length > 12) b.hist.shift();
    });
  }
  function spark(values, lo, hi) {
    var NS = 'http://www.w3.org/2000/svg', w = 96, hgt = 26;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    svg.setAttribute('width', w); svg.setAttribute('height', hgt);
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Humidity trend');
    var pts = values.map(function (v, i) {
      return (i * (w - 2) / (values.length - 1) + 1).toFixed(1) + ',' + (hgt - 2 - (v - lo) / (hi - lo) * (hgt - 4)).toFixed(1);
    }).join(' ');
    var pl = document.createElementNS(NS, 'polyline');
    pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', 'currentColor'); pl.setAttribute('stroke-width', '1.5');
    svg.appendChild(pl);
    return svg;
  }
  var STATUS_TEXT = { ok: 'Safe', warn: 'Watch', danger: 'Act now' };
  function cell(field, v, digits) {
    var st = Lib.fieldStatus(field, v);
    return h('td', { class: 'num cell-' + st }, v.toFixed(digits));
  }
  function renderMonitor() {
    var body = $('#monBody');
    body.replaceChildren();
    monitor.forEach(function (b) {
      var r = b.hist[b.hist.length - 1];
      var st = Lib.readingStatus(r);
      body.append(h('tr', null,
        h('th', { scope: 'row', text: b.name }),
        cell('temp', r.temp, 1), cell('humidity', r.humidity, 0), cell('moisture', r.moisture, 1),
        h('td', null, h('span', { class: 'status status-' + st }, h('span', { class: 'dot', 'aria-hidden': 'true' }), STATUS_TEXT[st])),
        h('td', { class: 'spark' }, spark(b.hist.map(function (x) { return x.humidity; }), 35, 95))));
    });
  }
  function renderLog() {
    var s = Loc.state;
    $('#logState').textContent = s.status + (s.source ? ' (' + s.source + ')' : '');
    $('#logCounts').textContent = 'Nominatim requests: ' + Loc.counters.geocode + ' · Weather requests: ' + Loc.counters.weather + ' · Overpass requests: ' + Loc.counters.overpass;
    var ul = $('#logList');
    ul.replaceChildren.apply(ul, Loc.log.map(function (e) { return h('li', null, h('time', { text: e.t }), ' ' + e.msg); }));
  }
 
  /* ---------- Manual location dialog ---------- */
  function setupManual() {
    var dlg = $('#manualDialog');
    var form = $('#manualForm');
    var input = $('#manualQ');
    var results = $('#manualResults');
    var msg = $('#manualMsg');
    var lastQ = '';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q.length < 3 || q === lastQ) { msg.textContent = q.length < 3 ? 'Type at least 3 letters.' : ''; return; }
      lastQ = q;
      msg.textContent = 'Searching...';
      results.replaceChildren();
      Loc.search(q).then(function (arr) {
        if (!arr.length) { msg.textContent = 'No match found. Try a nearby town or district name.'; return; }
        msg.textContent = 'Choose your place:';
        arr.forEach(function (item) {
          var b = h('button', { type: 'button', class: 'result-btn', text: item.label });
          b.addEventListener('click', function () { Loc.useManual(item); dlg.close(); });
          results.append(h('li', null, b));
        });
      }).catch(function () { msg.textContent = 'Search failed. Please try again.'; lastQ = ''; });
    });
    $('#manualClose').addEventListener('click', function () { dlg.close(); });
    return function open() {
      msg.textContent = ''; results.replaceChildren(); input.value = ''; lastQ = '';
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      input.focus();
    };
  }
 
  /* ---------- Wiring ---------- */
  function renderAll() {
    renderPanel();
    renderDashHead();
    renderSupport();
    renderLog();
  }
 
  var openManual = function () {};
  var lastCoordKey = '';
  Loc.subscribe(function (s) {
    renderAll();
    var key = s.status === 'ready' && s.coords ? s.coords.lat.toFixed(4) + ',' + s.coords.lon.toFixed(4) + s.source : '';
    if (key !== lastCoordKey) {
      lastCoordKey = key;
      refreshWeather();
      Nearby.run();
      renderLog();
    }
  });
 
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]');
    if (!t) return;
    var a = t.getAttribute('data-action');
    if (a === 'detect' || a === 'refresh') {
      /* Reset the change key so the subscriber refetches weather and places once the new position is ready. */
      lastCoordKey = ''; weatherCache = {};
      Loc.detect();
    }
    else if (a === 'demo') Loc.useDemo();
    else if (a === 'manual') openManual();
    else if (a === 'nearby-retry') Nearby.run();
    else if (a === 'inv-remove') {
      var items = loadInv(); items.splice(parseInt(t.getAttribute('data-idx'), 10), 1); saveInv(items); renderInventory();
    }
  });
 
  function init() {
    openManual = setupManual();
    $$('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        Nearby.kind = b.getAttribute('data-kind');
        Nearby.run();
      });
    });
    $('#radius').addEventListener('change', function (e) { Nearby.radiusKm = parseInt(e.target.value, 10); Nearby.run(); });
 
    $('#invForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var els = f.elements;
      var qty = parseFloat(els.qty.value);
      if (!isFinite(qty) || qty <= 0) { $('#invMsg').textContent = 'Enter a quantity greater than zero.'; return; }
      $('#invMsg').textContent = '';
      var items = loadInv();
      items.push({ crop: els.crop.value, qty: qty, place: els.place.value.trim().slice(0, 60), date: els.date.value });
      saveInv(items);
      f.reset();
      renderInventory();
    });
 
    $('#monStep').addEventListener('click', function () { stepMonitor(); renderMonitor(); });
    $('#monReset').addEventListener('click', function () { resetMonitor(); renderMonitor(); });
 
    resetMonitor(); renderMonitor();
    renderInventory();
    renderAll();
    renderWeather('none'); renderRisk('none');
    Nearby.run();
    if (window.L) Nearby.ensureMap();
 
    /* If the user already granted permission earlier, fetch silently. Never prompts. */
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(function (p) {
        if (p.state === 'granted') Loc.detect();
        else if (p.state === 'denied') Loc.set({ status: 'denied', error: 'denied' }, 'Browser reports location permission is blocked');
      }).catch(function () { /* not supported, wait for the button */ });
    }
  }
 
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
