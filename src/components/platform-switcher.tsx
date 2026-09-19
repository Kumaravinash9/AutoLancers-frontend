"use client";

import { useEffect, useRef, useState } from "react";

import { useAccountScope } from "@/components/account-scope";
import { ChevronDownIcon, LayersIcon } from "@/components/nav-icons";

function platformLabel(platform: string): string {
  return platform.length <= 3 ? platform.toUpperCase() : platform[0].toUpperCase() + platform.slice(1);
}

/**
 * Which connected account the whole app is scoped to — same `useAccountScope()` state the
 * navbar profile menu's account list and the sidebar read, just promoted to its own top-bar
 * control since which account you're looking at is a more load-bearing choice than a date
 * range. One account is not a choice, so this stays hidden until there's a second one.
 */
export function PlatformSwitcher() {
  const { accountId, accounts, select } = useAccountScope();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (accounts.length < 2) return null;

  const current = accounts.find((a) => a.id === accountId);
  const currentLabel = current ? (current.platform_username ?? platformLabel(current.platform)) : "All accounts";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-sunken sm:px-3"
      >
        <LayersIcon className="text-muted" />
        <span className="hidden max-w-32 truncate sm:inline">{currentLabel}</span>
        <ChevronDownIcon className="hidden text-muted sm:block" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.4rem)] z-30 w-56 rounded-lg border border-border bg-surface p-1 shadow-(--shadow-lg)">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                void select(a.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-sunken ${
                a.id === accountId ? "font-medium text-accent" : ""
              }`}
            >
              <span className="truncate">{platformLabel(a.platform)} — {a.platform_username ?? a.platform}</span>
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              void select(null);
              setOpen(false);
            }}
            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-sunken ${
              accountId === null ? "font-medium text-accent" : ""
            }`}
          >
            All accounts ({accounts.length})
          </button>
        </div>
      )}
    </div>
  );
}
