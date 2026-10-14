import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { searchCity, type GeoResult } from "@/lib/api";

interface CitySearchProps {
  onResult: (result: GeoResult) => void;
}

export default function CitySearch({ onResult }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchCity(query);
      setResults(res);
      setLoading(false);
      setOpen(true);
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSelect = (r: GeoResult) => {
    onResult(r);
    setQuery(`${r.name}, ${r.country}`);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search city..."
          className="w-full rounded-lg border border-white/10 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.name}-${i}`}
              onClick={() => handleSelect(r)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span className="font-medium">{r.name}</span>
              <span className="text-gray-500">{r.country}{r.admin1 ? `, ${r.admin1}` : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
