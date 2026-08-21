import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Compass, Train, Plane, Bus, Bike, Leaf, Wallet, Clock } from "lucide-react";
import { SearchForm } from "@/components/search-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TravelAI — Compare trains, buses & flights with AI" },
      {
        name: "description",
        content:
          "Plan any journey with AI: compare trains, buses, flights, metros and mixed routes by time, cost, transfers and comfort.",
      },
      {
        property: "og:title",
        content: "TravelAI — Compare trains, buses & flights with AI",
      },
      {
        property: "og:description",
        content:
          "Enter where you're starting and where you're going. TravelAI ranks every realistic route by speed, price, comfort and impact.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "TravelAI",
          applicationCategory: "TravelApplication",
          operatingSystem: "All",
          description:
            "AI-powered multi-modal journey planner comparing trains, buses, flights and metros by time, cost and comfort.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Landing,
});

const popular: Array<{ from: string; to: string; label: string }> = [
  { from: "Vijayawada, India", to: "Hyderabad, India", label: "Vijayawada → Hyderabad" },
  { from: "Mumbai, India", to: "Goa, India", label: "Mumbai → Goa" },
  { from: "Bangalore, India", to: "Chennai, India", label: "Bangalore → Chennai" },
  { from: "Delhi, India", to: "Jaipur, India", label: "Delhi → Jaipur" },
  { from: "Paris, France", to: "London, UK", label: "Paris → London" },
  { from: "Tokyo, Japan", to: "Kyoto, Japan", label: "Tokyo → Kyoto" },
];

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-teal">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Landing() {
  return (
    <main className="min-h-screen hero-bg">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TravelAI</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#modes" className="hover:text-foreground">
            Transport modes
          </a>
          <a href="#popular" className="hover:text-foreground">
            Popular routes
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-coral" />
            AI-powered multi-modal trip planner
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-semibold leading-[1.05] text-foreground">
            Every way from <span className="italic text-coral">A</span> to{" "}
            <span className="italic text-teal">B</span>, ranked by AI.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-muted-foreground">
            Compare buses, trains, flights, metros and mixed routes between any two places — with
            time, cost, transfers and comfort at a glance.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <SearchForm />
        </div>

        {/* Popular */}
        <div
          id="popular"
          className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs"
        >
          <span className="text-muted-foreground">Try:</span>
          {popular.map((p) => (
            <Link
              key={p.label}
              to="/plan"
              search={{ from: p.from, to: p.to }}
              className="rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground/80 hover:bg-secondary transition"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section id="modes" className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {[
            { icon: <Train className="h-4 w-4" />, label: "Train" },
            { icon: <Bus className="h-4 w-4" />, label: "Bus" },
            { icon: <Plane className="h-4 w-4" />, label: "Flight" },
            { icon: <Compass className="h-4 w-4" />, label: "Metro" },
            { icon: <Bike className="h-4 w-4" />, label: "Bike / Auto" },
            { icon: <Leaf className="h-4 w-4" />, label: "Multi-modal" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2.5 text-sm font-medium text-foreground/80"
            >
              <span className="text-teal">{m.icon}</span>
              {m.label}
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
            One search. Every realistic route.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Unlike maps that show one line on a screen, TravelAI composes complete door-to-door
            journeys — even when no direct option exists.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature
            icon={<Clock className="h-5 w-5" />}
            title="Fastest routes"
            body="See the quickest combination — flight + taxi, express train, or straight drive — with realistic durations."
          />
          <Feature
            icon={<Wallet className="h-5 w-5" />}
            title="Cheapest routes"
            body="Budget-friendly buses, sleeper trains and multi-hop combos with transparent price ranges."
          />
          <Feature
            icon={<Leaf className="h-5 w-5" />}
            title="Comfort & eco score"
            body="Every option gets a comfort and eco rating so you can pick what fits the trip, not just the map."
          />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} TravelAI</div>
          <div>Route data via Google Maps · Planning by Lovable AI</div>
        </div>
      </footer>
    </main>
  );
}
