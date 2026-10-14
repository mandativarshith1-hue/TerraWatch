import {
  Waves, ThermometerSun, Wind, CloudRain, Activity, Flame, Mountain,
  TrendingDown, Sun, Snowflake, type LucideIcon,
} from "lucide-react";
import type { HazardType } from "@/types";

const ICON_MAP: Record<string, LucideIcon> = {
  Waves, ThermometerSun, Wind, CloudRain, Activity, Flame, Mountain,
  TrendingDown, Sun, Snowflake,
};

export function getHazardIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Activity;
}
