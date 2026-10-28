# Anaj

### *Grain storage guidance for Indian farmers*

> Keep the harvest dry. Know when the weather turns against it.

Anaj is a website that helps a farmer decide **where to store grain** and **how safe it is to keep it there today**. The farmer taps one button, and the site finds their area, shows nearby grain stores, reads the local weather, and explains in simple words what that weather means for stored grain.

---

## The problem

After harvest, grain is often lost to **damp, mould and insects**. Most of this is preventable, but only if the farmer knows when the risk is rising and has a trusted store within reach. Information is usually scattered across portals, helplines and word of mouth. Anaj puts the essentials on one page.

---

## What the farmer sees

| Section | What it gives the farmer |
|---|---|
| **Home** | A single button, "Use My Current Location". No typing of village, district or PIN code. |
| **Today** | A greeting, the farmer's area, today's weather, a Low, Medium or High storage risk with reasons, and links to local agricultural support. |
| **Storage guide** | Six plain steps from drying the grain to regular checks. |
| **Nearby** | A map and distance-sorted list of grain stores, or agricultural support places, within 10, 25 or 50 km. |
| **My store** | A simple record of crop, quantity, where it is kept and the date stored. |
| **Monitor** | A technical view for judges and investors, showing how sensor readings would be checked against safe limits. |

---

## How location works

1. **Nothing is requested when the page opens.** The browser's permission prompt appears only when the farmer presses the button.
2. The site reads the position from the browser, then looks up a readable place name: *locality, city, district, state and PIN code*.
3. The farmer sees a short result such as **Gurugram, Haryana** with the note *"Location detected automatically"*.
4. Location can be **refreshed or changed** at any time without reloading the page.

**If the farmer says no:** the site does not break. It explains in simple language that location is needed to show nearby stores, offers a "Try again" button, and keeps a manual place search as an *optional* extra.

**If the place name cannot be found:** the site still keeps the coordinates, so weather and nearby search continue to work.

**Demo location:** for presentations, a sample location is available. It is always labelled *"Demo Location"* with a Demo tag, and it never claims to be the farmer's real position.

---

## Privacy

- The farmer is **never tracked**. Location is read once, on request.
- **Exact coordinates are not saved.** They stay in memory. Only a rounded, roughly 1 km cache of the place name lasts for the browser tab session.
- The inventory is saved **on the farmer's own device only**.
- The page tells the farmer why location is asked for, and which outside services receive approximate coordinates: *OpenStreetMap* for place names and nearby listings, and *Open-Meteo* for weather.

---

## Honest about its data

Anaj never invents information.

- **Weather** is live from Open-Meteo. If it cannot be loaded, the card is clearly marked *"Demo weather. Sample values, not live."*
- **Nearby places** come from OpenStreetMap contributors. Coverage is thin in many villages, and the page says so instead of implying that no stores exist.
- **Monitor screen** uses *simulated* readings and is labelled that way. No sensors are connected yet.
- **Storage advice** is general guidance and points farmers to their local Krishi Vigyan Kendra for crop-specific advice.

---

## Design

The look comes from Indian farming and grain stores rather than from a software template.

- **Colours:** ivory paper background, deep forest green, grain gold, earth brown and charcoal text.
- **Status colours** (green, amber, red) are used *only* for safety. Every status also shows a word and a dot, so it is readable without colour.
- **Layouts differ by purpose:** an editorial home page, ruled columns for the daily view, numbered steps for the guide, a map for nearby places, large plain inputs for the inventory, and a dark technical panel for monitoring.
- **Type:** Arial throughout, with large readable sizes and large tap targets.

---

## Built with

HTML, CSS and JavaScript. No framework, no build step and no API keys.

**Free public services used:** Nominatim and Overpass (OpenStreetMap), Open-Meteo, and Leaflet for the map.

### Files

| File | Purpose |
|---|---|
| `index.html` | The page |
| `styles.css` | The visual design |
| `app.js` | Location, weather, nearby search, inventory and monitor |
| `lib.js` | Rules and calculations, such as storage risk and distance |
| `tests.js` | Automatic checks for `lib.js` |

---

## Run it

Location only works on `localhost` or an `https` address.

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000**. In a GitHub Codespace, open port 8000 from the **Ports** tab.

To run the checks:

```bash
node tests.js
```

---

## Where it goes next

- Verified storage listings from warehousing corporations and cooperatives.
- Real sensor readings in the monitor.
- A small backend service for place names and nearby search, for heavy use.
- Hindi and regional language versions.
- Crop-specific advice reviewed by agronomists.

---

*Anaj is a hackathon prototype. Its guidance is general and does not replace advice from the local agriculture office.*
