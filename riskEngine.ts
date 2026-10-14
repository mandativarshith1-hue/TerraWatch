import type {
  WeatherData,
  RiskAssessment,
  RiskIndicator,
  RiskLevel,
  HazardType,
  DisasterEvent,
  HistoricalData,
} from "@/types";
import { haversineDistance } from "@/lib/api";

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 70) return "severe";
  if (score >= 45) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

export function levelToScore(level: RiskLevel): number {
  switch (level) {
    case "severe": return 80;
    case "high": return 55;
    case "moderate": return 35;
    case "low": return 10;
  }
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function makeIndicator(
  name: string,
  value: string,
  contribution: number,
  maxContribution: number,
  description: string
): RiskIndicator {
  return { name, value, contribution: Math.round(contribution), maxContribution, description };
}

export function assessFlood(weather: WeatherData, riverDischarge: number | null): RiskAssessment {
  const rain24h = weather.daily.rainSum[0] ?? 0;
  const rain72h = (weather.daily.rainSum[0] ?? 0) + (weather.daily.rainSum[1] ?? 0) + (weather.daily.rainSum[2] ?? 0);
  const forecastRain = weather.daily.precipitationSum.slice(0, 3).reduce((a, b) => a + (b ?? 0), 0);
  const humidity = weather.current.humidity;
  const indicators: RiskIndicator[] = [];

  const rain24Score = Math.min(30, (rain24h / 115.6) * 30);
  indicators.push(makeIndicator("24h Rainfall", `${rain24h.toFixed(1)} mm`, rain24Score, 30, "IMD: >64.5mm is heavy rain, >115.6mm is extremely heavy"));

  const rain72Score = Math.min(25, (rain72h / 200) * 25);
  indicators.push(makeIndicator("72h Rainfall", `${rain72h.toFixed(1)} mm`, rain72Score, 25, "3-day accumulation indicates sustained rainfall"));

  const forecastScore = Math.min(20, (forecastRain / 150) * 20);
  indicators.push(makeIndicator("Forecast Rain (3d)", `${forecastRain.toFixed(1)} mm`, forecastScore, 20, "Upcoming precipitation forecast"));

  const dischargeScore = riverDischarge !== null ? Math.min(15, (riverDischarge / 5000) * 15) : 0;
  indicators.push(makeIndicator("River Discharge", riverDischarge !== null ? `${riverDischarge.toFixed(0)} m³/s` : "N/A", dischargeScore, 15, "River flow rate from Open-Meteo Flood API"));

  const humidityScore = Math.min(10, ((humidity - 60) / 40) * 10);
  indicators.push(makeIndicator("Humidity", `${humidity.toFixed(0)}%`, Math.max(0, humidityScore), 10, "High humidity indicates saturated air mass"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "flood", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessHeatwave(weather: WeatherData, historical: HistoricalData | null): RiskAssessment {
  const tempMax = weather.daily.temperatureMax[0] ?? weather.current.temperature;
  const apparentTemp = weather.current.apparentTemperature;
  const histAvg = historical && historical.temperature.length > 0
    ? historical.temperature.reduce((a, b) => a + b, 0) / historical.temperature.length
    : tempMax - 5;
  const deviation = tempMax - histAvg;

  let consecutiveHotDays = 0;
  for (const t of weather.daily.temperatureMax) {
    if (t >= 40) consecutiveHotDays++;
    else break;
  }

  const indicators: RiskIndicator[] = [];

  const tempScore = Math.min(35, ((tempMax - 30) / 20) * 35);
  indicators.push(makeIndicator("Max Temperature", `${tempMax.toFixed(1)}°C`, tempScore, 35, "IMD: ≥40°C is heatwave condition"));

  const apparentScore = Math.min(25, ((apparentTemp - 35) / 15) * 25);
  indicators.push(makeIndicator("Apparent Temperature", `${apparentTemp.toFixed(1)}°C`, Math.max(0, apparentScore), 25, "Feels-like temperature including humidity"));

  const devScore = Math.min(20, (Math.max(0, deviation) / 7) * 20);
  indicators.push(makeIndicator("Deviation from Normal", `+${deviation.toFixed(1)}°C`, devScore, 20, "IMD: 4.5°C above normal = heatwave"));

  const consecScore = Math.min(20, (consecutiveHotDays / 5) * 20);
  indicators.push(makeIndicator("Consecutive Hot Days", `${consecutiveHotDays} days`, consecScore, 20, "Sustained heat compounds health risk"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "heatwave", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessCyclone(weather: WeatherData): RiskAssessment {
  const windSpeed = weather.current.windSpeed;
  const gusts = weather.current.windGusts;
  const pressure = weather.current.pressure;
  const maxGusts = weather.daily.windGustsMax[0] ?? gusts;

  const indicators: RiskIndicator[] = [];

  const windScore = Math.min(30, (windSpeed / 120) * 30);
  indicators.push(makeIndicator("Wind Speed", `${windSpeed.toFixed(0)} km/h`, windScore, 30, "Sustained wind speed"));

  const gustScore = Math.min(30, (gusts / 150) * 30);
  indicators.push(makeIndicator("Wind Gusts", `${gusts.toFixed(0)} km/h`, gustScore, 30, "IMD: ≥60 km/h orange, ≥90 km/h red"));

  const pressureScore = pressure < 1000 ? Math.min(25, ((1013 - pressure) / 40) * 25) : 5;
  indicators.push(makeIndicator("Pressure", `${pressure.toFixed(0)} hPa`, pressureScore, 25, "Low pressure indicates cyclone/storm system"));

  const forecastGustScore = Math.min(15, (maxGusts / 150) * 15);
  indicators.push(makeIndicator("Forecast Max Gusts", `${maxGusts.toFixed(0)} km/h`, forecastGustScore, 15, "Maximum forecast gusts for today"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "cyclone", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessExtremeRainfall(weather: WeatherData): RiskAssessment {
  const hourlyRain = weather.hourly.rain.slice(0, 24);
  const maxHourly = Math.max(...hourlyRain, 0);
  const rain3day = weather.daily.rainSum.slice(0, 3).reduce((a, b) => a + (b ?? 0), 0);
  const intensity = weather.current.rain;

  const indicators: RiskIndicator[] = [];

  const hourlyScore = Math.min(40, (maxHourly / 50) * 40);
  indicators.push(makeIndicator("Max Hourly Rain", `${maxHourly.toFixed(1)} mm/hr`, hourlyScore, 40, ">20mm/hr is intense rainfall"));

  const intensityScore = Math.min(25, (intensity / 30) * 25);
  indicators.push(makeIndicator("Current Rain Rate", `${intensity.toFixed(1)} mm`, intensityScore, 25, "Current precipitation intensity"));

  const accum3dScore = Math.min(20, (rain3day / 300) * 20);
  indicators.push(makeIndicator("3-Day Accumulation", `${rain3day.toFixed(1)} mm`, accum3dScore, 20, "Cumulative rainfall over 3 days"));

  const precipScore = Math.min(15, ((weather.daily.precipitationSum[0] ?? 0) / 200) * 15);
  indicators.push(makeIndicator("24h Precipitation", `${(weather.daily.precipitationSum[0] ?? 0).toFixed(1)} mm`, precipScore, 15, "Total precipitation today"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "extremeRainfall", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessEarthquake(lat: number, lon: number, events: DisasterEvent[]): RiskAssessment {
  let nearestDist = Infinity;
  let nearestMag = 0;
  let nearestEvent: DisasterEvent | null = null;

  for (const e of events) {
    if (e.type !== "earthquake") continue;
    const dist = haversineDistance(lat, lon, e.lat, e.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestMag = e.magnitude ?? 0;
      nearestEvent = e;
    }
  }

  const indicators: RiskIndicator[] = [];

  if (nearestEvent) {
    const proxScore = Math.max(0, 40 - (nearestDist / 500) * 40);
    indicators.push(makeIndicator("Distance to Nearest Quake", `${nearestDist.toFixed(0)} km`, proxScore, 40, "Closer events have higher impact"));

    const magScore = Math.min(40, (nearestMag / 8) * 40);
    indicators.push(makeIndicator("Magnitude", `M${nearestMag.toFixed(1)}`, magScore, 40, "Higher magnitude = greater energy released"));

    const depthScore = nearestEvent.depth
      ? Math.min(20, (50 / Math.max(nearestEvent.depth, 5)) * 20)
      : 10;
    indicators.push(makeIndicator("Depth", nearestEvent.depth ? `${nearestEvent.depth.toFixed(0)} km` : "N/A", depthScore, 20, "Shallow quakes cause more surface damage"));
  } else {
    indicators.push(makeIndicator("Nearby Earthquakes", "None detected (24h)", 5, 40, "No recent seismic activity in vicinity"));
    indicators.push(makeIndicator("Magnitude", "N/A", 0, 40, "No nearby event"));
    indicators.push(makeIndicator("Depth", "N/A", 0, 20, "No nearby event"));
  }

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "earthquake", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessWildfire(lat: number, lon: number, events: DisasterEvent[], weather: WeatherData): RiskAssessment {
  let nearestDist = Infinity;
  let nearestEvent: DisasterEvent | null = null;

  for (const e of events) {
    if (e.type !== "wildfire") continue;
    const dist = haversineDistance(lat, lon, e.lat, e.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEvent = e;
    }
  }

  const indicators: RiskIndicator[] = [];
  const temp = weather.current.temperature;
  const humidity = weather.current.humidity;

  const proxScore = nearestEvent ? Math.max(0, 30 - (nearestDist / 200) * 30) : 0;
  indicators.push(makeIndicator("Distance to Active Fire", nearestEvent ? `${nearestDist.toFixed(0)} km` : "None detected", proxScore, 30, "Proximity to active wildfire from NASA EONET"));

  const tempScore = Math.min(25, ((temp - 25) / 20) * 25);
  indicators.push(makeIndicator("Temperature", `${temp.toFixed(1)}°C`, Math.max(0, tempScore), 25, "High temperatures increase fire risk"));

  const humidScore = Math.min(25, ((40 - humidity) / 40) * 25);
  indicators.push(makeIndicator("Humidity", `${humidity.toFixed(0)}%`, Math.max(0, humidScore), 25, "Low humidity dries vegetation, increasing fire risk"));

  const windScore = Math.min(20, (weather.current.windSpeed / 50) * 20);
  indicators.push(makeIndicator("Wind Speed", `${weather.current.windSpeed.toFixed(0)} km/h`, windScore, 20, "Wind spreads fire rapidly"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "wildfire", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessVolcano(lat: number, lon: number, events: DisasterEvent[]): RiskAssessment {
  let nearestDist = Infinity;
  let nearestEvent: DisasterEvent | null = null;

  for (const e of events) {
    if (e.type !== "volcano") continue;
    const dist = haversineDistance(lat, lon, e.lat, e.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEvent = e;
    }
  }

  const indicators: RiskIndicator[] = [];
  if (nearestEvent) {
    const proxScore = Math.max(0, 60 - (nearestDist / 300) * 60);
    indicators.push(makeIndicator("Distance to Active Volcano", `${nearestDist.toFixed(0)} km`, proxScore, 60, "Proximity to active volcanic eruption (NASA EONET)"));
    indicators.push(makeIndicator("Eruption Status", "Active", 30, 30, "EONET reports ongoing volcanic activity"));
    indicators.push(makeIndicator("Ash Fall Risk", nearestDist < 100 ? "High" : "Moderate", 10, 10, "Ash can travel hundreds of km downwind"));
  } else {
    indicators.push(makeIndicator("Active Volcanoes", "None detected nearby", 5, 60, "No EONET volcanic events in region"));
    indicators.push(makeIndicator("Eruption Status", "N/A", 0, 30, "No nearby active eruptions"));
    indicators.push(makeIndicator("Ash Fall Risk", "N/A", 0, 10, "No nearby eruption source"));
  }

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "volcano", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessLandslide(weather: WeatherData): RiskAssessment {
  const rain24h = weather.daily.rainSum[0] ?? 0;
  const rain72h = (weather.daily.rainSum[0] ?? 0) + (weather.daily.rainSum[1] ?? 0) + (weather.daily.rainSum[2] ?? 0);
  const humidity = weather.current.humidity;

  const indicators: RiskIndicator[] = [];

  const rainScore = Math.min(40, (rain24h / 100) * 40);
  indicators.push(makeIndicator("24h Rainfall", `${rain24h.toFixed(1)} mm`, rainScore, 40, "Heavy rainfall triggers landslides on slopes"));

  const accumScore = Math.min(30, (rain72h / 200) * 30);
  indicators.push(makeIndicator("72h Accumulation", `${rain72h.toFixed(1)} mm`, accumScore, 30, "Sustained rainfall saturates soil"));

  const humidScore = Math.min(30, ((humidity - 60) / 40) * 30);
  indicators.push(makeIndicator("Soil Moisture (proxy)", `${humidity.toFixed(0)}%`, Math.max(0, humidScore), 30, "High humidity indicates saturated soil"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "landslide", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessDrought(weather: WeatherData, historical: HistoricalData | null): RiskAssessment {
  const rain7day = weather.daily.rainSum.reduce((a, b) => a + (b ?? 0), 0);
  const histAvgRain = historical && historical.rainfall.length > 0
    ? historical.rainfall.reduce((a, b) => a + b, 0) / historical.rainfall.length
    : 5;
  const tempAvg = weather.daily.temperatureMax.reduce((a, b) => a + (b ?? 0), 0) / (weather.daily.temperatureMax.length || 1);

  const indicators: RiskIndicator[] = [];

  const rainDeficit = Math.max(0, 30 - (rain7day / 50) * 30);
  indicators.push(makeIndicator("7-Day Rainfall", `${rain7day.toFixed(1)} mm`, rainDeficit, 30, "Low rainfall indicates dry conditions"));

  const histScore = Math.max(0, 25 - (histAvgRain / 10) * 25);
  indicators.push(makeIndicator("Historical Avg Rain", `${histAvgRain.toFixed(1)} mm/day`, histScore, 25, "Below-normal rainfall over 30 days"));

  const tempScore = Math.min(25, ((tempAvg - 30) / 15) * 25);
  indicators.push(makeIndicator("Avg Max Temperature", `${tempAvg.toFixed(1)}°C`, Math.max(0, tempScore), 25, "High temperatures increase evaporation"));

  const dryDays = weather.daily.rainSum.filter((r) => (r ?? 0) < 1).length;
  const dryScore = Math.min(20, (dryDays / 7) * 20);
  indicators.push(makeIndicator("Dry Days (7d)", `${dryDays} days`, dryScore, 20, "Consecutive days without rain"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "drought", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export function assessColdWave(weather: WeatherData): RiskAssessment {
  const tempMin = weather.daily.temperatureMin[0] ?? weather.current.temperature;
  const tempCurrent = weather.current.temperature;
  const windChill = tempCurrent - (weather.current.windSpeed / 10) * 0.5;

  const indicators: RiskIndicator[] = [];

  const minScore = Math.max(0, ((10 - tempMin) / 15) * 40);
  indicators.push(makeIndicator("Min Temperature", `${tempMin.toFixed(1)}°C`, minScore, 40, "IMD: ≤10°C with wind is cold wave territory"));

  const currentScore = Math.max(0, ((10 - tempCurrent) / 15) * 30);
  indicators.push(makeIndicator("Current Temperature", `${tempCurrent.toFixed(1)}°C`, currentScore, 30, "Current cold exposure"));

  const chillScore = Math.max(0, ((10 - windChill) / 15) * 30);
  indicators.push(makeIndicator("Wind Chill", `${windChill.toFixed(1)}°C`, chillScore, 30, "Wind makes it feel colder than actual temperature"));

  const total = indicators.reduce((s, i) => s + i.contribution, 0);
  return { hazard: "coldWave", score: clampScore(total), level: scoreToLevel(total), indicators };
}

export interface FullRiskAssessment {
  flood: RiskAssessment;
  heatwave: RiskAssessment;
  cyclone: RiskAssessment;
  extremeRainfall: RiskAssessment;
  earthquake: RiskAssessment;
  wildfire: RiskAssessment;
  volcano: RiskAssessment;
  landslide: RiskAssessment;
  drought: RiskAssessment;
  coldWave: RiskAssessment;
  overall: RiskAssessment;
}

export function assessAllRisks(
  weather: WeatherData,
  lat: number,
  lon: number,
  events: DisasterEvent[],
  historical: HistoricalData | null,
  riverDischarge: number | null
): FullRiskAssessment {
  const flood = assessFlood(weather, riverDischarge);
  const heatwave = assessHeatwave(weather, historical);
  const cyclone = assessCyclone(weather);
  const extremeRainfall = assessExtremeRainfall(weather);
  const earthquake = assessEarthquake(lat, lon, events);
  const wildfire = assessWildfire(lat, lon, events, weather);
  const volcano = assessVolcano(lat, lon, events);
  const landslide = assessLandslide(weather);
  const drought = assessDrought(weather, historical);
  const coldWave = assessColdWave(weather);

  const all = [flood, heatwave, cyclone, extremeRainfall, earthquake, wildfire, volcano, landslide, drought, coldWave];
  const overallScore = Math.round(all.reduce((s, a) => Math.max(s, a.score), 0));
  const overall: RiskAssessment = {
    hazard: "flood",
    score: overallScore,
    level: scoreToLevel(overallScore),
    indicators: all
      .filter((a) => a.score >= 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((a) => ({
        name: a.hazard.charAt(0).toUpperCase() + a.hazard.slice(1),
        value: `${a.score}/100`,
        contribution: a.score,
        maxContribution: 100,
        description: `Top contributing hazard`,
      })),
  };

  return {
    flood,
    heatwave,
    cyclone,
    extremeRainfall,
    earthquake,
    wildfire,
    volcano,
    landslide,
    drought,
    coldWave,
    overall,
  };
}
