import { Waves, ThermometerSun, Wind, CloudRain, Activity, Flame, Mountain, TrendingDown, Sun, Snowflake, AlertCircle, type LucideIcon } from "lucide-react";

export interface LayerToggle {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  enabled: boolean;
}

export const LAYER_DEFINITIONS: Omit<LayerToggle, "enabled">[] = [
  { id: "flood", label: "Flood Risk", icon: Waves, color: "#06b6d4" },
  { id: "heatwave", label: "Heatwave", icon: ThermometerSun, color: "#f59e0b" },
  { id: "cyclone", label: "Cyclone/Wind", icon: Wind, color: "#8b5cf6" },
  { id: "extremeRainfall", label: "Extreme Rainfall", icon: CloudRain, color: "#3b82f6" },
  { id: "earthquake", label: "Earthquakes", icon: Activity, color: "#ef4444" },
  { id: "wildfire", label: "Wildfires", icon: Flame, color: "#f97316" },
  { id: "volcano", label: "Volcanoes", icon: Mountain, color: "#dc2626" },
  { id: "landslide", label: "Landslides", icon: TrendingDown, color: "#a78bfa" },
  { id: "drought", label: "Drought", icon: Sun, color: "#eab308" },
  { id: "coldWave", label: "Cold Wave", icon: Snowflake, color: "#60a5fa" },
  { id: "officialAlerts", label: "Official Alerts", icon: AlertCircle, color: "#10b981" },
];

interface LayerTogglesProps {
  layers: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export default function LayerToggles({ layers, onToggle }: LayerTogglesProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Layers</div>
      {LAYER_DEFINITIONS.map((layer) => {
        const enabled = layers[layer.id] ?? true;
    const Icon = layer.icon;
        return (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              enabled ? "bg-white/5 text-gray-200" : "text-gray-600 hover:bg-white/5"
            }`}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ backgroundColor: enabled ? `${layer.color}25` : "transparent", border: `1px solid ${enabled ? layer.color : "#333"}` }}
            >
              <Icon className="h-3 w-3" style={{ color: enabled ? layer.color : "#666" }} />
            </span>
            <span className="flex-1 text-left">{layer.label}</span>
            <span
              className="h-4 w-7 rounded-full transition-colors relative"
              style={{ backgroundColor: enabled ? layer.color : "#333" }}
            >
              <span
                className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
                style={{ left: enabled ? "14px" : "2px" }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
