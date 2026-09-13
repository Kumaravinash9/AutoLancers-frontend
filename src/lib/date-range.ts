"use client";

import { useEffect, useState } from "react";

export interface DateRange {
  /** null means "all time" — no lower bound. */
  start: Date | null;
  end: Date;
  label: string;
}

export type PresetKey = "today" | "7d" | "30d" | "3m" | "all";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "3m", label: "Last 3 months" },
  { key: "all", label: "All time" },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
export function presetRange(key: PresetKey, now: Date = new Date()): DateRange {
  const end = endOfDay(now);
  const label = PRESETS.find((p) => p.key === key)?.label ?? "Custom";
  switch (key) {
    case "today":
      return { start: startOfDay(now), end, label };
    case "7d":
      return { start: startOfDay(addDays(now, -6)), end, label };
    case "30d":
      return { start: startOfDay(addDays(now, -29)), end, label };
    case "3m":
      return { start: startOfDay(addMonths(now, -3)), end, label };
    case "all":
      return { start: null, end, label };
  }
}

export function customRange(start: Date, end: Date): DateRange {
  const [a, b] = start <= end ? [start, end] : [end, start];
  return { start: startOfDay(a), end: endOfDay(b), label: "Custom" };
}

/** True when `iso` falls inside the range — used to filter already-fetched lists client-side.
 *  There's no date-range parameter on any backend endpoint today, so this is the only place a
 *  selected range actually does something. */
export function withinRange(iso: string | null, range: DateRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (range.start && t < range.start.getTime()) return false;
  return t <= range.end.getTime();
}

const EVENT = "al:date-range-changed";
let current: DateRange = presetRange("30d");

/** Same shared-state shape as useAccountScope: one module-level value, a custom window event so
 *  every mounted consumer re-reads on change, no Context/state library. */
export function useDateRange() {
  const [range, setRangeState] = useState<DateRange>(current);

  useEffect(() => {
    const onChange = () => setRangeState(current);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  function setRange(next: DateRange) {
    current = next;
    setRangeState(next);
    window.dispatchEvent(new Event(EVENT));
  }

  return { range, setRange };
}
