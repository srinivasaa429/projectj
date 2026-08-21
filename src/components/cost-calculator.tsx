import { useState } from "react";
import {
  Calculator,
  Users,
  Luggage,
  Utensils,
  Armchair,
  Car,
  Receipt,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  TrendingDown,
  TrendingUp,
  Coins,
  ShieldCheck,
  Fuel,
} from "lucide-react";
import type { RouteOption } from "@/lib/travel.functions";
import {
  calculateRouteCost,
  getDefaultCalculatorOptions,
  type CalculatorOptions,
  type FareTier,
} from "@/lib/cost-utils";

interface CostCalculatorProps {
  route: RouteOption;
  globalOptions?: CalculatorOptions;
  onOptionChange?: (options: CalculatorOptions) => void;
  compact?: boolean;
}

export function CostCalculator({
  route,
  globalOptions,
  onOptionChange,
  compact = false,
}: CostCalculatorProps) {
  const [localOptions, setLocalOptions] = useState<CalculatorOptions>(
    globalOptions ?? getDefaultCalculatorOptions(),
  );
  const [showItemized, setShowItemized] = useState(false);

  const activeOptions = globalOptions ?? localOptions;

  const updateOptions = (next: Partial<CalculatorOptions>) => {
    const updated = { ...activeOptions, ...next };
    if (!globalOptions) {
      setLocalOptions(updated);
    }
    onOptionChange?.(updated);
  };

  const calculated = calculateRouteCost(route, activeOptions);
  const sym = calculated.currencySymbol;
  const isVehicle = calculated.pricingType === "per-vehicle";

  return (
    <div
      id={`cost-calc-${route.id}`}
      className="mt-4 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xs"
    >
      {/* Header with Real and Possible Cost overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/15 text-teal">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                Real & Possible Cost Calculator
              </h4>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {isVehicle ? "Shared Vehicle Rate" : "Per Person Fare"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Calculate exact fare variations, group rates & add-ons
            </p>
          </div>
        </div>

        {/* Real Live Calculation Readout */}
        <div className="text-right">
          <div className="text-lg font-bold text-foreground tabular-nums">
            {sym}
            {calculated.totalCost.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {activeOptions.tripType === "round-trip" ? "(Round-Trip)" : "(One-Way)"}
            </span>
          </div>
          {activeOptions.travelers > 1 && (
            <div className="text-[11px] font-medium text-teal tabular-nums">
              {sym}
              {calculated.costPerPerson.toLocaleString()} per traveler
            </div>
          )}
        </div>
      </div>

      {/* Quick Controls: Travelers, Trip Type, and Class Tier */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* 1. Passenger Count */}
        <div className="rounded-xl bg-secondary/50 p-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Users className="h-3.5 w-3.5 text-teal" /> Travelers
            </span>
            <span className="font-semibold text-foreground">{activeOptions.travelers}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-travelers-${route.id}-${num}`}
                onClick={() => updateOptions({ travelers: num })}
                className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                  activeOptions.travelers === num
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Trip Type (One-Way / Round-Trip) */}
        <div className="rounded-xl bg-secondary/50 p-2.5">
          <div className="text-xs font-medium text-muted-foreground">Trip Direction</div>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            <button
              type="button"
              id={`btn-oneway-${route.id}`}
              onClick={() => updateOptions({ tripType: "one-way" })}
              className={`rounded-lg py-1 text-xs font-semibold transition ${
                activeOptions.tripType === "one-way"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              One-Way
            </button>
            <button
              type="button"
              id={`btn-roundtrip-${route.id}`}
              onClick={() => updateOptions({ tripType: "round-trip" })}
              className={`rounded-lg py-1 text-xs font-semibold transition ${
                activeOptions.tripType === "round-trip"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              Round-Trip
            </button>
          </div>
        </div>

        {/* 3. Fare Class Tier */}
        <div className="rounded-xl bg-secondary/50 p-2.5">
          <div className="text-xs font-medium text-muted-foreground">Fare Tier</div>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {(
              [
                { id: "budget", label: "Budget" },
                { id: "standard", label: "Standard" },
                { id: "premium", label: "Premium" },
              ] as Array<{ id: FareTier; label: string }>
            ).map((tier) => (
              <button
                key={tier.id}
                type="button"
                id={`btn-tier-${route.id}-${tier.id}`}
                onClick={() => updateOptions({ selectedTier: tier.id })}
                className={`rounded-lg py-1 text-[11px] font-semibold transition ${
                  activeOptions.selectedTier === tier.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real vs Possible Cost Range Spectrum */}
      <div className="mt-3.5 rounded-xl border border-border/60 bg-secondary/30 p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-teal" /> Real vs. Possible Cost Range
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {calculated.costPerKm > 0 ? `${sym}${calculated.costPerKm}/km` : ""}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Min Saver */}
          <div className="rounded-lg bg-background/80 p-2 border border-border/40">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="h-3 w-3" /> Real Minimum
            </div>
            <div className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
              {sym}
              {calculated.realMinPossibleCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Saver / Advance booking</div>
          </div>

          {/* Realistic Standard */}
          <div className="rounded-lg bg-teal/10 p-2 border border-teal/30">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-teal">
              <ShieldCheck className="h-3 w-3" /> Likely Real Cost
            </div>
            <div className="mt-0.5 text-sm font-bold text-teal tabular-nums">
              {sym}
              {calculated.realisticExpectedCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Standard regular fare</div>
          </div>

          {/* Max Peak Possible */}
          <div className="rounded-lg bg-background/80 p-2 border border-border/40">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-3 w-3" /> Max Possible
            </div>
            <div className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
              {sym}
              {calculated.maxPossibleCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Peak flex / Last-minute</div>
          </div>
        </div>
      </div>

      {/* Add-ons Checklist */}
      <div className="mt-3.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Include Optional Add-Ons
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Baggage */}
          <button
            type="button"
            id={`addon-baggage-${route.id}`}
            onClick={() => updateOptions({ includeBaggage: !activeOptions.includeBaggage })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeOptions.includeBaggage
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Luggage className="h-3.5 w-3.5" /> Extra Baggage (+{sym}
            {route.currencyCode === "INR" ? "750" : "35"})
          </button>

          {/* Meals */}
          <button
            type="button"
            id={`addon-meals-${route.id}`}
            onClick={() => updateOptions({ includeMeals: !activeOptions.includeMeals })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeOptions.includeMeals
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Utensils className="h-3.5 w-3.5" /> Onboard Meals (+{sym}
            {route.currencyCode === "INR" ? "250" : "15"})
          </button>

          {/* Seat selection */}
          <button
            type="button"
            id={`addon-seats-${route.id}`}
            onClick={() =>
              updateOptions({ includeSeatSelection: !activeOptions.includeSeatSelection })
            }
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeOptions.includeSeatSelection
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Armchair className="h-3.5 w-3.5" /> Reserved Seat (+{sym}
            {route.currencyCode === "INR" ? "150" : "10"})
          </button>

          {/* Last-mile connection */}
          <button
            type="button"
            id={`addon-lastmile-${route.id}`}
            onClick={() => updateOptions({ includeLastMileCab: !activeOptions.includeLastMileCab })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeOptions.includeLastMileCab
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Car className="h-3.5 w-3.5" /> Door-to-Station Cab (+{sym}
            {route.currencyCode === "INR" ? "350" : "25"})
          </button>
        </div>
      </div>

      {/* Itemized Cost Breakdown Accordion */}
      <div className="mt-3.5 border-t border-border/60 pt-2.5">
        <button
          type="button"
          id={`btn-toggle-itemized-${route.id}`}
          onClick={() => setShowItemized(!showItemized)}
          className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          <span className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-teal" /> Itemized Bill & Calculation Formula
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-teal">
            {showItemized ? "Hide" : "View Breakdown"}
            {showItemized ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {showItemized && (
          <div className="mt-2.5 space-y-1.5 rounded-xl bg-secondary/60 p-3 text-xs">
            {calculated.items.map((item) => {
              const itemTotal = item.perPerson
                ? item.amount * activeOptions.travelers
                : item.amount;
              return (
                <div key={item.id} className="flex items-center justify-between text-foreground">
                  <span className="text-muted-foreground">
                    {item.name}
                    {item.perPerson && activeOptions.travelers > 1 && (
                      <span className="ml-1 text-[10px] text-muted-foreground/80">
                        ({sym}
                        {item.amount} × {activeOptions.travelers})
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {sym}
                    {itemTotal.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {activeOptions.tripType === "round-trip" && (
              <div className="flex items-center justify-between text-teal pt-1 border-t border-border/40">
                <span>Round-Trip Multiplier (incl. ~5% return discount)</span>
                <span className="font-mono font-semibold">× 1.9</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border/80 pt-2 font-semibold text-foreground text-sm">
              <span>Total Estimated Trip Cost</span>
              <span className="text-teal font-mono tabular-nums">
                {sym}
                {calculated.totalCost.toLocaleString()}
              </span>
            </div>

            {calculated.savingsNote && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-teal/10 p-2 text-[11px] text-teal">
                <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{calculated.savingsNote}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface GlobalCostBarProps {
  options: CalculatorOptions;
  onChange: (options: CalculatorOptions) => void;
  currencySymbol: string;
}

export function GlobalCostBar({ options, onChange, currencySymbol }: GlobalCostBarProps) {
  return (
    <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 shadow-xs backdrop-blur-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-teal-foreground shadow-xs">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Trip Cost Estimator & Group Calculator
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure passenger count and trip type to calculate real vs. possible travel costs
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Passenger Count */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs shadow-xs">
            <Users className="h-4 w-4 text-teal" />
            <span className="font-medium text-foreground">Travelers:</span>
            <div className="flex items-center gap-1 ml-1">
              {[1, 2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  id={`global-traveler-btn-${n}`}
                  onClick={() => onChange({ ...options, travelers: n })}
                  className={`h-6 w-6 rounded-md text-xs font-semibold transition ${
                    options.travelers === n
                      ? "bg-teal text-white shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Trip Type */}
          <div className="flex items-center rounded-xl border border-border/80 bg-background p-1 text-xs shadow-xs">
            <button
              type="button"
              id="global-oneway-btn"
              onClick={() => onChange({ ...options, tripType: "one-way" })}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                options.tripType === "one-way"
                  ? "bg-teal text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              One-Way
            </button>
            <button
              type="button"
              id="global-roundtrip-btn"
              onClick={() => onChange({ ...options, tripType: "round-trip" })}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                options.tripType === "round-trip"
                  ? "bg-teal text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Round-Trip
            </button>
          </div>

          {/* Class Tier */}
          <div className="flex items-center rounded-xl border border-border/80 bg-background p-1 text-xs shadow-xs">
            {(
              [
                { id: "budget", label: "Budget" },
                { id: "standard", label: "Standard" },
                { id: "premium", label: "Premium" },
              ] as Array<{ id: FareTier; label: string }>
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                id={`global-tier-btn-${t.id}`}
                onClick={() => onChange({ ...options, selectedTier: t.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  options.selectedTier === t.id
                    ? "bg-teal text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
