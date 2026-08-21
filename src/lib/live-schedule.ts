export type LiveStop = { name: string; time?: string };

export type LiveSegment = {
  mode: string;
  from: string;
  to: string;
  departTime?: string;
  arriveTime?: string;
  serviceName?: string;
  serviceNumber?: string;
  operator?: string;
  stops?: LiveStop[];
};

/** Simulated live tracking. Positions are derived from the published schedule
 *  and the current clock — not a real GPS feed. */
export function supportsLiveTracking(mode: string) {
  const m = mode.toLowerCase();
  return m.includes("train") || m.includes("bus") || m.includes("metro");
}

export function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function fmt(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

/** 12h clock like the reference running-status screens (e.g. "01:19 PM"). */
export function fmt12(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")} ${suffix}`;
}

export function humanize(mins: number): string {
  if (mins <= 0) return "now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function humanizeLate(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return m > 0 ? `${h}hr ${m}min Late` : `${h}hr Late`;
  return `${m}min Late`;
}

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  return h;
}

/** Stable pseudo-random delay per service so it doesn't jump on every render. */
export function simulatedDelay(seed: string): number {
  const buckets = [0, 0, 0, 5, 8, 12, 15, 22];
  return buckets[hash(seed) % buckets.length];
}

export type TimelineStop = { name: string; sched: number };

export function buildTimeline(seg: LiveSegment, dep: number, arr: number): TimelineStop[] {
  const mid = (seg.stops ?? [])
    .map((s) => ({ name: s.name, sched: toMinutes(s.time) }))
    .filter((s): s is { name: string; sched: number } => s.sched !== null);
  const total = arr >= dep ? arr - dep : arr + 1440 - dep;
  const normalized = mid
    .map((s) => {
      const rel = s.sched >= dep ? s.sched - dep : s.sched + 1440 - dep;
      return { name: s.name, sched: dep + rel, rel };
    })
    .filter((s) => s.rel > 0 && s.rel < total)
    .sort((a, b) => a.rel - b.rel)
    .map(({ name, sched }) => ({ name, sched }));
  return [{ name: seg.from, sched: dep }, ...normalized, { name: seg.to, sched: dep + total }];
}

export type StopRow = {
  name: string;
  code: string;
  platform: number;
  schedArr: number;
  schedDep: number;
  actualArr: number;
  actualDep: number;
  delay: number;
};

function stationCode(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z ]/g, "");
  const words = letters.split(/\s+/).filter(Boolean);
  if (words.length >= 3)
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("");
  return (words[0] ?? "STN").slice(0, 3);
}

/** Per-stop scheduled/actual times with a drifting simulated delay. */
export function buildStopRows(
  seg: LiveSegment,
  timeline: TimelineStop[],
  baseDelay: number,
): StopRow[] {
  const seed = `${seg.serviceName ?? ""}${seg.serviceNumber ?? ""}${seg.from}${seg.to}`;
  return timeline.map((stop, i) => {
    const jitter = i === 0 ? 0 : (hash(`${seed}${stop.name}${i}`) % 13) - 4;
    const delay = Math.max(0, baseDelay + (i === 0 ? 0 : jitter));
    const dwell = i === 0 || i === timeline.length - 1 ? 0 : 2 + (hash(`${seed}d${i}`) % 4);
    return {
      name: stop.name,
      code: stationCode(stop.name),
      platform: 1 + (hash(`${seed}p${i}`) % 5),
      schedArr: stop.sched,
      schedDep: stop.sched + dwell,
      actualArr: stop.sched + delay,
      actualDep: stop.sched + dwell + delay,
      delay,
    };
  });
}
