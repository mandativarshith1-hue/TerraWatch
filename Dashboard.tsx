import { useState, useEffect } from "react";
import { CheckSquare, Square, TrendingUp, AlertTriangle, Activity, Globe2 } from "lucide-react";
import type { UnifiedAlert, DisasterEvent, RiskLevel, PreparednessItem } from "@/types";
import { RISK_LEVEL_META } from "@/data/cities";
import { SeverityBadge, SourceBadge } from "@/components/ui/AlertBadge";

interface DashboardProps {
  alerts: UnifiedAlert[];
  events: DisasterEvent[];
  cityRiskLevels: { id: string; name: string; lat: number; lon: number; level: RiskLevel; score: number }[];
  onCityClick: (city: { id: string; name: string; lat: number; lon: number }) => void;
}

const PREPAREDNESS_ITEMS: Omit<PreparednessItem, "done">[] = [
  { id: "kit", label: "Emergency kit ready (water, food, first aid, documents)" },
  { id: "contacts", label: "Emergency contact numbers saved (112, 1078, 108)" },
  { id: "evac", label: "Know evacuation routes and shelter locations" },
  { id: "battery", label: "Phone charged and power bank ready" },
  { id: "radio", label: "Battery radio for emergency broadcasts" },
  { id: "meds", label: "Essential medications stocked for 7 days" },
  { id: "family", label: "Family communication plan established" },
  { id: "docs", label: "Important documents in waterproof container" },
];

export default function Dashboard({ alerts, events, cityRiskLevels, onCityClick }: DashboardProps) {
  const [items, setItems] = useState<PreparednessItem[]>(() => {
    try {
      const saved = localStorage.getItem("terrwatch-preparedness");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return PREPAREDNESS_ITEMS.map((i) => ({ ...i, done: false }));
  });

  useEffect(() => {
    localStorage.setItem("terrwatch-preparedness", JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const counts = {
    severe: cityRiskLevels.filter((c) => c.level === "severe").length,
    high: cityRiskLevels.filter((c) => c.level === "high").length,
    moderate: cityRiskLevels.filter((c) => c.level === "moderate").length,
    low: cityRiskLevels.filter((c) => c.level === "low").length,
  };

  const ranked = [...cityRiskLevels].sort((a, b) => b.score - a.score).slice(0, 10);
  const completedCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-4 p-4 overflow-y-auto h-full">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Severe Risk" value={counts.severe} color={RISK_LEVEL_META.severe.color} />
        <StatCard icon={Activity} label="High Risk" value={counts.high} color={RISK_LEVEL_META.high.color} />
        <StatCard icon={Globe2} label="Moderate Risk" value={counts.moderate} color={RISK_LEVEL_META.moderate.color} />
        <StatCard icon={TrendingUp} label="Active Alerts" value={alerts.length} color="#3b82f6" />
      </div>

      {/* Ranked cities */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <h3 className="text-sm font-semibold text-white mb-3">Highest Risk Locations</h3>
        <div className="space-y-1">
          {ranked.map((city, i) => {
            const meta = RISK_LEVEL_META[city.level];
            return (
              <button
                key={city.id}
                onClick={() => onCityClick(city)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-xs font-bold text-gray-600 w-4">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-white truncate">{city.name}</span>
                <span className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                  <span className="block h-full rounded-full" style={{ width: `${city.score}%`, backgroundColor: meta.color }} />
                </span>
                <span className="text-xs font-bold w-8 text-right" style={{ color: meta.color }}>{city.score}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live alert feed */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <h3 className="text-sm font-semibold text-white mb-3">Live Alert Feed</h3>
        {alerts.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">No active alerts</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(0, 15).map((alert) => (
              <div key={alert.id} className="rounded-lg bg-slate-800/50 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-white flex-1 truncate">{alert.title}</span>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <SourceBadge source={alert.source} />
                  <span className="text-[10px] text-gray-600">{new Date(alert.time).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-gray-600 truncate">{alert.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preparedness Checklist */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Preparedness Checklist</h3>
          <span className="text-xs text-gray-500">{completedCount}/{items.length} done</span>
        </div>
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
            >
              {item.done ? (
                <CheckSquare className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
              )}
              <span className={`text-xs ${item.done ? "text-gray-500 line-through" : "text-gray-300"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof AlertTriangle; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
      <Icon className="h-5 w-5 mb-1" style={{ color }} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
