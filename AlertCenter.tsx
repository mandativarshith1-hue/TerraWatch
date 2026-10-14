import { useState, useMemo } from "react";
import { Filter, Navigation, Clock, ExternalLink, X, ChevronDown } from "lucide-react";
import type { UnifiedAlert, HazardType, AlertSeverity } from "@/types";
import { SeverityBadge, SourceBadge, RiskBadge } from "@/components/ui/AlertBadge";
import { LAYER_DEFINITIONS } from "@/components/ui/LayerToggles";

interface AlertCenterProps {
  alerts: UnifiedAlert[];
  onAlertClick: (alert: UnifiedAlert) => void;
  onNearMe: () => void;
  nearMeActive: boolean;
  watchlist: { id: string; name: string; lat: number; lon: number }[];
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  emergency: 0, warning: 1, watch: 2, advisory: 3,
};

export default function AlertCenter({ alerts, onAlertClick, onNearMe, nearMeActive, watchlist }: AlertCenterProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [showWatchlist, setShowWatchlist] = useState(false);

  const sources = useMemo(() => {
    const set = new Set(alerts.map((a) => a.source));
    return Array.from(set);
  }, [alerts]);

  const filtered = useMemo(() => {
    return alerts
      .filter((a) => {
        if (typeFilter !== "all" && a.type !== typeFilter && !(typeFilter === "official" && a.type === "official")) return false;
        if (severityFilter !== "all" && a.severity !== severityFilter) return false;
        if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
        if (regionFilter !== "all") {
          const lower = a.location.toLowerCase();
          if (regionFilter === "india" && !lower.includes("india") && !lower.match(/chennai|mumbai|delhi|kolkata|assam|guwahati|bhubaneswar|bangalore|hyderabad|dhaka/)) return false;
          if (regionFilter === "us" && !lower.includes("united states") && !lower.match(/county|state|texas|california|florida|new york/i)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });
  }, [alerts, typeFilter, severityFilter, sourceFilter, regionFilter]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-400" />
            Alert Center
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onNearMe}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                nearMeActive ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              Near Me
            </button>
            <button
              onClick={() => setShowWatchlist(!showWatchlist)}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white"
            >
              Watchlist ({watchlist.length})
            </button>
          </div>
        </div>

        {showWatchlist && watchlist.length > 0 && (
          <div className="mt-2 space-y-1 rounded-lg bg-slate-800/50 p-2">
            {watchlist.map((w) => (
              <button
                key={w.id}
                onClick={() => onAlertClick({ id: w.id, type: "official", title: w.name, description: "", severity: "advisory", riskLevel: "low", source: "open-meteo", sourceLabel: "Watchlist", time: new Date().toISOString(), lat: w.lat, lon: w.lon, location: w.name } as UnifiedAlert)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
              >
                <Navigation className="h-3 w-3 text-yellow-400" />
                {w.name}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          {showFilters ? "Hide" : "Show"} Filters
        </button>

        {showFilters && (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={[
              { value: "all", label: "All Types" },
              ...LAYER_DEFINITIONS.filter(l => l.id !== "officialAlerts").map(l => ({ value: l.id, label: l.label })),
              { value: "official", label: "Official" },
            ]} />
            <FilterSelect label="Severity" value={severityFilter} onChange={setSeverityFilter} options={[
              { value: "all", label: "All Severity" },
              { value: "emergency", label: "Emergency" },
              { value: "warning", label: "Warning" },
              { value: "watch", label: "Watch" },
              { value: "advisory", label: "Advisory" },
            ]} />
            <FilterSelect label="Source" value={sourceFilter} onChange={setSourceFilter} options={[
              { value: "all", label: "All Sources" },
              ...sources.map(s => ({ value: s, label: s })),
            ]} />
            <FilterSelect label="Region" value={regionFilter} onChange={setRegionFilter} options={[
              { value: "all", label: "All Regions" },
              { value: "india", label: "India" },
              { value: "us", label: "United States" },
            ]} />
          </div>
        )}
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs text-gray-500 border-b border-white/5">
          {filtered.length} alert{filtered.length !== 1 ? "s" : ""} {filtered.length !== alerts.length && `(of ${alerts.length})`}
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <Filter className="h-8 w-8 mb-2" />
            <p className="text-sm">No alerts match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((alert) => (
              <button
                key={alert.id}
                onClick={() => onAlertClick(alert)}
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <SeverityBadge severity={alert.severity} />
                      <SourceBadge source={alert.source} />
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{alert.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(alert.time).toLocaleString()}
                      </span>
                      <span>{alert.location}</span>
                    </div>
                  </div>
                  {alert.sourceUrl && <ExternalLink className="h-3 w-3 text-gray-600 flex-shrink-0 mt-1" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-0.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
