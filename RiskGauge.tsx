import type { RiskLevel } from "@/types";
import { RISK_LEVEL_META } from "@/data/cities";

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
  label?: string;
}

export default function RiskGauge({ score, level, size = 120, label }: RiskGaugeProps) {
  const meta = RISK_LEVEL_META[level];
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={meta.color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: meta.color }}>{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      {label && <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>}
    </div>
  );
}
