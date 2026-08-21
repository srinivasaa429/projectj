import { useEffect, useState } from "react";
import { Radio, Train, Bus, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildStopRows,
  buildTimeline,
  fmt12,
  humanizeLate,
  simulatedDelay,
  toMinutes,
  type LiveSegment,
} from "@/lib/live-schedule";

export function RunningStatusDialog({ segment }: { segment: LiveSegment }) {
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
  const baseDelay = simulatedDelay(seed);
  const timeline = buildTimeline(segment, dep, arr);
  const rows = buildStopRows(segment, timeline, baseDelay);

  const isTrain = segment.mode.toLowerCase().includes("train");
  const Icon = isTrain ? Train : Bus;

  // Index of the stop the service is currently at / heading to.
  const currentIdx = nowMin === null ? -1 : rows.findIndex((r) => r.actualDep >= nowMin);

  const title =
    [segment.serviceName, segment.serviceNumber && `(${segment.serviceNumber})`]
      .filter(Boolean)
      .join(" ") || `${segment.from} → ${segment.to}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Icon className="h-3.5 w-3.5" />
          Live running status
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-secondary/60 px-4 py-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {segment.from} → {segment.to}
            </span>
            {segment.operator && <span>· {segment.operator}</span>}
            <span className="inline-flex items-center gap-1">
              <Radio className="h-3 w-3" /> simulated live data
            </span>
          </div>
          <div className="pt-1">
            {baseDelay > 0 ? (
              <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                Running {humanizeLate(baseDelay)}
              </span>
            ) : (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                On time
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-2">
          <ol className="relative border-l-2 border-dashed border-border pl-4">
            {rows.map((r, i) => {
              const passed = nowMin !== null && i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <li key={`${r.name}-${i}`} className="relative pb-2 last:pb-0">
                  <span
                    className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full border-2 ${
                      isCurrent
                        ? "border-primary bg-primary"
                        : passed
                          ? "border-primary bg-background"
                          : "border-border bg-background"
                    }`}
                  />
                  <div
                    className={`rounded-lg border px-3 py-2 ${
                      isCurrent
                        ? "border-primary/40 bg-primary/5"
                        : passed
                          ? "border-border bg-secondary/40"
                          : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {r.name} <span className="text-muted-foreground">({r.code})</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          PF {r.platform}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            r.delay > 0 ? "text-destructive" : "text-primary"
                          }`}
                        >
                          {r.delay > 0 ? humanizeLate(r.delay) : "On time"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1.5 flex justify-between gap-3 text-xs tabular-nums">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Arrival
                        </div>
                        <div className="font-semibold text-foreground">
                          {i === 0 ? "—" : fmt12(r.actualArr)}
                        </div>
                        {i !== 0 && r.delay > 0 && (
                          <div className="text-[10px] text-muted-foreground line-through">
                            {fmt12(r.schedArr)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Departure
                        </div>
                        <div className="font-semibold text-foreground">
                          {i === rows.length - 1 ? "—" : fmt12(r.actualDep)}
                        </div>
                        {i !== rows.length - 1 && r.delay > 0 && (
                          <div className="text-[10px] text-muted-foreground line-through">
                            {fmt12(r.schedDep)}
                          </div>
                        )}
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                        </span>
                        Current position
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="px-1 py-2 text-[10px] text-muted-foreground">
            <Info className="mr-1 inline h-3 w-3" />
            Times are simulated from the published schedule, not a live GPS feed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
