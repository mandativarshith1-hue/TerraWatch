import { useState, useEffect, useCallback, useRef } from "react";
import { Globe2, Bell, LayoutDashboard, Info, Sun, Moon, Radio, Loader2 } from "lucide-react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { LocationProvider, useLocation } from "@/context/LocationContext";
import GlobeScene from "@/components/globe/GlobeScene";
import LocationDetailPanel from "@/components/panels/LocationDetailPanel";
import AlertCenter from "@/components/panels/AlertCenter";
import Dashboard from "@/components/panels/Dashboard";
import ImpactPage from "@/components/panels/ImpactPage";
import SimulationControls from "@/components/panels/SimulationControls";
import CitySearch from "@/components/ui/CitySearch";
import LayerToggles from "@/components/ui/LayerToggles";
import { CITIES, HAZARD_META, RISK_LEVEL_META } from "@/data/cities";
import { SCENARIOS } from "@/data/scenarios";
import {
  fetchWeather, fetchAllDisasterEvents, fetchHistorical, fetchFloodData,
  deriveWeatherAlerts, searchCity, type GeoResult,
} from "@/lib/api";
import { assessAllRisks, type FullRiskAssessment } from "@/lib/riskEngine";
import type {
  WeatherData, DisasterEvent, UnifiedAlert, RiskLevel, ScenarioId, HazardType, HistoricalData,
} from "@/types";

type View = "globe" | "alerts" | "dashboard" | "impact";

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444",
};

const DEFAULT_LAYERS: Record<string, boolean> = {
  flood: true, heatwave: true, cyclone: true, extremeRainfall: true,
  earthquake: true, wildfire: true, volcano: true, landslide: true,
  drought: true, coldWave: true, officialAlerts: true,
};

function AppContent() {
  const { mode, toggle } = useTheme();
  const { selectedLocation, setSelectedLocation, flyTo, setFlyTo, watchlist, toggleWatchlist, isWatched } = useLocation();

  const [view, setView] = useState<View>("globe");
  const [scenarioId, setScenarioId] = useState<ScenarioId>("live");
  const [simHour, setSimHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [risks, setRisks] = useState<FullRiskAssessment | null>(null);
  const [locationAlerts, setLocationAlerts] = useState<UnifiedAlert[]>([]);

  const [disasterEvents, setDisasterEvents] = useState<DisasterEvent[]>([]);
  const [globalAlerts, setGlobalAlerts] = useState<UnifiedAlert[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [feedsError, setFeedsError] = useState<string | null>(null);

  const [cityRiskLevels, setCityRiskLevels] = useState<{ id: string; name: string; lat: number; lon: number; level: RiskLevel; score: number }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [customPin, setCustomPin] = useState<{ lat: number; lon: number } | null>(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [showGlobePanel, setShowGlobePanel] = useState(true);
  const [historical, setHistorical] = useState<HistoricalData | null>(null);
  const [riverDischarge, setRiverDischarge] = useState<number | null>(null);
  const [lastFeedUpdate, setLastFeedUpdate] = useState<number>(0);

  const fetchWeatherForLocation = useCallback(async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const w = await fetchWeather(lat, lon);
      setWeather(w);
      const hist = await fetchHistorical(lat, lon);
      setHistorical(hist);
      const flood = await fetchFloodData(lat, lon);
      setRiverDischarge(flood);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const loadFeeds = useCallback(async () => {
    setFeedsLoading(true);
    setFeedsError(null);
    try {
      const { earthquakes, eonetEvents, nwsAlerts } = await fetchAllDisasterEvents();
      const allEvents = [...earthquakes, ...eonetEvents];
      setDisasterEvents(allEvents);
      setGlobalAlerts(nwsAlerts);
      setLastFeedUpdate(Date.now());
    } catch (err) {
      setFeedsError(err instanceof Error ? err.message : "Failed to load feeds");
    } finally {
      setFeedsLoading(false);
    }
  }, []);

  // Initial feed load
  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  // Auto-refresh feeds every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadFeeds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFeeds]);

  // Compute risk assessments when weather or events change
  useEffect(() => {
    if (!weather || !selectedLocation) return;
    const assessments = assessAllRisks(weather, selectedLocation.lat, selectedLocation.lon, disasterEvents, historical, riverDischarge);
    setRisks(assessments);
    const derived = deriveWeatherAlerts(weather, selectedLocation.lat, selectedLocation.lon, selectedLocation.name);
    setLocationAlerts(derived);
  }, [weather, selectedLocation, disasterEvents, historical, riverDischarge]);

  // Fetch weather when location changes
  useEffect(() => {
    if (!selectedLocation) return;
    if (scenarioId === "live") {
      fetchWeatherForLocation(selectedLocation.lat, selectedLocation.lon);
    }
  }, [selectedLocation, scenarioId, fetchWeatherForLocation]);

  // Precompute city risk levels in background
  useEffect(() => {
    if (scenarioId !== "live") {
      const scenario = SCENARIOS[scenarioId];
      const levels = CITIES.map((city) => {
        const event = scenario.events.find((e) =>
          Math.abs(e.lat - city.lat) < 5 && Math.abs(e.lon - city.lon) < 5
        );
        if (event) {
          const level = event.alertLevel ?? "severe";
          return { id: city.id, name: city.name, lat: city.lat, lon: city.lon, level, score: level === "severe" ? 85 : 55 };
        }
        return { id: city.id, name: city.name, lat: city.lat, lon: city.lon, level: "low" as RiskLevel, score: 10 };
      });
      setCityRiskLevels(levels);
      return;
    }

    let cancelled = false;
    const computeCityRisks = async () => {
      const results: { id: string; name: string; lat: number; lon: number; level: RiskLevel; score: number }[] = [];
      for (const city of CITIES.slice(0, 8)) {
        if (cancelled) return;
        try {
          const w = await fetchWeather(city.lat, city.lon);
          const r = assessAllRisks(w, city.lat, city.lon, disasterEvents, null, null);
          results.push({ id: city.id, name: city.name, lat: city.lat, lon: city.lon, level: r.overall.level, score: r.overall.score });
        } catch {
          results.push({ id: city.id, name: city.name, lat: city.lat, lon: city.lon, level: "low", score: 10 });
        }
      }
      for (const city of CITIES.slice(8)) {
        results.push({ id: city.id, name: city.name, lat: city.lat, lon: city.lon, level: "low", score: 10 });
      }
      if (!cancelled) setCityRiskLevels(results);
    };
    computeCityRisks();
    return () => { cancelled = true; };
  }, [scenarioId, disasterEvents]);

  // Handle simulation scenario
  const currentScenario = SCENARIOS[scenarioId];
  const isSimulated = scenarioId !== "live";

  useEffect(() => {
    if (scenarioId === "live") return;
    const scenario = SCENARIOS[scenarioId];
    setFlyTo({ lat: scenario.centerLat, lon: scenario.centerLon });
    setSelectedLocation({
      id: `sim-${scenarioId}`,
      name: scenario.events[0]?.location ?? scenario.name,
      country: "India",
      lat: scenario.centerLat,
      lon: scenario.centerLon,
    });
    setWeather(scenario.weather);
    setRisks(assessAllRisks(scenario.weather, scenario.centerLat, scenario.centerLon, scenario.events, null, null));
    setLocationAlerts([]);
    setSelectedEvent(scenario.events[0] ?? null);
    setSimHour(0);
    setIsPlaying(false);
  }, [scenarioId, setFlyTo, setSelectedLocation]);

  // Apply simulation timeline frame
  useEffect(() => {
    if (scenarioId === "live" || !currentScenario.timelineData.length) return;
    const frame = currentScenario.timelineData[simHour];
    if (!frame) return;
    if (weather) {
      setWeather({
        ...weather,
        current: { ...weather.current, ...frame.weather } as typeof weather.current,
      });
    }
  }, [simHour, scenarioId, currentScenario, weather]);

  // Handle globe click
  const handleGlobeClick = useCallback((lat: number, lon: number) => {
    setCustomPin({ lat, lon });
    const name = `Custom (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    setSelectedLocation({ id: `custom-${lat}-${lon}`, name, country: "", lat, lon, isCustom: true });
    setSelectedEvent(null);
  }, [setSelectedLocation]);

  // Handle city search result
  const handleSearchResult = useCallback((result: GeoResult) => {
    setCustomPin({ lat: result.lat, lon: result.lon });
    setFlyTo({ lat: result.lat, lon: result.lon });
    setSelectedLocation({ id: `search-${result.lat}-${result.lon}`, name: result.name, country: result.country, lat: result.lat, lon: result.lon });
    setSelectedEvent(null);
  }, [setFlyTo, setSelectedLocation]);

  // Handle marker click
  const handleMarkerClick = useCallback((event: DisasterEvent) => {
    setFlyTo({ lat: event.lat, lon: event.lon });
    setSelectedLocation({ id: `event-${event.id}`, name: event.location, country: "", lat: event.lat, lon: event.lon });
    setSelectedEvent(event);
  }, [setFlyTo, setSelectedLocation]);

  // Handle city marker click
  const handleCityClick = useCallback((city: { id: string; name: string; lat: number; lon: number; country: string }) => {
    setFlyTo({ lat: city.lat, lon: city.lon });
    setSelectedLocation(city);
    setSelectedEvent(null);
  }, [setFlyTo, setSelectedLocation]);

  // Handle alert click
  const handleAlertClick = useCallback((alert: UnifiedAlert) => {
    setView("globe");
    setFlyTo({ lat: alert.lat, lon: alert.lon });
    setSelectedLocation({ id: `alert-${alert.id}`, name: alert.location, country: "", lat: alert.lat, lon: alert.lon });
    setSelectedEvent(null);
  }, [setFlyTo, setSelectedLocation]);

  // Near me
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setNearMeActive(true);
        setFlyTo({ lat: latitude, lon: longitude });
        setCustomPin({ lat: latitude, lon: longitude });
        setSelectedLocation({ id: "near-me", name: "My Location", country: "", lat: latitude, lon: longitude, isCustom: true });
        setSelectedEvent(null);
      },
      () => {
        alert("Location permission denied. Please enable geolocation to use this feature.");
      }
    );
  }, [setFlyTo, setSelectedLocation]);

  // Combine all alerts
  const allAlerts: UnifiedAlert[] = [...globalAlerts, ...locationAlerts];

  // Filter events and city markers by enabled layers
  const visibleEvents = disasterEvents.filter((e) => {
    const layerKey = e.type === "tsunami" ? "earthquake" : e.type;
    return layers[layerKey] ?? true;
  });

  const visibleCityMarkers = CITIES.map((city) => {
    const risk = cityRiskLevels.find((c) => c.id === city.id);
    return {
      ...city,
      level: risk?.level ?? "low" as RiskLevel,
    };
  });

  // Simulation timeline
  const simTimeline = currentScenario.timelineData;
  const simWeather = isSimulated ? currentScenario.weather : weather;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-4 py-2.5 z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Globe2 className="h-6 w-6 text-blue-400" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">TerraWatch</h1>
              <p className="text-[9px] text-gray-500 leading-none mt-0.5">Climate Risk & Disaster Response</p>
            </div>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            isSimulated ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
          }`}>
            {isSimulated ? "Simulated" : "Live"}
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NavButton active={view === "globe"} onClick={() => setView("globe")} icon={Globe2} label="Globe" />
          <NavButton active={view === "alerts"} onClick={() => setView("alerts")} icon={Bell} label="Alerts" badge={allAlerts.length} />
          <NavButton active={view === "dashboard"} onClick={() => setView("dashboard")} icon={LayoutDashboard} label="Dashboard" />
          <NavButton active={view === "impact"} onClick={() => setView("impact")} icon={Info} label="Impact" />
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-[10px] text-gray-500">
            {feedsLoading ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading feeds...</span>
            ) : feedsError ? (
              <button onClick={loadFeeds} className="text-red-400 hover:underline">Retry feeds</button>
            ) : (
              <span>Updated {lastFeedUpdate ? new Date(lastFeedUpdate).toLocaleTimeString() : "—"}</span>
            )}
          </div>
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Globe View */}
        {view === "globe" && (
          <>
            {/* Left Sidebar */}
            <aside className="hidden md:flex w-64 flex-col gap-3 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl p-3 overflow-y-auto flex-shrink-0">
              <CitySearch onResult={handleSearchResult} />
              <SimulationControls
                scenarioId={scenarioId}
                onScenarioChange={setScenarioId}
                currentHour={simHour}
                onHourChange={setSimHour}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                timeline={simTimeline}
              />
              <LayerToggles layers={layers} onToggle={(id) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }))} />
              <div className="text-[10px] text-gray-600 pt-2 border-t border-white/5">
                <p className="flex items-center gap-1 mb-1"><Radio className="h-3 w-3" /> Data Sources</p>
                <p>Open-Meteo, USGS, NASA EONET, NWS</p>
                <p className="mt-1">Auto-refresh: every 5 min</p>
              </div>
            </aside>

            {/* Globe Canvas */}
            <div className="flex-1 relative min-w-0">
              <GlobeScene
                events={visibleEvents}
                cityMarkers={visibleCityMarkers}
                customPin={customPin}
                onGlobeClick={handleGlobeClick}
                onMarkerClick={handleMarkerClick}
                onCityClick={handleCityClick}
                flyTo={flyTo}
                isLight={mode === "light"}
              />

              {/* Mobile overlay panel toggle */}
              <button
                onClick={() => setShowGlobePanel(!showGlobePanel)}
                className="md:hidden absolute top-3 right-3 rounded-lg bg-slate-900/80 p-2 text-white backdrop-blur-xl border border-white/10 z-10"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>

              {/* Feeds status overlay */}
              {feedsError && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-red-500/20 backdrop-blur-xl border border-red-500/30 px-4 py-2 text-xs text-red-400 z-10">
                  Some feeds failed to load. <button onClick={loadFeeds} className="underline font-semibold">Retry</button>
                </div>
              )}

              {/* Mobile bottom sheet */}
              {showGlobePanel && (
                <div className="md:hidden absolute bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl bg-slate-900/95 backdrop-blur-xl border-t border-white/10 overflow-y-auto z-10 animate-fade-in">
                  <div className="p-3 space-y-3">
                    <CitySearch onResult={handleSearchResult} />
                    <SimulationControls
                      scenarioId={scenarioId}
                      onScenarioChange={setScenarioId}
                      currentHour={simHour}
                      onHourChange={setSimHour}
                      isPlaying={isPlaying}
                      onPlayPause={() => setIsPlaying(!isPlaying)}
                      timeline={simTimeline}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Detail Panel */}
            {selectedLocation && (
              <aside className="hidden md:flex w-96 border-l border-white/10 bg-slate-900/60 backdrop-blur-xl flex-shrink-0 animate-fade-in">
                <LocationDetailPanel
                  locationName={selectedLocation.name}
                  lat={selectedLocation.lat}
                  lon={selectedLocation.lon}
                  weather={simWeather}
                  weatherLoading={weatherLoading && !isSimulated}
                  weatherError={weatherError}
                  risks={risks}
                  alerts={locationAlerts}
                  selectedEvent={selectedEvent}
                  onRetry={() => fetchWeatherForLocation(selectedLocation.lat, selectedLocation.lon)}
                  isWatched={isWatched(selectedLocation.id)}
                  onToggleWatch={() => toggleWatchlist(selectedLocation)}
                  onClose={() => { setSelectedLocation(null); setSelectedEvent(null); }}
                  isSimulated={isSimulated}
                />
              </aside>
            )}

            {/* Mobile detail panel */}
            {selectedLocation && (
              <div className="md:hidden absolute inset-0 bg-slate-900/95 backdrop-blur-xl z-20 animate-fade-in overflow-y-auto">
                <LocationDetailPanel
                  locationName={selectedLocation.name}
                  lat={selectedLocation.lat}
                  lon={selectedLocation.lon}
                  weather={simWeather}
                  weatherLoading={weatherLoading && !isSimulated}
                  weatherError={weatherError}
                  risks={risks}
                  alerts={locationAlerts}
                  selectedEvent={selectedEvent}
                  onRetry={() => fetchWeatherForLocation(selectedLocation.lat, selectedLocation.lon)}
                  isWatched={isWatched(selectedLocation.id)}
                  onToggleWatch={() => toggleWatchlist(selectedLocation)}
                  onClose={() => { setSelectedLocation(null); setSelectedEvent(null); }}
                  isSimulated={isSimulated}
                />
              </div>
            )}
          </>
        )}

        {/* Alert Center View */}
        {view === "alerts" && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full bg-slate-900/60 backdrop-blur-xl">
              <AlertCenter
                alerts={allAlerts}
                onAlertClick={handleAlertClick}
                onNearMe={handleNearMe}
                nearMeActive={nearMeActive}
                watchlist={watchlist}
              />
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {view === "dashboard" && (
          <div className="flex-1 overflow-hidden">
            <Dashboard
              alerts={allAlerts}
              events={disasterEvents}
              cityRiskLevels={cityRiskLevels}
              onCityClick={(city) => {
                handleCityClick({ ...city, country: "" });
                setView("globe");
              }}
            />
          </div>
        )}

        {/* Impact Page View */}
        {view === "impact" && (
          <div className="flex-1 overflow-hidden">
            <ImpactPage />
          </div>
        )}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label, badge }: {
  active: boolean;
  onClick: () => void;
  icon: typeof Globe2;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold text-white flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </ThemeProvider>
  );
}
