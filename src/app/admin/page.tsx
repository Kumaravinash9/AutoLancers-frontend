"use client";

import { useEffect, useState } from "react";

import { Card, Empty, ErrorNote, Page } from "@/components/ui";
import { admin, AdminOverview, AdminUser, CycleRun, demo, DemoRequest, formatAge } from "@/lib/api";

/**
 * Operator view.
 *
 * The gate here is cosmetic — the backend returns 404 to anyone who isn't an admin, so this page
 * simply renders whatever it is allowed to fetch.
 */
export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [cycles, setCycles] = useState<CycleRun[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [demos, setDemos] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [o, c, u, d] = await Promise.all([
          admin.overview(),
          admin.cycles(15),
          admin.users(),
          demo.list(),
        ]);
        if (!cancelled) {
          setOverview(o);
          setCycles(c);
          setUsers(u);
          setDemos(d);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Page><Empty>Loading…</Empty></Page>;

  if (error || !overview) {
    return (
      <Page className="space-y-4">
        <h1 className="font-display text-xl font-semibold">Admin</h1>
        <ErrorNote>
          {error ?? "Unavailable."} You need to be signed in as an administrator.
        </ErrorNote>
      </Page>
    );
  }

  const stalled = overview.cycles_24h === 0;

  return (
    <Page className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted">Platform health, pipeline runs, and accounts.</p>
      </div>

      {/* Surface the thing that would otherwise be silent: a poller that stopped. */}
      {stalled && (
        <ErrorNote>
          No poll cycles in the last 24 hours. Either the scheduler is off
          (<code>SCHEDULER_ENABLED</code>) or the backend has not been running.
        </ErrorNote>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Accounts" value={overview.total_users} note={`${overview.active_users} active`} />
        <Stat
          label="Connected"
          value={overview.connected_accounts}
          note="marketplace links"
        />
        <Stat
          label="Jobs seen"
          value={overview.total_jobs}
          note={`${overview.matched_jobs} cleared the bar`}
        />
        <Stat
          label="Drafts written"
          value={overview.drafted_jobs}
          note={`${overview.bids_placed} bids placed`}
        />
        <Stat
          label="Cycles (24h)"
          value={overview.cycles_24h}
          note={`${overview.failed_cycles_24h} failed`}
          alert={overview.failed_cycles_24h > 0}
        />
        <Stat
          label="Draft failures (24h)"
          value={overview.draft_failures_24h}
          note="LLM errors, retried next cycle"
          alert={overview.draft_failures_24h > 0}
        />
        <Stat
          label="Tokens in"
          value={overview.proposal_input_tokens.toLocaleString()}
          note="prompt, all time"
        />
        <Stat
          label="Tokens out"
          value={overview.proposal_output_tokens.toLocaleString()}
          note="includes model thinking"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
          Recent cycles
        </h2>
        {cycles.length === 0 ? (
          <Empty>No cycles recorded yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[0.7rem] uppercase tracking-wider text-muted">
                  <th className="p-2.5 font-normal">When</th>
                  <th className="p-2.5 font-normal">Trigger</th>
                  <th className="p-2.5 text-right font-normal">Fetched</th>
                  <th className="p-2.5 text-right font-normal">New</th>
                  <th className="p-2.5 text-right font-normal">Drafted</th>
                  <th className="p-2.5 text-right font-normal">Failures</th>
                  <th className="p-2.5 text-right font-normal">Took</th>
                  <th className="p-2.5 font-normal">Result</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap p-2.5 text-muted">
                      {new Date(c.started_at).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-muted">{c.trigger}</td>
                    <td className="p-2.5 text-right tabular-nums">{c.fetched}</td>
                    <td className="p-2.5 text-right tabular-nums">{c.created}</td>
                    <td className="p-2.5 text-right tabular-nums">{c.drafted}</td>
                    <td
                      className={`p-2.5 text-right tabular-nums ${c.draft_failures ? "text-warn" : ""}`}
                    >
                      {c.draft_failures}
                    </td>
                    <td className="p-2.5 text-right tabular-nums text-muted">{c.duration_ms}ms</td>
                    <td className="max-w-[16rem] truncate p-2.5">
                      {c.error ? (
                        <span className="text-warn">{c.error}</span>
                      ) : (
                        <span className="text-muted">
                          ok{c.authenticated ? "" : " · unauthenticated"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
          Demo requests · {demos.length}
        </h2>
        {demos.length === 0 ? (
          <Empty>Nobody has asked for a walkthrough yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[0.7rem] uppercase tracking-wider text-muted">
                  <th className="p-2.5 font-normal">Who</th>
                  <th className="p-2.5 font-normal">Bids on</th>
                  <th className="p-2.5 font-normal">Wants to see</th>
                  <th className="p-2.5 font-normal">Asked</th>
                </tr>
              </thead>
              <tbody>
                {demos.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 align-top">
                    <td className="p-2.5">
                      <span className="block">{d.name}</span>
                      <a
                        href={`mailto:${d.email}`}
                        className="font-mono text-xs text-muted hover:text-accent"
                      >
                        {d.email}
                      </a>
                    </td>
                    <td className="p-2.5 text-muted">{d.marketplace ?? "not bidding yet"}</td>
                    <td className="max-w-md p-2.5 text-muted">{d.note ?? "—"}</td>
                    <td className="whitespace-nowrap p-2.5 font-mono text-xs text-muted">
                      {formatAge(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Accounts</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[0.7rem] uppercase tracking-wider text-muted">
                <th className="p-2.5 font-normal">Email</th>
                <th className="p-2.5 font-normal">Role</th>
                <th className="p-2.5 font-normal">Marketplace</th>
                <th className="p-2.5 text-right font-normal">Jobs</th>
                <th className="p-2.5 font-normal">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-2.5">
                    {u.email}
                    {!u.is_active && <span className="ml-2 text-xs text-warn">deactivated</span>}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                        u.role === "admin"
                          ? "bg-accent-soft text-accent"
                          : "bg-sunken text-muted"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2.5 text-muted">
                    {u.connected ? `connected · ${u.connection_scope ?? "no scope"}` : "not connected"}
                  </td>
                  <td className="p-2.5 text-right tabular-nums">{u.job_count}</td>
                  <td className="p-2.5 text-muted">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}

function Stat({
  label,
  value,
  note,
  alert = false,
}: {
  label: string;
  value: number | string;
  note?: string;
  alert?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <span
        className={`font-display text-2xl font-semibold tabular-nums ${alert ? "text-warn" : ""}`}
      >
        {value}
      </span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </Card>
  );
}
