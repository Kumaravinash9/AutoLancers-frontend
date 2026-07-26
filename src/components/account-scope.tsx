"use client";

import { useCallback, useEffect, useState } from "react";

import { Connection, connections as connectionsApi } from "@/lib/api";

const EVENT = "al:account-changed";

/**
 * Which marketplace account the app is currently showing.
 *
 * The choice lives on the connection row in the database, not in the browser, so it survives a
 * new device and the API can honour it later without the client restating it on every request.
 * A custom event broadcasts changes so every mounted component re-reads rather than only the one
 * that made the change.
 *
 * `null` means all accounts — a deliberate value, not "unset".
 */
export function useAccountScope() {
  const [accounts, setAccounts] = useState<Connection[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const list = await connectionsApi.list();
        if (!cancelled) setAccounts(list);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void load();
    const onChange = () => void load();
    window.addEventListener(EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  const select = useCallback(async (id: string | null) => {
    // Apply the server's answer rather than assuming: it is the one that knows whether the id is
    // still connected.
    const updated = await connectionsApi.select(id);
    setAccounts(updated);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const accountId = accounts.find((a) => a.is_selected)?.id ?? null;
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
        onChange={(e) => void select(e.target.value === "all" ? null : e.target.value)}
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
