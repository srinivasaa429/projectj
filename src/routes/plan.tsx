import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Bus,
  Clock,
  Compass,
  Leaf,
  MapPin,
  Plane,
  Radio,
  RefreshCw,
  Route as RouteIcon,
  Ship,
  Sparkles,
  Star,
  Train,
  Wallet,
  Loader2,
  Car,
  Footprints,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calculator,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { planTrip, type RouteOption } from "@/lib/travel.functions";
import { SearchForm } from "@/components/search-form";
import { LiveTrack, supportsLiveTracking } from "@/components/live-track";
import { CostCalculator, GlobalCostBar } from "@/components/cost-calculator";
import { GoogleMapsGroundingCard } from "@/components/maps-grounding-card";
import {
  calculateRouteCost,
  getDefaultCalculatorOptions,
  type CalculatorOptions,
} from "@/lib/cost-utils";
import { fmt12 } from "@/lib/live-schedule";

const searchSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  departureTime: z.string().optional(),
  departNow: z.boolean().optional(),
});

export const Route = createFileRoute("/plan")({
  validateSearch: (raw) => searchSchema.parse(raw),
  head: ({ match }) => {
    const s = match.search as { from?: string; to?: string };
    const trip = s.from && s.to ? `${s.from} → ${s.to}` : null;
    const title = trip
      ? `${trip} · Real-Time Journey Plan`
      : "Real-Time Multi-Modal Travel Planner";
    const description = trip
      ? `Real-time synchronized travel options from ${s.from} to ${s.to} with live availability, trains, buses, flights, and road routes.`
      : "AI-planned multi-modal routes synchronized with real-time transit schedules.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          property: "og:title",
          content: trip ? `How to travel ${trip}` : "Real-Time Trip Planner with AI",
        },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "robots", content: "noindex" },
      ],
    };
  },

  component: PlanPage,
});

function modeIcon(mode: string) {
  const m = mode.toLowerCase();
  if (m.includes("train")) return <Train className="h-4 w-4" />;
  if (m.includes("bus")) return <Bus className="h-4 w-4" />;
  if (m.includes("flight") || m.includes("plane") || m.includes("air"))
    return <Plane className="h-4 w-4" />;
  if (m.includes("metro") || m.includes("subway")) return <Compass className="h-4 w-4" />;
  if (m.includes("ferry") || m.includes("boat")) return <Ship className="h-4 w-4" />;
  if (m.includes("bike") || m.includes("cycle") || m.includes("auto"))
    return <Bike className="h-4 w-4" />;
  if (m.includes("walk") || m.includes("foot")) return <Footprints className="h-4 w-4" />;
  if (m.includes("car") || m.includes("taxi") || m.includes("cab"))
    return <Car className="h-4 w-4" />;
  return <RouteIcon className="h-4 w-4" />;
}

function Stars({ n, color = "text-sun" }: { n: number; color?: string }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? `fill-current ${color}` : "text-border"}`}
        />
      ))}
    </div>
  );
}

function LiveStatusBadge({
  status,
  delayMin,
  nextDepartureMinutes,
}: {
  status?: string;
  delayMin?: number;
  nextDepartureMinutes?: number;
}) {
  if (status === "available-now") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
        <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
        Available Immediately (3-5m)
      </span>
    );
  }

  if (status === "boarding") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        Boarding Now
      </span>
    );
  }

  if (delayMin && delayMin > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
        <AlertCircle className="h-3 w-3" />+{delayMin}m Delay
      </span>
    );
  }

  if (nextDepartureMinutes != null && nextDepartureMinutes > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        <CheckCircle2 className="h-3 w-3" />
        On-Time · Departs in {nextDepartureMinutes}m
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      On Schedule
    </span>
  );
}

function RouteCard({
  route,
  badge,
  currency,
  globalOptions,
  onOptionChange,
}: {
  route: RouteOption;
  badge?: string;
  currency: string;
  globalOptions?: CalculatorOptions;
  onOptionChange?: (options: CalculatorOptions) => void;
}) {
  const [showCalculator, setShowCalculator] = useState(false);
  const activeOptions = globalOptions || getDefaultCalculatorOptions();
  const calculated = calculateRouteCost(route, activeOptions);

  const min = route.costINR?.min ?? 0;
  const max = route.costINR?.max ?? 0;
  const baseCostRange =
    min === max
      ? `${currency}${min.toLocaleString()}`
      : `${currency}${min.toLocaleString()}–${max.toLocaleString()}`;

  const currentDisplayCost = `${currency}${calculated.totalCost.toLocaleString()}`;

  return (
    <article className="group relative rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lift flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {badge && (
              <div className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground shadow-xs">
                {badge}
              </div>
            )}
            <button
              type="button"
              id={`btn-calc-toggle-${route.id}`}
              onClick={() => setShowCalculator(!showCalculator)}
              className="inline-flex items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal hover:bg-teal/20 transition"
            >
              <Calculator className="h-3 w-3" />
              <span>{showCalculator ? "Hide Calculator" : "Real & Possible Cost"}</span>
              {showCalculator ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          <LiveStatusBadge
            status={route.liveStatus?.status}
            delayMin={route.liveStatus?.delayMin}
            nextDepartureMinutes={route.liveStatus?.nextDepartureMinutes}
          />
        </div>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {route.modes.slice(0, 4).map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span className="text-teal">{modeIcon(m)}</span>
                  {m}
                  {i < Math.min(route.modes.length, 4) - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </span>
              ))}
            </div>
            <h3 className="mt-1 text-xl font-semibold text-foreground">{route.title}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-foreground tabular-nums">
              {route.duration}
            </div>
            <div className="text-xs text-muted-foreground">{route.distanceKm} km</div>
          </div>
        </header>

        {/* Departure & Arrival Clock Windows */}
        {(route.departTime || route.arriveTime) && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-xl bg-secondary/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-teal" />
              <span>
                Depart <strong className="tabular-nums">{route.departTime}</strong>
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span>
                Arrive <strong className="tabular-nums">{route.arriveTime}</strong>
              </span>
            </div>

            {route.liveStatus?.platform && (
              <span className="ml-auto rounded-md bg-background px-2 py-0.5 text-[11px] font-semibold text-teal shadow-xs">
                {route.liveStatus.platform}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            onClick={() => setShowCalculator(!showCalculator)}
            className="cursor-pointer rounded-xl border border-teal/30 bg-teal/5 p-3 shadow-2xs hover:bg-teal/10 transition"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-teal">
              <span className="flex items-center gap-1">
                <Wallet className="h-4 w-4" /> Calc Cost
              </span>
              <Calculator className="h-3 w-3" />
            </div>
            <div className="mt-1 text-sm font-bold text-foreground tabular-nums">
              {currentDisplayCost}
            </div>
            {activeOptions.travelers > 1 && (
              <div className="text-[10px] text-muted-foreground tabular-nums">
                {currency}
                {calculated.costPerPerson.toLocaleString()} / person
              </div>
            )}
            {activeOptions.travelers === 1 && (
              <div className="text-[10px] text-muted-foreground">Base: {baseCostRange}</div>
            )}
          </div>

          <Stat
            icon={<RouteIcon className="h-4 w-4" />}
            label="Transfers"
            value={route.transfers === 0 ? "Direct" : `${route.transfers}`}
          />
          <Stat
            icon={<Star className="h-4 w-4" />}
            label="Comfort"
            value={<Stars n={route.comfort} color="text-sun" />}
          />
          <Stat
            icon={<Leaf className="h-4 w-4" />}
            label="Eco"
            value={<Stars n={route.eco} color="text-primary" />}
          />
        </div>

        {/* Embedded Interactive Real & Possible Cost Calculator */}
        {showCalculator && (
          <CostCalculator
            route={route}
            globalOptions={globalOptions}
            onOptionChange={onOptionChange}
          />
        )}

        {route.segments?.length > 0 && (
          <ol className="mt-5 border-l-2 border-dashed border-border pl-4 space-y-4">
            {route.segments.map((seg, i) => (
              <li key={i} className="relative pb-2 last:pb-0">
                <span className="absolute -left-[22px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-teal shadow-xs">
                  {modeIcon(seg.mode)}
                </span>
                <div className="pl-3">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold text-foreground">
                      {seg.from} → {seg.to}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      · {seg.duration}
                    </span>
                    {seg.costEstimate?.label && (
                      <span className="ml-auto rounded-md bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal shadow-2xs">
                        {seg.costEstimate.label}
                      </span>
                    )}
                  </div>

                  {(seg.serviceName || seg.serviceNumber || seg.operator) && (
                    <div className="mt-0.5 text-xs font-medium text-teal flex flex-wrap items-center gap-1.5">
                      <span>
                        {[seg.serviceName, seg.serviceNumber].filter(Boolean).join(" · ")}
                      </span>
                      {seg.operator && (
                        <span className="text-muted-foreground">({seg.operator})</span>
                      )}
                      {seg.platform && (
                        <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] font-semibold text-foreground">
                          {seg.platform}
                        </span>
                      )}
                    </div>
                  )}

                  {(seg.departTime || seg.arriveTime) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs tabular-nums">
                      {seg.departTime && (
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-semibold text-foreground">
                          Dep {seg.departTime}
                        </span>
                      )}
                      {seg.arriveTime && (
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-semibold text-foreground">
                          Arr {seg.arriveTime}
                        </span>
                      )}
                      {seg.frequency && (
                        <span className="text-muted-foreground">· {seg.frequency}</span>
                      )}
                    </div>
                  )}

                  {seg.detail && (
                    <div className="mt-1 text-xs text-muted-foreground">{seg.detail}</div>
                  )}

                  {supportsLiveTracking(seg.mode) && <LiveTrack segment={seg} />}

                  {seg.stops && seg.stops.length > 0 && (
                    <div className="mt-2.5 rounded-lg bg-secondary/60 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Intermediate Stops & Timetable
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {seg.stops.map((st, si) => (
                          <li key={si} className="flex justify-between text-xs text-foreground">
                            <span>{st.name}</span>
                            {st.time && (
                              <span className="tabular-nums text-muted-foreground font-mono">
                                {st.time}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {(route.bestFor || route.notes || route.liveStatus?.availabilityNote) && (
        <div className="mt-5 rounded-xl bg-secondary/70 p-3 text-sm">
          {route.bestFor && (
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Best for
            </div>
          )}
          {route.bestFor && <div className="font-medium text-foreground">{route.bestFor}</div>}
          {route.liveStatus?.availabilityNote && (
            <div className="mt-1 text-xs font-medium text-teal flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {route.liveStatus.availabilityNote}
            </div>
          )}
          {route.notes && <div className="mt-1 text-xs text-muted-foreground">{route.notes}</div>}
        </div>
      )}
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 shadow-2xs">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="text-teal">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function PlanPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "recommended" | "departure" | "fastest" | "cheapest" | "eco"
  >("recommended");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [calculatorOptions, setCalculatorOptions] = useState<CalculatorOptions>(
    getDefaultCalculatorOptions(),
  );

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setCurrentTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
    };
    update();
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["plan", search.from, search.to, search.departureTime, search.departNow],
    queryFn: () =>
      planTrip({
        data: {
          from: search.from,
          to: search.to,
          departureTime: search.departureTime,
          departNow: search.departNow,
        },
      }),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const errorMessage =
    error instanceof Error && error.message
      ? error.message
      : "We couldn't build a plan for this route right now. Check the places you entered and try again.";

  const currency = data?.currencySymbol || "₹";

  const badgeFor = (id: string): string | undefined => {
    if (!data) return undefined;
    if (id === data.recommendation.fastest) return "Fastest";
    if (id === data.recommendation.cheapest) return "Cheapest";
    if (id === data.recommendation.comfortable) return "Most comfortable";
    if (id === data.recommendation.eco) return "Greenest";
    return undefined;
  };

  // Filter routes
  const filteredRoutes = (data?.routes ?? []).filter((r) => {
    if (selectedMode === "all") return true;
    if (selectedMode === "train") return r.modes.some((m) => m.toLowerCase().includes("train"));
    if (selectedMode === "bus") return r.modes.some((m) => m.toLowerCase().includes("bus"));
    if (selectedMode === "flight")
      return r.modes.some(
        (m) => m.toLowerCase().includes("flight") || m.toLowerCase().includes("plane"),
      );
    if (selectedMode === "road")
      return r.modes.some(
        (m) =>
          m.toLowerCase().includes("car") ||
          m.toLowerCase().includes("taxi") ||
          m.toLowerCase().includes("cab"),
      );
    return true;
  });

  // Sort routes
  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    if (sortBy === "departure") {
      const depA = a.liveStatus?.nextDepartureMinutes ?? 999;
      const depB = b.liveStatus?.nextDepartureMinutes ?? 999;
      return depA - depB;
    }
    if (sortBy === "cheapest") {
      const costA = calculateRouteCost(a, calculatorOptions).totalCost;
      const costB = calculateRouteCost(b, calculatorOptions).totalCost;
      return costA - costB;
    }
    if (sortBy === "eco") {
      return (b.eco ?? 0) - (a.eco ?? 0);
    }
    if (sortBy === "fastest") {
      const getHours = (d: string) => {
        const h = /(\d+)h/.exec(d);
        const m = /(\d+)m/.exec(d);
        return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
      };
      return getHours(a.duration) - getHours(b.duration);
    }
    return 0;
  });

  return (
    <main className="min-h-screen hero-bg">
      {/* Top Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TravelAI</span>
        </Link>
        <button
          onClick={() => router.history.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </button>
      </header>

      {/* Search Bar Container */}
      <section className="mx-auto max-w-6xl px-5 pb-6">
        <SearchForm
          initialFrom={search.from}
          initialTo={search.to}
          initialTime={search.departureTime}
        />
      </section>

      {/* Results Main Section */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        {/* Real-time Status Sync Banner */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>Real-Time Sync Active</span>
                <span className="text-xs font-normal text-muted-foreground">
                  (Clock: {currentTime ? `${currentTime}` : "Live"})
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedules, departures, and delays aligned for departure from{" "}
                <strong className="text-foreground">
                  {data?.referenceDepartureTime || search.departureTime || currentTime || "Now"}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-teal ${isFetching ? "animate-spin" : ""}`} />
            <span>Sync Live Status</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Available Journeys: {search.from} → {search.to}
          </h1>
          {data?.drivingDistanceKm != null && (
            <span className="text-xs text-muted-foreground font-medium">
              ~{data.drivingDistanceKm} km road distance
            </span>
          )}
        </div>

        {/* Google Maps Grounding Card */}
        {data && (
          <GoogleMapsGroundingCard
            grounding={data.mapsGrounding}
            fromName={data.from?.name || search.from}
            toName={data.to?.name || search.to}
          />
        )}

        {/* Global Trip Cost & Passenger Configuration Bar */}
        {data && data.routes.length > 0 && (
          <div className="mb-6">
            <GlobalCostBar
              options={calculatorOptions}
              onChange={setCalculatorOptions}
              currencySymbol={currency}
            />
          </div>
        )}

        {/* Filter & Sort Controls */}
        {data && data.routes.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            {/* Mode Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMode("all")}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  selectedMode === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                All Modes ({data.routes.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("train")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
                  selectedMode === "train"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Train className="h-3.5 w-3.5" /> Trains
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("bus")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
                  selectedMode === "bus"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Bus className="h-3.5 w-3.5" /> Buses
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("flight")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
                  selectedMode === "flight"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Plane className="h-3.5 w-3.5" /> Flights
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("road")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
                  selectedMode === "road"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Car className="h-3.5 w-3.5" /> Cabs / Drive
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-border bg-card px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="recommended">⭐ AI Recommended</option>
                <option value="departure">⏱️ Earliest Departure</option>
                <option value="fastest">⚡ Fastest Duration</option>
                <option value="cheapest">💰 Lowest Cost</option>
                <option value="eco">🌿 Most Eco-Friendly</option>
              </select>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-16 text-center shadow-soft">
            <Loader2 className="h-8 w-8 animate-spin text-teal" />
            <p className="mt-4 text-sm font-semibold text-foreground">
              Composing your real-time journey
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Synchronizing available trains, buses, flights, and live routes for current departure
            </p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-soft">
            <h3 className="text-lg font-semibold text-foreground">Couldn't plan this trip</h3>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs"
            >
              Try again
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {sortedRoutes.map((r) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  badge={badgeFor(r.id)}
                  currency={r.currencySymbol || currency}
                  globalOptions={calculatorOptions}
                  onOptionChange={setCalculatorOptions}
                />
              ))}
            </div>

            {sortedRoutes.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-soft">
                <Clock className="mx-auto h-8 w-8 text-teal" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No transport options matching the selected filter.
                </p>
                <button
                  onClick={() => setSelectedMode("all")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Show all available modes
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
