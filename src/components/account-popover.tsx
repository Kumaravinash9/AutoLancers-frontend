"use client";

import { createPortal } from "react-dom";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

import { Account } from "@/lib/api";

/** "jane.doe@example.com" → "Jane Doe" — a cosmetic formatting of the real email, not a
 *  fabricated name field (the account schema has no separate display-name column). */
function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * The identity popover content — one definition, reused by both entry points (the sidebar's
 * bottom card and the topbar's avatar button), so there's exactly one menu, not two that could
 * drift apart. Identity and profile-completeness already live on the trigger itself and on the
 * Account nav item, so this menu holds only the one thing that isn't available anywhere else:
 * signing out.
 */
function PopoverBody({ onSignOut, close }: { onSignOut: () => void; close: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        close();
        onSignOut();
      }}
      className="block w-full rounded px-2 py-1.5 text-left text-sm font-medium text-danger hover:bg-danger/10"
    >
      Sign out
    </button>
  );
}

/** Shared open/position/outside-click plumbing for a portal-rendered popup anchored to a
 *  trigger button. `placement` controls which side of the trigger the popup opens toward. */
function usePopoverPosition(placement: "up" | "down", align: "left" | "right") {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vertical =
        placement === "up" ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 };
      const horizontal = align === "left" ? { left: rect.left } : { right: window.innerWidth - rect.right };
      setCoords({ ...vertical, ...horizontal });
    }
    setOpen((o) => !o);
  }

  return { open, setOpen, coords, triggerRef, popupRef, toggle };
}

/** Bottom-of-sidebar entry point: the full card (avatar, name, role), popup opens upward. */
export function SidebarProfileCard({
  account,
  collapsed,
  onSignOut,
}: {
  account: Account | null;
  collapsed: boolean;
  onSignOut: () => void;
}) {
  const { open, setOpen, coords, triggerRef, popupRef, toggle } = usePopoverPosition("up", "left");

  if (!account) return null;
  const name = nameFromEmail(account.email);
  const initials = initialsOf(name);

  return (
    <div className="mt-4">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        title={collapsed ? name : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface p-2 text-left transition-colors hover:bg-sunken ${
          collapsed ? "justify-center" : ""
        }`}
        aria-label="Account menu — sign out"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">
          {initials}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block truncate text-xs text-muted">{account.role}</span>
            </span>
            <ChevronIcon className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open &&
        coords &&
        createPortal(
          <div ref={popupRef} style={coords} className="fixed z-50 w-56 rounded-lg border border-border bg-sunken p-1">
            <PopoverBody onSignOut={onSignOut} close={() => setOpen(false)} />
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Topbar entry point: just the avatar circle, popup opens downward, right-aligned under it. */
export function TopbarAccountButton({ account, onSignOut }: { account: Account | null; onSignOut: () => void }) {
  const { open, setOpen, coords, triggerRef, popupRef, toggle } = usePopoverPosition("down", "right");

  if (!account) return null;
  const name = nameFromEmail(account.email);
  const initials = initialsOf(name);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Account menu — sign out"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white ring-2 ring-transparent transition-shadow hover:ring-accent-soft"
      >
        {initials}
      </button>

      {open &&
        coords &&
        createPortal(
          <div ref={popupRef} style={coords} className="fixed z-50 w-56 rounded-lg border border-border bg-sunken p-1">
            <PopoverBody onSignOut={onSignOut} close={() => setOpen(false)} />
          </div>,
          document.body,
        )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
