import type { AlertSeverity, RiskLevel, AlertSource } from "@/types";
import { SEVERITY_META, RISK_LEVEL_META } from "@/data/cities";

interface AlertBadgeProps {
  severity?: AlertSeverity;
  level?: RiskLevel;
  source?: AlertSource;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, size = "sm" }: { severity: AlertSeverity; size?: "sm" | "md" }) {
  const meta = SEVERITY_META[severity];
  const sizes = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${sizes}`}
      style={{ backgroundColor: `${meta.color}25`, color: meta.color, border: `1px solid ${meta.color}50` }}
    >
      {meta.label}
    </span>
  );
}

export function RiskBadge({ level, size = "sm" }: { level: RiskLevel; size?: "sm" | "md" }) {
  const meta = RISK_LEVEL_META[level];
  const sizes = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${sizes}`}
      style={{ backgroundColor: `${meta.color}25`, color: meta.color, border: `1px solid ${meta.color}50` }}
    >
      {meta.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: AlertSource }) {
  const labels: Record<AlertSource, string> = {
    "open-meteo": "Open-Meteo",
    usgs: "USGS",
    eonet: "NASA EONET",
    nws: "NWS",
    gdacs: "GDACS",
    derived: "Derived",
    simulation: "Simulated",
  };
  const colors: Record<AlertSource, string> = {
    "open-meteo": "#3b82f6",
    usgs: "#f59e0b",
    eonet: "#10b981",
    nws: "#8b5cf6",
    gdacs: "#06b6d4",
    derived: "#ec4899",
    simulation: "#f97316",
  };
  const c = colors[source];
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide"
      style={{ backgroundColor: `${c}20`, color: c }}
    >
      {labels[source]}
    </span>
  );
}

export function SimulatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-400 border border-orange-500/40">
      SIMULATED
    </span>
  );
}

export default function AlertBadge({ severity, level, source }: AlertBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {severity && <SeverityBadge severity={severity} />}
      {level && <RiskBadge level={level} />}
      {source && <SourceBadge source={source} />}
    </div>
  );
}
