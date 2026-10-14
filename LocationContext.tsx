import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { LatLon, CityLocation } from "@/types";

interface LocationContextValue {
  selectedLocation: (CityLocation & { isCustom?: boolean }) | null;
  setSelectedLocation: (loc: (CityLocation & { isCustom?: boolean }) | null) => void;
  flyTo: LatLon | null;
  setFlyTo: (latlon: LatLon | null) => void;
  watchlist: CityLocation[];
  toggleWatchlist: (city: CityLocation) => void;
  isWatched: (id: string) => boolean;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<(CityLocation & { isCustom?: boolean }) | null>(null);
  const [flyTo, setFlyTo] = useState<LatLon | null>(null);
  const [watchlist, setWatchlist] = useState<CityLocation[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("terrwatch-watchlist") ?? "[]");
    } catch {
      return [];
    }
  });

  const toggleWatchlist = useCallback((city: CityLocation) => {
    setWatchlist((prev) => {
      const exists = prev.some((c) => c.id === city.id);
      const next = exists ? prev.filter((c) => c.id !== city.id) : [...prev, city];
      localStorage.setItem("terrwatch-watchlist", JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatched = useCallback((id: string) => watchlist.some((c) => c.id === id), [watchlist]);

  return (
    <LocationContext.Provider
      value={{ selectedLocation, setSelectedLocation, flyTo, setFlyTo, watchlist, toggleWatchlist, isWatched }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
