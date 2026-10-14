# TerraWatch — Intelligent Climate Risk & Disaster Response System

A real-time climate risk monitoring and disaster response web app built for a hackathon on climate and disaster management. TerraWatch identifies climate risks and disasters globally, shows understandable risk levels, gives alerts and safety/emergency guidance, demonstrates working scenarios, and explains real-world impact and scalability.

## Features

### 3D Interactive Earth
- 3D Earth globe with day/night textures (toggle dark/light mode)
- Drag to rotate, scroll to zoom, click anywhere to get lat/lon
- City search via Open-Meteo Geocoding API (flies camera to result)
- Risk markers as glowing colored points (green/yellow/orange/red)
- Layer toggles for each hazard type

### Real Data Sources (no API keys needed)
- **Open-Meteo Forecast API**: temperature, precipitation, wind, pressure, humidity, visibility, 7-day forecast
- **Open-Meteo Archive API**: historical rainfall and temperature
- **Open-Meteo Flood API**: river discharge data
- **USGS GeoJSON feeds**: earthquakes (all_day + 4.5_week), magnitude, depth, tsunami flag
- **NASA EONET v3**: wildfires, volcanoes, severe storms, floods, drought, landslides
- **NWS Alerts API**: official US weather warnings with severity and instructions

### Derived Weather Alerts (threshold-based, clearly labeled)
- Heavy rain: >64.5mm/24h (Orange), >115.6mm (Red) — IMD thresholds
- Heatwave: ≥40°C or 4.5°C above normal
- Strong wind: gusts ≥60 km/h (Orange), ≥90 km/h (Red)
- Dense fog: visibility <1000m
- All labeled "Derived from forecast, not an official warning"

### Risk Engine (transparent and explainable)
- 0-100 risk score per hazard from weighted indicators
- Each indicator shows its value, contribution, and explanation ("Why this score?")
- 10 hazard types: flood, heatwave, cyclone, extreme rainfall, earthquake, wildfire, volcano, landslide, drought, cold wave
- Levels: Low (green), Moderate (yellow), High (orange), Severe (red)

### Location Detail Panel
- Current weather conditions with all metrics
- 7-day forecast chart (temperature, rain, wind)
- Risk gauges for all hazards with expandable breakdowns
- Alert banner matching risk level
- Safety guidance: before, during, after (per hazard)
- Emergency response guidance for authorities
- India emergency numbers (112, NDMA 1078, ambulance 108)
- Copy button for ready-to-send SMS/WhatsApp alert message

### Alert Center
- Unified live feed: official alerts, earthquakes, EONET events, derived alerts
- Filters by type, severity, region, source
- "Near Me" using browser geolocation with haversine distance
- Severity badges (Advisory, Watch, Warning, Emergency) with color and text
- Watchlist saved in localStorage

### Simulation Mode (for demo)
- 5 scenarios: Chennai Cyclone, Assam Flood, Delhi Heatwave, Mumbai Extreme Rainfall, Himalayan Earthquake
- Realistic simulated data with clear "SIMULATED" badge
- Time slider that animates events hour by hour
- Risk markers and alert levels update as it plays

### Dashboard
- Global overview: counts at each risk level
- Ranked list of highest-risk locations (click to fly to it)
- Live alert feed with timestamps
- Preparedness checklist saved in localStorage

### Impact & Scalability Page
- Real-world impact explanation
- Scalability path (satellite data, IoT sensors, SMS alerts, multilingual, government dashboards)
- Clear labeling of what is real, derived, and simulated data

## Setup

```bash
npm install
npm run dev
```

The app runs on http://localhost:5173

## Build

```bash
npm run build
```

## APIs Used

| API | Purpose | Key Required |
|-----|---------|-------------|
| Open-Meteo Forecast | Current weather, hourly, 7-day forecast | No |
| Open-Meteo Archive | Historical rainfall & temperature | No |
| Open-Meteo Flood | River discharge data | No |
| Open-Meteo Geocoding | City search | No |
| USGS Earthquake Feed | Earthquake events (24h + week) | No |
| NASA EONET v3 | Wildfires, volcanoes, storms, floods | No |
| NWS Alerts API | Official US weather warnings | No |

## Demo Script for Judges

1. **Open the globe** — the 3D Earth loads with auto-rotation. Drag to rotate, scroll to zoom.
2. **Click a location** — click anywhere on the globe to drop a pin and see live weather and risk assessment.
3. **Search a city** — type "Chennai" in the search box. The camera flies there and loads live weather data.
4. **View live earthquakes** — glowing ring markers on the globe show real USGS earthquake data. Click one to see magnitude, depth, and tsunami flag.
5. **Run Chennai Cyclone scenario** — switch to "Chennai Cyclone" in Simulation Mode. Use the time slider to watch wind speed, pressure, and risk levels evolve hour by hour. See safety guidance and emergency response instructions.
6. **Check the Alert Center** — click "Alerts" in the top nav to see the unified feed of official and derived alerts.
7. **View the Dashboard** — see global risk overview, ranked cities, and the preparedness checklist.
8. **Toggle light/dark mode** — click the sun/moon icon to switch between night and day Earth textures.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Three.js + @react-three/fiber + @react-three/drei
- Lucide React icons

## Project Structure

```
src/
  components/
    globe/         # 3D Earth globe with markers
    panels/        # Location detail, Alert Center, Dashboard, Impact, Simulation
    ui/            # Reusable UI: RiskGauge, AlertBadge, ForecastChart, CitySearch, LayerToggles
  context/         # Theme and Location contexts
  data/            # City list, hazard metadata, safety guidance, simulation scenarios
  lib/             # API layer and risk engine (pure functions)
  types/           # TypeScript type definitions
  App.tsx          # Main app with navigation and state management
```
