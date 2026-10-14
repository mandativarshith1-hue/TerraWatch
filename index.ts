export type RiskLevel = "low" | "moderate" | "high" | "severe";

export type HazardType =
  | "flood"
  | "heatwave"
  | "cyclone"
  | "extremeRainfall"
  | "earthquake"
  | "wildfire"
  | "volcano"
  | "landslide"
  | "drought"
  | "coldWave"
  | "tsunami";

export type AlertSource =
  | "open-meteo"
  | "usgs"
  | "eonet"
  | "nws"
  | "gdacs"
  | "derived"
  | "simulation";

export type AlertSeverity = "advisory" | "watch" | "warning" | "emergency";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface CityLocation extends LatLon {
  id: string;
  name: string;
  country: string;
}

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  rain: number;
  windSpeed: number;
  windGusts: number;
  pressure: number;
  humidity: number;
  visibility: number;
  cloudCover: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface HourlyForecast {
  time: string[];
  temperature: number[];
  precipitation: number[];
  rain: number[];
  windSpeed: number[];
  windGusts: number[];
  visibility: number[];
  pressure: number[];
  humidity: number[];
  cloudCover: number[];
  weatherCode: number[];
}

export interface DailyForecast {
  time?: string[];
  temperatureMax: number[];
  temperatureMin: number[];
  precipitationSum: number[];
  rainSum: number[];
  windSpeedMax: number[];
  windGustsMax: number[];
  weatherCode: number[];
  sunrise: string[];
  sunset: string[];
  uvIndexMax: number[];
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: HourlyForecast;
  daily: DailyForecast;
  timezone: string;
  fetchedAt: number;
}

export interface HistoricalData {
  dates: string[];
  rainfall: number[];
  temperature: number[];
  source: string;
}

export interface RiskIndicator {
  name: string;
  value: string;
  contribution: number;
  maxContribution: number;
  description: string;
}

export interface RiskAssessment {
  hazard: HazardType;
  score: number;
  level: RiskLevel;
  indicators: RiskIndicator[];
}

export interface DisasterEvent {
  id: string;
  type: HazardType;
  title: string;
  description: string;
  location: string;
  lat: number;
  lon: number;
  severity: AlertSeverity;
  source: AlertSource;
  sourceUrl?: string;
  time: string;
  magnitude?: number;
  depth?: number;
  tsunamiWarning?: boolean;
  affectedArea?: string;
  affectedPopulation?: string;
  alertLevel?: RiskLevel;
  sourceLabel?: string;
  riskLevel?: RiskLevel;
  raw?: unknown;
}

export interface UnifiedAlert {
  id: string;
  type: HazardType | "official";
  title: string;
  description: string;
  severity: AlertSeverity;
  riskLevel: RiskLevel;
  source: AlertSource;
  sourceLabel: string;
  sourceUrl?: string;
  time: string;
  lat: number;
  lon: number;
  location: string;
  instructions?: string;
  expiry?: string;
}

export interface SafetyGuidance {
  before: string[];
  during: string[];
  after: string[];
}

export interface EmergencyContact {
  name: string;
  number: string;
  description: string;
}

export type ThemeMode = "dark" | "light";

export type ViewMode = "live" | "simulation";

export type ScenarioId =
  | "live"
  | "chennai-cyclone"
  | "assam-flood"
  | "delhi-heatwave"
  | "mumbai-rainfall"
  | "himalayan-earthquake";

export interface ScenarioData {
  id: ScenarioId;
  name: string;
  description: string;
  centerLat: number;
  centerLon: number;
  zoom: number;
  events: DisasterEvent[];
  alerts: UnifiedAlert[];
  weather: WeatherData;
  riskAssessments: RiskAssessment[];
  timelineHours: number;
  timelineData: TimelineFrame[];
}

export interface TimelineFrame {
  hour: number;
  label: string;
  weather: Partial<WeatherCurrent>;
  riskScores: Partial<Record<HazardType, number>>;
  alertLevel: RiskLevel;
}

export interface PreparednessItem {
  id: string;
  label: string;
  done: boolean;
}
