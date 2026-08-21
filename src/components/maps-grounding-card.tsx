import { useState } from "react";
import {
  ExternalLink,
  MapPin,
  Navigation2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  CheckCircle2,
  Compass,
} from "lucide-react";
import type { MapsGroundingInfo } from "@/lib/travel.functions";

export function GoogleMapsGroundingCard({
  grounding,
  fromName,
  toName,
}: {
  grounding?: MapsGroundingInfo | null;
  fromName: string;
  toName: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!grounding || (!grounding.summary && grounding.places.length === 0)) {
    return null;
  }

  const directDirectionsUrl =
    grounding.directDirectionsUrl ||
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromName)}&destination=${encodeURIComponent(toName)}`;

  return (
    <div className="mb-6 rounded-2xl border border-teal/30 bg-card p-5 shadow-soft transition">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/15 text-teal border border-teal/30">
            <Navigation2 className="h-5 w-5 fill-teal/20" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground">
                Google Maps Verified Route & Places
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-semibold text-teal border border-teal/20">
                <CheckCircle2 className="h-3 w-3" /> Maps Grounding
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Live geographic data, transport hubs, and navigational links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={directDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal text-white px-3 py-1.5 text-xs font-semibold hover:bg-teal-dark transition shadow-2xs"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pt-4 space-y-4">
          {grounding.summary && (
            <p className="text-xs leading-relaxed text-foreground/90 bg-muted/30 p-3 rounded-xl border border-border/50">
              {grounding.summary}
            </p>
          )}

          {/* Place & Station Cards */}
          {grounding.places && grounding.places.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal" />
                <span>Verified Transit Stations & Key Places</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {grounding.places.map((place, idx) => (
                  <a
                    key={`${place.title}-${idx}`}
                    href={place.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-xl border border-border bg-secondary/40 p-3 hover:border-teal/50 hover:bg-secondary/70 transition shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground group-hover:text-teal transition">
                          {place.title}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-teal transition shrink-0" />
                      </div>
                      {place.address && (
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                          {place.address}
                        </p>
                      )}
                      {place.snippet && place.snippet !== place.address && (
                        <p className="mt-1.5 text-[11px] text-foreground/80 italic line-clamp-2">
                          "{place.snippet}"
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-teal">
                      <span>View details & photos on Maps</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Extra source citations if present */}
          {grounding.sources && grounding.sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground font-medium">
                Grounding sources:
              </span>
              {grounding.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-teal hover:underline"
                >
                  <span>{src.title}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
