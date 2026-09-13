"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { CalendarIcon, ChevronDownIcon } from "@/components/nav-icons";
import { customRange, DateRange, PRESETS, presetRange, PresetKey, useDateRange } from "@/lib/date-range";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function sameDay(a: Date, b: Date | null): boolean {
  if (!b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmt(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function parse(text: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** One month's grid — blank cells pad the first week, no adjacent-month days shown. */
function MonthGrid({
  month,
  start,
  end,
  onPick,
}: {
  month: Date;
  start: Date | null;
  end: Date | null;
  onPick: (d: Date) => void;
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const leading = (new Date(year, m, 1).getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, m, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-64 shrink-0">
      <p className="mb-2 text-sm font-semibold">{monthLabel(month)}</p>
      <div className="grid grid-cols-7 gap-x-1 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-xs text-muted">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const isStart = sameDay(d, start);
          const isEnd = sameDay(d, end);
          const inRange = start && end && d > start && d < end;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(d)}
              className={`grid h-8 w-8 place-items-center rounded-full text-sm transition-colors ${
                isStart || isEnd
                  ? "bg-accent font-semibold text-white"
                  : inRange
                    ? "bg-accent-soft text-accent"
                    : "hover:bg-sunken"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * No backend endpoint accepts a date-range parameter, so this doesn't refetch anything — it
 * sets a shared range (see lib/date-range.ts) that the dashboard's real-data cards filter
 * against client-side on their existing timestamps. Static/demo cards are unaffected.
 */
export function DateRangePicker() {
  const { range, setRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<Date | null>(range.start);
  const [draftEnd, setDraftEnd] = useState<Date>(range.end);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(new Date(range.end.getFullYear(), range.end.getMonth(), 1));
  const [startText, setStartText] = useState(range.start ? fmt(range.start) : "");
  const [endText, setEndText] = useState(fmt(range.end));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function openPicker() {
    setDraftStart(range.start);
    setDraftEnd(range.end);
    setStartText(range.start ? fmt(range.start) : "");
    setEndText(fmt(range.end));
    setViewMonth(new Date(range.end.getFullYear(), range.end.getMonth(), 1));
    setPickingEnd(false);
    setOpen(true);
  }

  function applyPreset(key: PresetKey) {
    const r = presetRange(key);
    setDraftStart(r.start);
    setDraftEnd(r.end);
    setStartText(r.start ? fmt(r.start) : "");
    setEndText(fmt(r.end));
    setViewMonth(new Date(r.end.getFullYear(), r.end.getMonth(), 1));
    setPickingEnd(false);
  }

  function pickDay(d: Date) {
    if (!pickingEnd || !draftStart || d < draftStart) {
      setDraftStart(d);
      setDraftEnd(d);
      setStartText(fmt(d));
      setEndText(fmt(d));
      setPickingEnd(true);
    } else {
      setDraftEnd(d);
      setEndText(fmt(d));
      setPickingEnd(false);
    }
  }

  function apply() {
    const finalRange: DateRange = draftStart ? customRange(draftStart, draftEnd) : { start: null, end: draftEnd, label: "All time" };
    // A preset's own exact range still reads as that preset's label, not "Custom".
    const matchingPreset = PRESETS.find((p) => {
      const r = presetRange(p.key);
      return (
        (r.start === null ? draftStart === null : draftStart && sameDay(r.start, draftStart)) &&
        sameDay(r.end, draftEnd)
      );
    });
    setRange(matchingPreset ? presetRange(matchingPreset.key) : finalRange);
    setOpen(false);
  }

  const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-sunken sm:px-3"
      >
        <CalendarIcon className="text-muted" />
        <span className="hidden sm:inline">{range.label}</span>
        <ChevronDownIcon className="hidden text-muted sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.4rem)] z-30 flex overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex w-40 shrink-0 flex-col gap-0.5 border-r border-border p-2">
            {(() => {
              // Only the first matching preset (in list order) is highlighted — a same-length
              // custom range can coincidentally equal more than one preset's dates.
              const activeKey = PRESETS.find((p) => {
                const r = presetRange(p.key);
                return (
                  sameDay(r.end, draftEnd) &&
                  (r.start === null ? draftStart === null : !!draftStart && sameDay(r.start, draftStart))
                );
              })?.key;
              return PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    p.key === activeKey ? "bg-accent font-medium text-white" : "text-foreground hover:bg-sunken"
                  }`}
                >
                  {p.label}
                </button>
              ));
            })()}
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted">Start</span>
                <input
                  value={startText}
                  onChange={(e) => setStartText(e.target.value)}
                  onBlur={() => {
                    const d = parse(startText);
                    if (d) {
                      setDraftStart(d);
                      if (draftEnd < d) setDraftEnd(d);
                    } else {
                      setStartText(draftStart ? fmt(draftStart) : "");
                    }
                  }}
                  placeholder="dd/mm/yyyy"
                  className="w-32 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted">End</span>
                <input
                  value={endText}
                  onChange={(e) => setEndText(e.target.value)}
                  onBlur={() => {
                    const d = parse(endText);
                    if (d) {
                      setDraftEnd(d);
                      if (draftStart && d < draftStart) setDraftStart(d);
                    } else {
                      setEndText(fmt(draftEnd));
                    }
                  }}
                  placeholder="dd/mm/yyyy"
                  className="w-32 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="flex items-start gap-6">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted hover:bg-sunken"
                aria-label="Previous month"
              >
                ‹
              </button>
              <MonthGrid month={viewMonth} start={draftStart} end={draftEnd} onPick={pickDay} />
              <MonthGrid month={nextMonth} start={draftStart} end={draftEnd} onPick={pickDay} />
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted hover:bg-sunken"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
