import { Play, Pause, RotateCcw, SkipBack, SkipForward, Clock } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ScenarioId, TimelineFrame } from "@/types";
import { SCENARIO_LIST } from "@/data/scenarios";
import { SimulatedBadge } from "@/components/ui/AlertBadge";

interface SimulationControlsProps {
  scenarioId: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  currentHour: number;
  onHourChange: (hour: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  timeline: TimelineFrame[];
}

export default function SimulationControls({
  scenarioId,
  onScenarioChange,
  currentHour,
  onHourChange,
  isPlaying,
  onPlayPause,
  timeline,
}: SimulationControlsProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && timeline.length > 0) {
      intervalRef.current = setInterval(() => {
        onHourChange(Math.min(currentHour + 1, timeline.length - 1));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentHour, timeline.length, onHourChange]);

  const maxHour = timeline.length > 0 ? timeline.length - 1 : 0;
  const currentFrame = timeline[currentHour];

  return (
    <div className="rounded-xl border border-orange-500/30 bg-slate-900/80 backdrop-blur-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Simulation</span>
          <SimulatedBadge />
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex flex-wrap gap-1.5">
        {SCENARIO_LIST.map((s) => (
          <button
            key={s.id}
            onClick={() => onScenarioChange(s.id)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              scenarioId === s.id
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
            }`}
            title={s.description}
          >
            {s.name}
          </button>
        ))}
      </div>

      {scenarioId !== "live" && timeline.length > 0 && (
        <>
          {/* Time slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {currentFrame?.label ?? `T+${currentHour}h`}
              </span>
              <span className="text-gray-600">{currentHour} / {maxHour}h</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onHourChange(0)}
                className="rounded p-1 text-gray-400 hover:bg-white/5"
                title="Reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onHourChange(Math.max(0, currentHour - 1))}
                className="rounded p-1 text-gray-400 hover:bg-white/5"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onPlayPause}
                className="rounded-lg bg-orange-500/20 p-1.5 text-orange-400 hover:bg-orange-500/30"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onHourChange(Math.min(maxHour, currentHour + 1))}
                className="rounded p-1 text-gray-400 hover:bg-white/5"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min={0}
                max={maxHour}
                value={currentHour}
                onChange={(e) => onHourChange(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full bg-white/10 accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Current frame info */}
          {currentFrame && (
            <div className="rounded-lg bg-slate-800/50 p-2 grid grid-cols-3 gap-2 text-[10px]">
              {currentFrame.weather.temperature !== undefined && (
                <FrameStat label="Temp" value={`${currentFrame.weather.temperature.toFixed(0)}°C`} />
              )}
              {currentFrame.weather.windSpeed !== undefined && (
                <FrameStat label="Wind" value={`${currentFrame.weather.windSpeed.toFixed(0)} km/h`} />
              )}
              {currentFrame.weather.rain !== undefined && (
                <FrameStat label="Rain" value={`${currentFrame.weather.rain.toFixed(1)} mm`} />
              )}
              {currentFrame.weather.windGusts !== undefined && (
                <FrameStat label="Gusts" value={`${currentFrame.weather.windGusts.toFixed(0)} km/h`} />
              )}
              {currentFrame.weather.pressure !== undefined && (
                <FrameStat label="Pressure" value={`${currentFrame.weather.pressure.toFixed(0)} hPa`} />
              )}
              {currentFrame.alertLevel && (
                <FrameStat
                  label="Risk"
                  value={currentFrame.alertLevel.toUpperCase()}
                  color={currentFrame.alertLevel === "severe" ? "#ef4444" : currentFrame.alertLevel === "high" ? "#f97316" : currentFrame.alertLevel === "moderate" ? "#eab308" : "#22c55e"}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FrameStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-gray-600 uppercase">{label}</span>
      <span className="font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</span>
    </div>
  );
}
