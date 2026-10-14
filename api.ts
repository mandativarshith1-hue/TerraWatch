import type {
  WeatherData,
  DisasterEvent,
  UnifiedAlert,
  HazardType,
  AlertSource,
  AlertSeverity,
  RiskLevel,
  HistoricalData,
} from "@/types";

const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const OPEN_METEO_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FLOOD = "https://flood-api.open-meteo.com/v1/flood";
const USGS_EARTHQUAKE_DAY = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const USGS_EARTHQUAKE_WEEK = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";
const EONET_EVENTS = "https://eonet.gsfc.nasa.gov/api/v3/events";
const NWS_ALERTS = "https://api.weather.gov/alerts/active";

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCached(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

async function fetchJSON<T>(url: string, retries = 2): Promise<T> {
  const cached = getCached<T>(url);
  if (cached) return cached;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      setCached(url, data);
      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "wind_speed_10m",
      "wind_gusts_10m",
      "pressure_msl",
      "relative_humidity_2m",
      "visibility",
      "cloud_cover",
      "weather_code",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation",
      "rain",
      "wind_speed_10m",
      "wind_gusts_10m",
      "visibility",
      "pressure_msl",
      "relative_humidity_2m",
      "cloud_cover",
      "weather_code",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "rain_sum",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "weather_code",
      "sunrise",
      "sunset",
      "uv_index_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
  });

  const data = await fetchJSON<Record<string, unknown>>(`${OPEN_METEO_FORECAST}?${params}`);
  const current = data.current as Record<string, number | boolean | string>;
  const hourly = data.hourly as Record<string, number[] | string[]>;
  const daily = data.daily as Record<string, number[] | string[]>;

  return {
    current: {
      temperature: current.temperature_2m as number,
      apparentTemperature: current.apparent_temperature as number,
      precipitation: current.precipitation as number,
      rain: current.rain as number,
      windSpeed: current.wind_speed_10m as number,
      windGusts: current.wind_gusts_10m as number,
      pressure: current.pressure_msl as number,
      humidity: current.relative_humidity_2m as number,
      visibility: current.visibility as number,
      cloudCover: current.cloud_cover as number,
      weatherCode: current.weather_code as number,
      isDay: current.is_day as boolean,
      time: current.time as string,
    },
    hourly: {
      time: hourly.time as string[],
      temperature: hourly.temperature_2m as number[],
      precipitation: hourly.precipitation as number[],
      rain: hourly.rain as number[],
      windSpeed: hourly.wind_speed_10m as number[],
      windGusts: hourly.wind_gusts_10m as number[],
      visibility: hourly.visibility as number[],
      pressure: hourly.pressure_msl as number[],
      humidity: hourly.relative_humidity_2m as number[],
      cloudCover: hourly.cloud_cover as number[],
      weatherCode: hourly.weather_code as number[],
    },
    daily: {
      time: daily.time as string[],
      temperatureMax: daily.temperature_2m_max as number[],
      temperatureMin: daily.temperature_2m_min as number[],
      precipitationSum: daily.precipitation_sum as number[],
      rainSum: daily.rain_sum as number[],
      windSpeedMax: daily.wind_speed_10m_max as number[],
      windGustsMax: daily.wind_gusts_10m_max as number[],
      weatherCode: daily.weather_code as number[],
      sunrise: daily.sunrise as string[],
      sunset: daily.sunset as string[],
      uvIndexMax: daily.uv_index_max as number[],
    },
    timezone: data.timezone as string,
    fetchedAt: Date.now(),
  };
}

export async function fetchHistorical(lat: number, lon: number): Promise<HistoricalData> {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    daily: "rain_sum,temperature_2m_mean",
    timezone: "auto",
  });

  try {
    const data = await fetchJSON<Record<string, unknown>>(`${OPEN_METEO_ARCHIVE}?${params}`);
    const daily = data.daily as Record<string, number[] | string[]>;
    return {
      dates: daily.time as string[],
      rainfall: daily.rain_sum as number[],
      temperature: daily.temperature_2m_mean as number[],
      source: "Open-Meteo Archive API",
    };
  } catch {
    return { dates: [], rainfall: [], temperature: [], source: "Open-Meteo Archive API" };
  }
}

export async function fetchFloodData(lat: number, lon: number): Promise<number | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: "river_discharge",
    past_days: "7",
  });
  try {
    const data = await fetchJSON<Record<string, unknown>>(`${OPEN_METEO_FLOOD}?${params}`);
    const daily = data.daily as Record<string, number[]>;
    const discharge = (daily.river_discharge as number[]) ?? [];
    return discharge.length > 0 ? discharge[discharge.length - 1] : null;
  } catch {
    return null;
  }
}

export interface GeoResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
  admin1?: string;
}

export async function searchCity(query: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({ name: query, count: "10", language: "en", format: "json" });
  try {
    const data = await fetchJSON<{ results?: GeoResult[] }>(`${OPEN_METEO_GEOCODING}?${params}`);
    return data.results ?? [];
  } catch {
    return [];
  }
}

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    tsunami: number;
    type: string;
  };
  geometry: { coordinates: [number, number, number] };
}

export async function fetchEarthquakes(): Promise<DisasterEvent[]> {
  try {
    const [dayData, weekData] = await Promise.all([
      fetchJSON<{ features: USGSFeature[] }>(USGS_EARTHQUAKE_DAY).catch(() => ({ features: [] })),
      fetchJSON<{ features: USGSFeature[] }>(USGS_EARTHQUAKE_WEEK).catch(() => ({ features: [] })),
    ]);

    const seen = new Set<string>();
    const events: DisasterEvent[] = [];

    for (const feature of [...dayData.features, ...weekData.features]) {
      if (seen.has(feature.id)) continue;
      seen.add(feature.id);
      const [lon, lat, depth] = feature.geometry.coordinates;
      const mag = feature.properties.mag ?? 0;
      const severity: AlertSeverity = mag >= 6 ? "emergency" : mag >= 4.5 ? "warning" : mag >= 2.5 ? "watch" : "advisory";
      const riskLevel: RiskLevel = mag >= 6 ? "severe" : mag >= 4.5 ? "high" : mag >= 2.5 ? "moderate" : "low";

      events.push({
        id: `usgs-${feature.id}`,
        type: "earthquake",
        title: `M${mag.toFixed(1)} Earthquake`,
        description: `${feature.properties.place ?? "Unknown location"}`,
        location: feature.properties.place ?? "Unknown",
        lat,
        lon,
        severity,
        source: "usgs",
        sourceUrl: `https://earthquake.usgs.gov/earthquakes/eventpage/${feature.id}`,
        time: new Date(feature.properties.time).toISOString(),
        magnitude: mag,
        depth,
        tsunamiWarning: feature.properties.tsunami === 1,
        riskLevel,
        raw: feature,
      });
    }
    return events;
  } catch {
    return [];
  }
}

interface EONETEvent {
  id: string;
  title: string;
  description?: string;
  categories: { id: string; title: string }[];
  geometry: { date: string; type: string; coordinates: number[] | number[][] }[];
  sources: { url: string; id: string }[];
  closed?: string | null;
}

const EONET_CATEGORY_MAP: Record<string, HazardType> = {
  "wildfires": "wildfire",
  "volcanoes": "volcano",
  "severeStorms": "cyclone",
  "floods": "flood",
  "drought": "drought",
  "landslides": "landslide",
  "seaLakeIce": "coldWave",
  "manmade": "wildfire",
  "tempExtremes": "heatwave",
};

export async function fetchEonetEvents(): Promise<DisasterEvent[]> {
  try {
    const data = await fetchJSON<{ events: EONETEvent[] }>(`${EONET_EVENTS}?status=open`);
    const events: DisasterEvent[] = [];

    for (const event of data.events) {
      const category = event.categories[0]?.id ?? "";
      const hazardType = EONET_CATEGORY_MAP[category] ?? "flood";
      const geo = event.geometry[event.geometry.length - 1];
      if (!geo || geo.type === "Polygon") continue;
      const coords = geo.coordinates as number[];
      const [lon, lat] = coords;
      if (lat === undefined || lon === undefined) continue;

      const riskLevel: RiskLevel = "high";
      const severity: AlertSeverity = "warning";

      events.push({
        id: `eonet-${event.id}`,
        type: hazardType,
        title: event.title,
        description: event.description ?? event.categories.map((c) => c.title).join(", "),
        location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        lat,
        lon,
        severity,
        source: "eonet",
        sourceUrl: event.sources[0]?.url,
        time: geo.date,
        riskLevel,
        raw: event,
      });
    }
    return events;
  } catch {
    return [];
  }
}

interface NWSAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  severity: string;
  areaDesc: string;
  onset: string;
  expires: string;
  sent: string;
  geometry?: { coordinates: number[][] | number[][][] };
  parameters?: Record<string, string[]>;
}

export async function fetchNWSAlerts(): Promise<UnifiedAlert[]> {
  try {
    const data = await fetchJSON<{ features: { id: string; properties: NWSAlert; geometry?: { coordinates: number[][] } }[] }>(
      `${NWS_ALERTS}?status=actual&message_type=alert`
    );
    const alerts: UnifiedAlert[] = [];

    for (const feature of data.features) {
      const p = feature.properties;
      if (!p) continue;
      const severityMap: Record<string, AlertSeverity> = {
        Minor: "advisory",
        Moderate: "watch",
        Severe: "warning",
        Extreme: "emergency",
      };
      const riskMap: Record<string, RiskLevel> = {
        Minor: "low",
        Moderate: "moderate",
        Severe: "high",
        Extreme: "severe",
      };
      const sev = severityMap[p.severity] ?? "watch";
      const risk = riskMap[p.severity] ?? "moderate";

      let lat = 39.5,
        lon = -98.35;
      if (feature.geometry?.coordinates) {
        const coords = feature.geometry.coordinates[0] as unknown;
        if (Array.isArray(coords) && Array.isArray((coords as unknown[])[0])) {
          const polyCoords = coords as number[][];
          lon = polyCoords.reduce((s, c) => s + c[0], 0) / polyCoords.length;
          lat = polyCoords.reduce((s, c) => s + c[1], 0) / polyCoords.length;
        }
      }

      const titleLower = (p.event || "").toLowerCase();
      let type: HazardType | "official" = "official";
      if (titleLower.includes("flood")) type = "flood";
      else if (titleLower.includes("heat")) type = "heatwave";
      else if (titleLower.includes("tornado") || titleLower.includes("thunderstorm") || titleLower.includes("wind") || titleLower.includes("hurricane") || titleLower.includes("cyclone")) type = "cyclone";
      else if (titleLower.includes("fire")) type = "wildfire";
      else if (titleLower.includes("winter") || titleLower.includes("cold") || titleLower.includes("snow") || titleLower.includes("ice")) type = "coldWave";
      else if (titleLower.includes("tsunami")) type = "tsunami";

      alerts.push({
        id: `nws-${feature.id}`,
        type,
        title: p.event,
        description: (p.description ?? "").slice(0, 500),
        severity: sev,
        riskLevel: risk,
        source: "nws",
        sourceLabel: "NWS (US National Weather Service)",
        sourceUrl: `https://api.weather.gov/alerts/${feature.id}`,
        time: p.sent,
        lat,
        lon,
        location: p.areaDesc ?? "United States",
        instructions: p.instruction ?? undefined,
        expiry: p.expires,
      });
    }
    return alerts;
  } catch {
    return [];
  }
}

export function deriveWeatherAlerts(
  weather: WeatherData,
  lat: number,
  lon: number,
  locationName: string
): UnifiedAlert[] {
  const alerts: UnifiedAlert[] = [];
  const { current, daily, hourly } = weather;

  const rain24h = daily.rainSum[0] ?? 0;
  const rain72h = (daily.rainSum[0] ?? 0) + (daily.rainSum[1] ?? 0) + (daily.rainSum[2] ?? 0);
  const maxGusts = daily.windGustsMax[0] ?? 0;
  const tempMax = daily.temperatureMax[0] ?? current.temperature;
  const apparentTemp = current.apparentTemperature;
  const visibility = current.visibility;

  if (rain24h > 115.6) {
    alerts.push({
      id: `derived-flood-${lat}-${lon}-${Date.now()}`,
      type: "flood",
      title: "RED Heavy Rainfall Warning",
      description: `24h rainfall: ${rain24h.toFixed(1)}mm exceeds 115.6mm threshold. Extreme flood risk.`,
      severity: "emergency",
      riskLevel: "severe",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  } else if (rain24h > 64.5) {
    alerts.push({
      id: `derived-flood-${lat}-${lon}-${Date.now()}`,
      type: "flood",
      title: "ORANGE Heavy Rainfall Warning",
      description: `24h rainfall: ${rain24h.toFixed(1)}mm exceeds 64.5mm threshold. High flood risk.`,
      severity: "warning",
      riskLevel: "high",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  }

  if (tempMax >= 40 || apparentTemp >= 45) {
    alerts.push({
      id: `derived-heat-${lat}-${lon}-${Date.now()}`,
      type: "heatwave",
      title: tempMax >= 45 ? "RED Heatwave Warning" : "ORANGE Heatwave Warning",
      description: `Max temperature: ${tempMax.toFixed(1)}°C, apparent temp: ${apparentTemp.toFixed(1)}°C. Heatwave conditions.`,
      severity: tempMax >= 45 ? "emergency" : "warning",
      riskLevel: tempMax >= 45 ? "severe" : "high",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  }

  if (maxGusts >= 90) {
    alerts.push({
      id: `derived-wind-${lat}-${lon}-${Date.now()}`,
      type: "cyclone",
      title: "RED Strong Wind Warning",
      description: `Wind gusts up to ${maxGusts.toFixed(0)} km/h expected. Damaging winds likely.`,
      severity: "emergency",
      riskLevel: "severe",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  } else if (maxGusts >= 60) {
    alerts.push({
      id: `derived-wind-${lat}-${lon}-${Date.now()}`,
      type: "cyclone",
      title: "ORANGE Strong Wind Warning",
      description: `Wind gusts up to ${maxGusts.toFixed(0)} km/h expected. Strong winds likely.`,
      severity: "warning",
      riskLevel: "high",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  }

  if (visibility > 0 && visibility < 1000) {
    alerts.push({
      id: `derived-fog-${lat}-${lon}-${Date.now()}`,
      type: "official",
      title: "Dense Fog Advisory",
      description: `Visibility: ${visibility.toFixed(0)}m. Very low visibility conditions.`,
      severity: "watch",
      riskLevel: "moderate",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  }

  const hourlyRain = hourly.rain.slice(0, 24);
  const maxHourlyRain = Math.max(...hourlyRain, 0);
  if (maxHourlyRain > 20) {
    alerts.push({
      id: `derived-extrain-${lat}-${lon}-${Date.now()}`,
      type: "extremeRainfall",
      title: "Extreme Rainfall Warning",
      description: `Hourly rainfall up to ${maxHourlyRain.toFixed(1)}mm. Flash flood risk possible.`,
      severity: "warning",
      riskLevel: "high",
      source: "derived",
      sourceLabel: "Derived from forecast (not an official warning)",
      sourceUrl: "https://mausam.imd.gov.in/",
      time: new Date().toISOString(),
      lat,
      lon,
      location: locationName,
    });
  }

  return alerts;
}

export async function fetchAllDisasterEvents(): Promise<{
  earthquakes: DisasterEvent[];
  eonetEvents: DisasterEvent[];
  nwsAlerts: UnifiedAlert[];
}> {
  const [earthquakes, eonetEvents, nwsAlerts] = await Promise.all([
    fetchEarthquakes(),
    fetchEonetEvents(),
    fetchNWSAlerts(),
  ]);
  return { earthquakes, eonetEvents, nwsAlerts };
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
