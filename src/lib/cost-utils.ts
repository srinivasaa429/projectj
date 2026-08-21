import type { RouteOption } from "./travel.functions";

export type FareTier = "budget" | "standard" | "premium";

export type CalculatorOptions = {
  travelers: number;
  tripType: "one-way" | "round-trip";
  selectedTier: FareTier;
  includeBaggage: boolean;
  includeMeals: boolean;
  includeSeatSelection: boolean;
  includeLastMileCab: boolean;
  includeTolls: boolean;
};

export type ItemizedReceiptItem = {
  id: string;
  name: string;
  amount: number;
  perPerson: boolean;
  isOptional?: boolean;
  category: "ticket" | "tax" | "fuel_toll" | "addon" | "last_mile";
};

export type CalculatedCost = {
  currencySymbol: string;
  currencyCode: string;
  pricingType: "per-person" | "per-vehicle";
  travelers: number;
  tripType: "one-way" | "round-trip";
  selectedTier: FareTier;

  // Real baseline & range for selected config
  baseTicketPerPerson: number;
  totalBeforeAddons: number;
  addonsTotal: number;
  totalCost: number;
  costPerPerson: number;

  // Real vs Possible Scenarios
  realMinPossibleCost: number; // Absolute lowest saver booking
  realisticExpectedCost: number; // Standard booking with typical options
  maxPossibleCost: number; // Peak flexible / business / full add-ons

  // Cost per kilometer
  costPerKm: number;

  // Itemized breakdown
  items: ItemizedReceiptItem[];

  // Insights
  savingsNote?: string;
  carbonKg: number;
};

export function getDefaultCalculatorOptions(): CalculatorOptions {
  return {
    travelers: 1,
    tripType: "one-way",
    selectedTier: "standard",
    includeBaggage: false,
    includeMeals: false,
    includeSeatSelection: false,
    includeLastMileCab: false,
    includeTolls: true,
  };
}

export function calculateRouteCost(route: RouteOption, options: CalculatorOptions): CalculatedCost {
  const sym = route.currencySymbol || "₹";
  const code = route.currencyCode || "INR";
  const isIndia = code === "INR";
  const isPerVehicle =
    route.modes.some((m) => {
      const ml = m.toLowerCase();
      return ml.includes("car") || ml.includes("taxi") || ml.includes("cab") || ml.includes("auto");
    }) &&
    !route.modes.some(
      (m) =>
        m.toLowerCase().includes("flight") ||
        m.toLowerCase().includes("train") ||
        m.toLowerCase().includes("bus"),
    );

  const isFlight = route.modes.some(
    (m) => m.toLowerCase().includes("flight") || m.toLowerCase().includes("plane"),
  );
  const isTrain = route.modes.some((m) => m.toLowerCase().includes("train"));
  const isBus = route.modes.some((m) => m.toLowerCase().includes("bus"));

  const minRaw = route.costINR?.min || 500;
  const maxRaw = route.costINR?.max || minRaw * 2;
  const likelyRaw = Math.round(minRaw + (maxRaw - minRaw) * 0.4);

  // Multipliers for tiers
  let tierMultiplier = 1.0;
  if (options.selectedTier === "budget") tierMultiplier = 0.85;
  if (options.selectedTier === "premium") tierMultiplier = 1.65;

  const baseUnitFare = Math.round(
    likelyRaw * (options.selectedTier === "standard" ? 1.0 : tierMultiplier),
  );
  const minUnitFare = Math.round(minRaw * 0.9);
  const maxUnitFare = Math.round(maxRaw * 1.35);

  const items: ItemizedReceiptItem[] = [];

  // 1. Base Ticket / Fare
  const tierName =
    options.selectedTier === "budget"
      ? isFlight
        ? "Saver Economy (Hand baggage only)"
        : isTrain
          ? "Second Sleeper / 2S / General"
          : isBus
            ? "Standard Seater"
            : "Hatchback / Shared Cab"
      : options.selectedTier === "premium"
        ? isFlight
          ? "Business / Flex Premium"
          : isTrain
            ? "1AC / Executive Class"
            : isBus
              ? "Volvo Multi-Axle Sleeper"
              : "Prime SUV / Luxury Sedan"
        : isFlight
          ? "Standard Economy"
          : isTrain
            ? "3AC / AC Chair Car"
            : isBus
              ? "AC Semi-Sleeper"
              : "Sedan / Standard Cab";

  items.push({
    id: "base_fare",
    name: `Base Fare · ${tierName}`,
    amount: baseUnitFare,
    perPerson: !isPerVehicle,
    category: "ticket",
  });

  // 2. Taxes & Fees
  const taxRate = isFlight ? 0.12 : isIndia ? 0.05 : 0.08;
  const taxAmount = Math.max(isIndia ? 25 : 2, Math.round(baseUnitFare * taxRate));
  items.push({
    id: "taxes",
    name: isFlight ? "Airport UDF & Aviation Taxes" : "GST & Booking Platform Surcharges",
    amount: taxAmount,
    perPerson: !isPerVehicle,
    category: "tax",
  });

  // 3. Tolls & Fuel (for road routes)
  if (isPerVehicle && options.includeTolls) {
    const estTolls = Math.max(
      isIndia ? 180 : 8,
      Math.round((route.distanceKm || 100) * (isIndia ? 1.2 : 0.04)),
    );
    items.push({
      id: "tolls",
      name: "Highway Express Tolls & FastTag",
      amount: estTolls,
      perPerson: false,
      isOptional: true,
      category: "fuel_toll",
    });
  }

  // 4. Add-ons
  if (options.includeBaggage) {
    const bagCost = isFlight ? (isIndia ? 750 : 35) : isIndia ? 100 : 10;
    items.push({
      id: "baggage",
      name: "Additional Checked Luggage (20kg)",
      amount: bagCost,
      perPerson: true,
      isOptional: true,
      category: "addon",
    });
  }

  if (options.includeMeals) {
    const mealCost = isFlight
      ? isIndia
        ? 380
        : 18
      : isTrain
        ? isIndia
          ? 180
          : 12
        : isIndia
          ? 150
          : 8;
    items.push({
      id: "meals",
      name: "On-Board Meal & Refreshment Kit",
      amount: mealCost,
      perPerson: true,
      isOptional: true,
      category: "addon",
    });
  }

  if (options.includeSeatSelection) {
    const seatCost = isFlight
      ? isIndia
        ? 250
        : 14
      : isTrain
        ? isIndia
          ? 80
          : 6
        : isIndia
          ? 60
          : 4;
    items.push({
      id: "seat",
      name: "Preferred Window/Aisle Seat Reservation",
      amount: seatCost,
      perPerson: true,
      isOptional: true,
      category: "addon",
    });
  }

  if (options.includeLastMileCab) {
    const cabCost = isIndia ? 350 : 25;
    items.push({
      id: "last_mile",
      name: "Door-to-Station / Airport Cab Connection",
      amount: cabCost,
      perPerson: false, // shared per party
      isOptional: true,
      category: "last_mile",
    });
  }

  // Calculate base & addons totals with traveler multiplier
  let perPersonBase = 0;
  let perVehicleBase = 0;
  let addonsSum = 0;

  for (const it of items) {
    if (it.category === "ticket" || it.category === "tax") {
      if (it.perPerson) {
        perPersonBase += it.amount;
      } else {
        perVehicleBase += it.amount;
      }
    } else {
      if (it.perPerson) {
        addonsSum += it.amount * options.travelers;
      } else {
        addonsSum += it.amount;
      }
    }
  }

  const baseTotal = perPersonBase * options.travelers + perVehicleBase;
  const tripMultiplier = options.tripType === "round-trip" ? 1.9 : 1.0; // 5-10% round-trip discount

  const totalCost = Math.round((baseTotal + addonsSum) * tripMultiplier);
  const costPerPerson = Math.round(totalCost / options.travelers);

  // Real vs Possible Range
  const realMinBase = isPerVehicle ? minUnitFare : minUnitFare * options.travelers;
  const realMinPossibleCost = Math.round(
    realMinBase * (options.tripType === "round-trip" ? 1.9 : 1.0),
  );

  const realisticExpectedCost = totalCost;

  const maxPossibleBase = (isPerVehicle ? maxUnitFare : maxUnitFare * options.travelers) * 1.25;
  const maxPossibleCost = Math.round(
    (maxPossibleBase + addonsSum * 1.3) * (options.tripType === "round-trip" ? 2.0 : 1.0),
  );

  const costPerKm =
    route.distanceKm > 0
      ? Math.round(
          (costPerPerson / (route.distanceKm * (options.tripType === "round-trip" ? 2 : 1))) * 100,
        ) / 100
      : 0;

  // Insights
  let savingsNote = "";
  if (isPerVehicle && options.travelers > 1) {
    savingsNote = `Splitting this cab/car among ${options.travelers} people costs only ${sym}${costPerPerson.toLocaleString()} per person (saving ~${Math.round(
      (1 - 1 / options.travelers) * 100,
    )}% vs solo booking)!`;
  } else if (isTrain) {
    savingsNote = `Train travel saves up to 60–70% compared to flight tickets with zero luggage weight penalty.`;
  } else if (isBus) {
    savingsNote = `Most economical overland route with direct depot-to-depot boarding.`;
  }

  // Estimated carbon emissions (kg CO2)
  const dist = route.distanceKm || 200;
  let carbonFactor = 0.035; // train
  if (isFlight) carbonFactor = 0.18;
  else if (isBus) carbonFactor = 0.05;
  else if (isPerVehicle) carbonFactor = 0.12 / Math.max(1, options.travelers);

  const carbonKg = Math.round(dist * carbonFactor * (options.tripType === "round-trip" ? 2 : 1));

  return {
    currencySymbol: sym,
    currencyCode: code,
    pricingType: isPerVehicle ? "per-vehicle" : "per-person",
    travelers: options.travelers,
    tripType: options.tripType,
    selectedTier: options.selectedTier,
    baseTicketPerPerson: baseUnitFare,
    totalBeforeAddons: Math.round(baseTotal * tripMultiplier),
    addonsTotal: Math.round(addonsSum * tripMultiplier),
    totalCost,
    costPerPerson,
    realMinPossibleCost,
    realisticExpectedCost,
    maxPossibleCost,
    costPerKm,
    items,
    savingsNote,
    carbonKg,
  };
}
