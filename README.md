# Anaj

Grain storage guidance for farmers. Plain HTML, CSS and JavaScript. No build step, no API keys.

## Files

- `index.html` page structure
- `styles.css` design system (colour tokens, type, buttons, forms, status indicators)
- `lib.js` pure logic: address parsing, distance, storage risk rules, monitor limits, Overpass query
- `app.js` location service, weather, nearby search, inventory, monitor, page wiring
- `tests.js` unit tests for `lib.js`

## Run it

Location needs a secure page, so use `localhost` or an `https` address.

    cd anaj
    python3 -m http.server 8000

Then open http://localhost:8000. In a GitHub Codespace, open the forwarded port 8000 from the Ports tab; that address is https, so location works.

## Run the tests

    node tests.js

## How location works

1. Nothing is requested on page load. The browser prompt appears only when the farmer presses "Use My Current Location".
2. If the browser has already granted permission for this site, the position is fetched silently, with no prompt.
3. `navigator.geolocation.getCurrentPosition()` returns coordinates. They are kept in memory only.
4. Nominatim (OpenStreetMap) turns coordinates into locality, city, district, state and PIN. Requests are limited to one per 1.1 seconds, and results are cached for the tab session at about 1 km precision.
5. If the place name lookup fails, the coordinates are kept and weather and nearby search still run.
6. Demo location is labelled "Demo Location" with a Demo tag and never says "detected".
7. Manual place search is optional and sits behind the "Change" and "choose a place yourself" links.

## Data sources

- Weather: Open-Meteo (no key). If it fails, the card says "Demo weather. Sample values, not live."
- Nearby storage and support: OpenStreetMap through Overpass. Coverage is incomplete in many rural areas, and the page says so.
- Monitor screen: simulated readings, labelled as such.

## Before real use

- Nominatim and Overpass are public services with fair-use limits. For production traffic, put both behind your own small backend proxy or use a paid provider. No keys are in this code.
- Storage risk rules in `lib.js` are simple rules of thumb. Have an agronomist review the thresholds.
- The brand name "Anaj" and the hero illustration are placeholders. Real farm photography was not added because no licensed photos were available.
