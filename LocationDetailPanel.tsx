import { useState, useEffect } from "react";
import {
  X, Thermometer, Droplets, Wind, Eye, Gauge, Cloud, CloudRain, Copy, Check,
  Phone, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, MapPin,
  Clock, Heart, Shield, Users, Building2, Navigation, Plus, Flame, Home, Pill, Search,
} from "lucide-react";
import type { WeatherData, RiskAssessment, DisasterEvent, UnifiedAlert, HazardType } from "@/types";
import { RISK_LEVEL_META, HAZARD_META, SAFETY_GUIDANCE, EMERGENCY_CONTACTS, NEARBY_EMERGENCY_SERVICES } from "@/data/cities";

const SERVICE_ICON_MAP: Record<string, typeof Shield> = {
  Plus, Shield, Flame, Home, Pill, Droplets,
};
import RiskGauge from "@/components/ui/RiskGauge";
import ForecastChart from "@/components/ui/ForecastChart";
import { SeverityBadge, SourceBadge, SimulatedBadge } from "@/components/ui/AlertBadge";
import { getHazardIcon } from "@/components/ui/HazardIcon";
import type { FullRiskAssessment } from "@/lib/riskEngine";

interface LocationDetailPanelProps {
  locationName: string;
  lat: number;
  lon: number;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  risks: FullRiskAssessment | null;
  alerts: UnifiedAlert[];
  selectedEvent: DisasterEvent | null;
  onRetry: () => void;
  isWatched: boolean;
  onToggleWatch: () => void;
  onClose: () => void;
  isSimulated?: boolean;
}

const WEATHER_CODE_MAP: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
  55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Freezing rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  77: "Snow grains", 80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
  85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm hail",
  99: "Severe thunderstorm",
};

const HAZARD_ORDER: HazardType[] = ["flood", "heatwave", "cyclone", "extremeRainfall", "earthquake", "wildfire", "volcano", "landslide", "drought", "coldWave"];

export default function LocationDetailPanel({
  locationName,
  lat,
  lon,
  weather,
  weatherLoading,
  weatherError,
  risks,
  alerts,
  selectedEvent,
  onRetry,
  isWatched,
  onToggleWatch,
  onClose,
  isSimulated,
}: LocationDetailPanelProps) {
  const [chartType, setChartType] = useState<"temperature" | "rain" | "wind">("temperature");
  const [expandedHazard, setExpandedHazard] = useState<HazardType | null>(null);
  const [showGuidance, setShowGuidance] = useState<HazardType | null>(null);
  const [copied, setCopied] = useState(false);

  const overallLevel = risks?.overall.level ?? "low";
  const overallScore = risks?.overall.score ?? 0;
  const overallMeta = RISK_LEVEL_META[overallLevel];

  const topAlert = alerts[0];
  const alertBannerText = topAlert
    ? `${topAlert.severity === "emergency" ? "EMERGENCY" : topAlert.severity === "warning" ? "WARNING" : "ADVISORY"}: ${topAlert.title}`
    : overallLevel === "severe"
    ? "SEVERE RISK — Exercise extreme caution"
    : overallLevel === "high"
    ? "HIGH RISK — Stay alert"
    : overallLevel === "moderate"
    ? "MODERATE RISK — Stay informed"
    : "LOW RISK — Conditions are normal";

  const generateAlertMessage = () => {
    const lines = [
      `TERRAWATCH ALERT — ${locationName}`,
      `Risk Level: ${overallMeta.label.toUpperCase()} (${overallScore}/100)`,
      topAlert ? `Alert: ${topAlert.title}` : "",
      weather ? `Temp: ${weather.current.temperature}°C | Wind: ${weather.current.windSpeed} km/h | Rain: ${weather.current.rain}mm` : "",
      `Location: ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      "Stay safe. Follow local authority instructions.",
      "Emergency: 112 | NDMA: 1078 | Ambulance: 108",
    ].filter(Boolean);
    return lines.join("\n");
  };

  const copyAlert = () => {
    const msg = generateAlertMessage();
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const weatherDesc = weather ? WEATHER_CODE_MAP[weather.current.weatherCode] ?? "Unknown" : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <h2 className="truncate text-lg font-bold text-white">{locationName}</h2>
            {isSimulated && <SimulatedBadge />}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {lat.toFixed(4)}°, {lon.toFixed(4)}°
            {weather && (
              <span className="ml-2">
                Updated {new Date(weather.fetchedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleWatch}
            className={`rounded-lg p-1.5 transition-colors ${isWatched ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"}`}
            title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Heart className="h-4 w-4" fill={isWatched ? "currentColor" : "none"} />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      <div
        className="px-4 py-2 border-b border-white/10"
        style={{ backgroundColor: `${overallMeta.color}15` }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: overallMeta.color }} />
          <span className="text-sm font-bold" style={{ color: overallMeta.color }}>{alertBannerText}</span>
        </div>
        {topAlert && topAlert.source === "derived" && (
          <p className="mt-1 text-[10px] text-gray-500">
            Derived from forecast, not an official warning.{" "}
            <a href="https://mausam.imd.gov.in/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              Check IMD
            </a>
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {weatherLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="ml-2 text-sm text-gray-400">Fetching live weather...</span>
          </div>
        )}

        {weatherError && !weatherLoading && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">Failed to load weather data</p>
            <p className="text-xs text-gray-500 mt-1">{weatherError}</p>
            <button onClick={onRetry} className="mt-2 rounded bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/30">
              Retry
            </button>
          </div>
        )}

        {/* Current Weather */}
        {weather && !weatherLoading && (
          <>
            <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-white">{weather.current.temperature.toFixed(0)}°C</span>
                  <p className="text-sm text-gray-400">{weatherDesc}</p>
                  <p className="text-xs text-gray-500">Feels like {weather.current.apparentTemperature.toFixed(0)}°C</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <WeatherStat icon={Droplets} label="Humidity" value={`${weather.current.humidity.toFixed(0)}%`} />
                  <WeatherStat icon={Wind} label="Wind" value={`${weather.current.windSpeed.toFixed(0)} km/h`} />
                  <WeatherStat icon={CloudRain} label="Rain" value={`${weather.current.rain.toFixed(1)} mm`} />
                  <WeatherStat icon={Gauge} label="Pressure" value={`${weather.current.pressure.toFixed(0)} hPa`} />
                  <WeatherStat icon={Wind} label="Gusts" value={`${weather.current.windGusts.toFixed(0)} km/h`} />
                  <WeatherStat icon={Eye} label="Visibility" value={`${(weather.current.visibility / 1000).toFixed(1)} km`} />
                </div>
              </div>
            </div>

            {/* 7-day Forecast Chart */}
            <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
              <div className="flex gap-1 mb-2">
                {(["temperature", "rain", "wind"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    className={`rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
                      chartType === t ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t === "temperature" ? "Temp" : t === "rain" ? "Rain" : "Wind"}
                  </button>
                ))}
              </div>
              <ForecastChart weather={weather} type={chartType} />
            </div>
          </>
        )}

        {/* Risk Gauges */}
        {risks && (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Risk Assessment</h3>
              <RiskGauge score={overallScore} level={overallLevel} size={80} />
            </div>
            <div className="space-y-1">
              {HAZARD_ORDER.map((hazard) => {
                const risk = risks[hazard as keyof FullRiskAssessment] as RiskAssessment;
                if (!risk) return null;
                const meta = RISK_LEVEL_META[risk.level];
                const Icon = getHazardIcon(HAZARD_META[hazard].icon);
                const isExpanded = expandedHazard === hazard;
                return (
                  <div key={hazard} className="rounded-lg bg-slate-900/50">
                    <button
                      onClick={() => setExpandedHazard(isExpanded ? null : hazard)}
                      className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: meta.color }} />
                      <span className="flex-1 text-xs font-medium text-gray-200">{HAZARD_META[hazard].label}</span>
                      <span className="text-xs font-bold" style={{ color: meta.color }}>{risk.score}</span>
                      <span className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${risk.score}%`, backgroundColor: meta.color }} />
                      </span>
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
                    </button>
                    {isExpanded && (
                      <div className="px-2.5 pb-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Why this score?</div>
                        {risk.indicators.map((ind, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="text-gray-300 font-medium">{ind.name}</span>
                                <span className="text-gray-400">{ind.value}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${(ind.contribution / ind.maxContribution) * 100}%`,
                                      backgroundColor: meta.color,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-gray-500">{ind.contribution}/{ind.maxContribution}</span>
                              </div>
                              <p className="text-[10px] text-gray-600 mt-0.5">{ind.description}</p>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowGuidance(showGuidance === hazard ? null : hazard)}
                          className="mt-1 w-full rounded-lg bg-blue-500/10 px-2 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
                        >
                          {showGuidance === hazard ? "Hide" : "Show"} Safety Guidance
                        </button>
                      </div>
                    )}
                    {showGuidance === hazard && isExpanded && (
                      <div className="border-t border-white/5 px-2.5 pb-3 pt-2 space-y-2">
                        <SafetySection title="Before" items={SAFETY_GUIDANCE[hazard].before} icon={Shield} color="text-blue-400" />
                        <SafetySection title="During" items={SAFETY_GUIDANCE[hazard].during} icon={AlertTriangle} color="text-orange-400" />
                        <SafetySection title="After" items={SAFETY_GUIDANCE[hazard].after} icon={Check} color="text-green-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alerts for this location */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <h3 className="text-sm font-semibold text-white mb-2">Active Alerts ({alerts.length})</h3>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg bg-slate-900/60 p-2.5 border border-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white flex-1">{alert.title}</span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <SourceBadge source={alert.source} />
                    <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(alert.time).toLocaleString()}
                    </span>
                  </div>
                  {alert.sourceUrl && (
                    <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
                      Source <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              Event Details
            </h3>
            <div className="space-y-1.5 text-xs">
              <DetailRow label="Type" value={HAZARD_META[selectedEvent.type].label} />
              <DetailRow label="Severity" value={selectedEvent.severity} />
              <DetailRow label="Location" value={selectedEvent.location} />
              <DetailRow label="Time" value={new Date(selectedEvent.time).toLocaleString()} />
              {selectedEvent.magnitude && <DetailRow label="Magnitude" value={`M${selectedEvent.magnitude.toFixed(1)}`} />}
              {selectedEvent.depth && <DetailRow label="Depth" value={`${selectedEvent.depth.toFixed(0)} km`} />}
              {selectedEvent.tsunamiWarning && (
                <div className="rounded bg-red-500/20 px-2 py-1 text-xs font-bold text-red-400">
                  TSUNAMI WARNING ACTIVE
                </div>
              )}
              {selectedEvent.affectedArea && <DetailRow label="Affected Area" value={selectedEvent.affectedArea} />}
              {selectedEvent.affectedPopulation && <DetailRow label="Affected Pop." value={selectedEvent.affectedPopulation} />}
              {selectedEvent.sourceUrl && (
                <a href={selectedEvent.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:underline mt-1">
                  Source link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-red-400" />
            Emergency Contacts (India)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <div key={c.number} className="rounded-lg bg-slate-900/60 p-2">
                <div className="text-lg font-bold text-red-400">{c.number}</div>
                <div className="text-[10px] text-gray-400">{c.name}</div>
                <div className="text-[9px] text-gray-600">{c.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Emergency Services */}
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-blue-400" />
            Nearby Emergency Services
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">Search for emergency services near your selected location on Google Maps</p>
          <div className="grid grid-cols-2 gap-2">
            {NEARBY_EMERGENCY_SERVICES.map((svc) => {
              const Icon = SERVICE_ICON_MAP[svc.icon] ?? Plus;
              const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(svc.searchQuery)}`;
              return (
                <a
                  key={svc.id}
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-slate-900/60 p-2.5 hover:bg-slate-900/90 transition-colors group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded"
                      style={{ backgroundColor: `${svc.color}20`, border: `1px solid ${svc.color}40` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: svc.color }} />
                    </span>
                    <span className="text-xs font-semibold text-white">{svc.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-1.5">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    {svc.number ? (
                      <span className="text-xs font-bold" style={{ color: svc.color }}>{svc.number}</span>
                    ) : (
                      <span className="text-[10px] text-gray-600">No hotline</span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-blue-400 group-hover:text-blue-300">
                      <Search className="h-2.5 w-2.5" />
                      Find
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Authority Response Guidance */}
        {overallLevel !== "low" && (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-400" />
              Authority Response Guidance
            </h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div>
                <span className="font-semibold text-orange-400">Evacuation Priority:</span>{" "}
                {overallLevel === "severe" ? "Immediate — evacuate all low-lying and coastal areas" : overallLevel === "high" ? "High — prepare evacuation of vulnerable populations" : "Monitor — standby for evacuation orders"}
              </div>
              <div>
                <span className="font-semibold text-blue-400">Resource Deployment:</span>
                <ul className="mt-1 space-y-0.5 pl-3">
                  <li>- NDRF teams on standby</li>
                  <li>- Emergency supplies pre-positioned</li>
                  <li>- Communication equipment checked</li>
                  <li>- Transport vehicles ready</li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-green-400">Shelter & Hospital Readiness:</span>
                <ul className="mt-1 space-y-0.5 pl-3">
                  <li>- Shelters identified and stocked</li>
                  <li>- Hospital emergency protocols activated</li>
                  <li>- Blood bank inventory checked</li>
                  <li>- Ambulance dispatch ready</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Copy Alert */}
        <button
          onClick={copyAlert}
          className="w-full rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied to clipboard!" : "Copy Alert Message (SMS/WhatsApp)"}
        </button>
      </div>
    </div>
  );
}

function WeatherStat({ icon: Icon, label, value }: { icon: typeof Wind; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-3 w-3 text-gray-500" />
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-200">{value}</span>
    </div>
  );
}

function SafetySection({ title, items, icon: Icon, color }: { title: string; items: string[]; icon: typeof Shield; color: string }) {
  return (
    <div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${color} mb-0.5`}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-gray-400 list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-200 font-medium capitalize">{value}</span>
    </div>
  );
}
