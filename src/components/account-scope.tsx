"use client";

import { useCallback, useEffect, useState } from "react";

import { Connection, connections as connectionsApi } from "@/lib/api";

const KEY = "al.account";
const EVENT = "al:account-changed";

/**
 * Which marketplace account the app is currently showing.
 *
 * Kept in localStorage rather than a URL param so the choice survives navigation without
 * appending an id to every link, and broadcast on a custom event so every mounted component
 * reacts to a change instead of only the one that made it.
 *
 * `null` means all accounts — a deliberate value, not "unset".
 */
export function useAccountScope() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Connection[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const read = () => {
      const stored = window.localStorage.getItem(KEY);
      if (!cancelled) setAccountId(stored && stored !== "all" ? stored : null);
    };

    void (async () => {
      read();
      try {
        const list = await connectionsApi.list();
        if (cancelled) return;
        setAccounts(list);
        // A stored id for an account that has since been disconnected would silently filter
        // everything to nothing, so fall back to all.
        const stored = window.localStorage.getItem(KEY);
        if (stored && stored !== "all" && !list.some((a) => a.id === stored)) {
          window.localStorage.removeItem(KEY);
          setAccountId(null);
        }
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    window.addEventListener(EVENT, read);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, read);
    };
  }, []);

  const select = useCallback((id: string | null) => {
    window.localStorage.setItem(KEY, id ?? "all");
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { accountId, accounts, select, ready };
}

export function AccountSwitcher() {
  const { accountId, accounts, select } = useAccountScope();

  // One account is not a choice; showing a picker would imply there's something to pick.
  if (accounts.length < 2) return null;

  const current = accounts.find((a) => a.id === accountId);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Showing data for</span>
      <select
        value={accountId ?? "all"}
        onChange={(e) => select(e.target.value === "all" ? null : e.target.value)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-accent"
      >
        <option value="all">All accounts ({accounts.length})</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.platform_username ?? a.platform}
          </option>
        ))}
      </select>
      {current && (
        <span className="hidden font-mono text-xs text-muted sm:inline">
          {current.proposals} bids
        </span>
      )}
    </label>
  );
}
