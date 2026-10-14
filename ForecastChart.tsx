import { useMemo } from "react";
import type { WeatherData } from "@/types";

interface ForecastChartProps {
  weather: WeatherData;
  type: "temperature" | "rain" | "wind";
}

export default function ForecastChart({ weather, type }: ForecastChartProps) {
  const data = useMemo(() => {
    if (type === "temperature") {
      return {
        values: weather.daily.temperatureMax.slice(0, 7),
        mins: weather.daily.temperatureMin.slice(0, 7),
        label: "Temperature (°C)",
        color: "#f59e0b",
        minColor: "#3b82f6",
      };
    }
    if (type === "rain") {
      return {
        values: weather.daily.precipitationSum.slice(0, 7),
        mins: undefined,
        label: "Rain (mm)",
        color: "#06b6d4",
        minColor: undefined,
      };
    }
    return {
      values: weather.daily.windGustsMax.slice(0, 7),
      mins: undefined,
      label: "Wind Gusts (km/h)",
      color: "#10b981",
      minColor: undefined,
    };
  }, [weather, type]);

  const max = Math.max(...data.values, ...(data.mins ?? [0]), 1) * 1.2;
  const width = 320;
  const height = 120;
  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding;
  const barW = chartW / 7 - 6;

  return (
    <div className="w-full">
      <div className="mb-2 text-xs font-medium text-gray-400">{data.label} — 7-day forecast</div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding}
            x2={width - padding}
            y1={padding + chartH * (1 - t)}
            y2={padding + chartH * (1 - t)}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-white/10"
          />
        ))}
        {data.values.map((v, i) => {
          const h = (v / max) * chartH;
          const x = padding + i * (barW + 6);
          const y = padding + chartH - h;
          const date = new Date(weather.daily.time?.[i] ?? weather.daily.time?.[0] ?? new Date().toISOString());
          const dayLabel = date.toLocaleDateString("en", { weekday: "short" });
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill={data.color} rx={3} opacity={0.8} />
              {data.mins && (
                <rect
                  x={x}
                  y={padding + chartH - (data.mins[i] / max) * chartH}
                  width={barW}
                  height={(data.mins[i] / max) * chartH}
                  fill={data.minColor}
                  rx={3}
                  opacity={0.5}
                />
              )}
              <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize="8" fill="currentColor" className="text-gray-500">
                {dayLabel}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fill={data.color} fontWeight="bold">
                {v.toFixed(type === "rain" ? 0 : 0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
