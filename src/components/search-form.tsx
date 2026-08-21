import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  Clock,
  Compass,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Plane,
  Sparkles,
  Train,
  Trees,
  X,
} from "lucide-react";
import { autocompletePlaces, type PlaceSuggestion } from "@/lib/travel.functions";

function useDebounced<T>(value: T, delay = 150) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function getCurrentHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getLocationIcon(type?: string) {
  if (type === "airport") return <Plane className="h-4 w-4 text-sky-500 shrink-0" />;
  if (type === "station") return <Train className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (type === "village" || type === "hamlet")
    return <Trees className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  if (type === "town")
    return <Home className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
  if (type === "city") return <Building2 className="h-4 w-4 text-teal shrink-0" />;
  if (type === "locality") return <Compass className="h-4 w-4 text-indigo-500 shrink-0" />;
  return <MapPin className="h-4 w-4 text-teal shrink-0" />;
}

function getLocationBadge(type?: string) {
  if (type === "village")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Village
      </span>
    );
  if (type === "hamlet")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Hamlet
      </span>
    );
  if (type === "town")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        Town
      </span>
    );
  if (type === "city")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal/10 text-teal border border-teal/20">
        City
      </span>
    );
  if (type === "airport")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
        Airport
      </span>
    );
  if (type === "station")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Station
      </span>
    );
  return null;
}

function PlaceInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(value, 150);
  const activeReq = useRef(0);
  const inputId = useId();

  // Fetch suggestions on debounced text change
  useEffect(() => {
    const reqId = ++activeReq.current;
    setLoading(true);
    autocompletePlaces({ data: { query: debounced.trim() } })
      .then((res) => {
        if (reqId !== activeReq.current) return;
        setSuggestions(res.suggestions || []);
        setSelectedIndex(-1);
      })
      .catch(() => {
        if (reqId === activeReq.current) setSuggestions([]);
      })
      .finally(() => {
        if (reqId === activeReq.current) setLoading(false);
      });
  }, [debounced]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleSelect = (item: PlaceSuggestion) => {
    const textToSet = item.secondary ? `${item.text}, ${item.secondary}` : item.text;
    onChange(textToSet);
    setOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        return;
      }
    }

    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <label
        htmlFor={inputId}
        className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1"
      >
        {label}
      </label>

      <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-soft focus-within:ring-2 focus-within:ring-ring transition">
        <span className="text-teal">{icon}</span>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-secondary transition"
            title="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lift">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
            {value.trim().length === 0 ? "Popular Destinations & Hubs" : "Matching Locations"}
          </div>

          <ul className="py-1">
            {suggestions.map((s, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition ${
                      isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/70"
                    }`}
                  >
                    <div className="mt-0.5">{getLocationIcon(s.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {s.text}
                        </span>
                        {getLocationBadge(s.type)}
                      </div>
                      {s.secondary && (
                        <div className="truncate text-xs text-muted-foreground">{s.secondary}</div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SearchForm({
  initialFrom = "",
  initialTo = "",
  initialTime = "",
}: {
  initialFrom?: string;
  initialTo?: string;
  initialTime?: string;
}) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [isDepartNow, setIsDepartNow] = useState(!initialTime);
  const [customTime, setCustomTime] = useState(initialTime || getCurrentHHMM());
  const navigate = useNavigate();

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    const timeToSend = isDepartNow ? getCurrentHHMM() : customTime;
    navigate({
      to: "/plan",
      search: {
        from: from.trim(),
        to: to.trim(),
        departureTime: timeToSend,
        departNow: isDepartNow,
      },
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card/90 backdrop-blur p-3 sm:p-5 shadow-lift transition"
    >
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <PlaceInput
          label="From (Origin)"
          icon={<Navigation className="h-4 w-4" />}
          value={from}
          onChange={setFrom}
          placeholder="City, station, airport…"
        />

        <div className="flex justify-center md:pb-2">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-teal hover:border-teal/40 transition shadow-soft"
          >
            <ArrowUpDown className="h-4 w-4 md:rotate-90" />
          </button>
        </div>

        <PlaceInput
          label="To (Destination)"
          icon={<MapPin className="h-4 w-4" />}
          value={to}
          onChange={setTo}
          placeholder="Where are you headed?"
        />

        <button
          type="submit"
          disabled={!from.trim() || !to.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50 md:self-stretch md:mb-0 md:mt-[22px] shrink-0"
        >
          Plan trip
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Real-Time Departure Sync Bar */}
      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-teal" />
          <span className="font-semibold text-muted-foreground">Departure:</span>
          <button
            type="button"
            onClick={() => setIsDepartNow(true)}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              isDepartNow
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Leave Now (Real-Time)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsDepartNow(false)}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              !isDepartNow
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            Schedule Time
          </button>
        </div>

        {!isDepartNow && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Depart at:</span>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-coral" />
          <span>Real-time availability, delays & schedules synced</span>
        </div>
      </div>
    </form>
  );
}
