import { useEffect, useState } from "react";
import { MapPin, Radio, Train, Bus } from "lucide-react";
import {
  buildTimeline,
  fmt,
  humanize,
  simulatedDelay,
  toMinutes,
  type LiveSegment,
  type LiveStop,
} from "@/lib/live-schedule";
import { RunningStatusDialog } from "@/components/running-status";

export { supportsLiveTracking } from "@/lib/live-schedule";
export type { LiveSegment, LiveStop };

export function LiveTrack({ segment }: { segment: LiveSegment }) {
  const [nowMin, setNowMin] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const dep = toMinutes(segment.departTime);
  const arr = toMinutes(segment.arriveTime);
  if (dep === null || arr === null) return null;

  const seed = `${segment.serviceName ?? ""}${segment.serviceNumber ?? ""}${segment.from}${segment.to}`;
  const delay = simulatedDelay(seed);
  const timeline = buildTimeline(segment, dep, arr);
  const depActual = dep + delay;
  const arrActual = timeline[timeline.length - 1].sched + delay;
  const total = arrActual - depActual;

  const isTrain = segment.mode.toLowerCase().includes("train");
  const Icon = isTrain ? Train : Bus;

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Live tracking
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Radio className="h-3 w-3" /> simulated
      </span>
    </div>
  );

  if (nowMin === null) {
    return (
      <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
        {header}
        <div className="mt-1.5 text-xs text-muted-foreground">Locating service…</div>
      </div>
    );
  }

  // Elapsed since actual departure, wrapping across midnight.
  const rawElapsed = nowMin >= depActual ? nowMin - depActual : nowMin + 1440 - depActual;
  const notYetDeparted = rawElapsed > total + 120; // clock is before departure today
  const elapsed = notYetDeparted ? 0 : Math.min(Math.max(rawElapsed, 0), total);
  const progress = total > 0 ? Math.round((elapsed / total) * 100) : 0;

  let statusLine: string;
  let positionLine: string;

  if (notYetDeparted) {
    const untilDep = depActual >= nowMin ? depActual - nowMin : depActual + 1440 - nowMin;
    statusLine = `Departs in ${humanize(untilDep)}`;
    positionLine = `At ${segment.from} · scheduled ${fmt(dep)}`;
  } else if (rawElapsed >= total) {
    statusLine = "Journey completed";
    positionLine = `Arrived ${segment.to} at ${fmt(arrActual)}`;
  } else {
    const nextIdx = timeline.findIndex(
      (s) => s.sched + delay > nowMin || s.sched + delay + 1440 > nowMin + 1440,
    );
    const next = timeline[Math.max(nextIdx, 1)] ?? timeline[timeline.length - 1];
    const prev = timeline[Math.max(timeline.indexOf(next) - 1, 0)];
    const etaNext = next.sched + delay - nowMin;
    statusLine = `Next stop ${next.name} · ETA ${fmt(next.sched + delay)} (${humanize(etaNext)})`;
    positionLine = `Between ${prev.name} and ${next.name}`;
  }

  const arrivalEta =
    nowMin >= depActual && rawElapsed < total
      ? `Reaches ${segment.to} at ${fmt(arrActual)} · ${humanize(total - elapsed)} to go`
      : `Scheduled arrival ${fmt(arr)}${delay ? ` · running ${delay}m late` : ""}`;

  return (
    <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
      {header}

      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {statusLine}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {positionLine}
      </div>

      <div className="mt-2.5">
        <div className="relative h-1.5 rounded-full bg-border">
          <div
            className="absolute left-0 top-0 h-1.5 rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background transition-[left] duration-700"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
          <span>
            {fmt(dep)} {segment.from}
          </span>
          <span>{progress}%</span>
          <span>
            {segment.to} {fmt(arr)}
          </span>
        </div>
      </div>

      <RunningStatusDialog segment={segment} />

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-md bg-background px-1.5 py-0.5 font-medium text-foreground">
          {arrivalEta}
        </span>
        {delay > 0 ? (
          <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 font-semibold text-destructive">
            +{delay}m delay
          </span>
        ) : (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
            On time
          </span>
        )}
      </div>
    </div>
  );
}
