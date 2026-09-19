"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  Download,
  Filter,
  Search,
  TrendingUp,
} from "lucide-react";

import { useAccountScope } from "@/components/account-scope";
import { DashCard, StaggerIn } from "@/components/app-ui";
import { DateRangePicker } from "@/components/date-range-picker";
import { Empty, ErrorNote, Page } from "@/components/ui";
import { useDateRange, withinRange } from "@/lib/date-range";
import { isConnectionError, proposals, ProposalRow } from "@/lib/api";
import {
  DEMO_EARNINGS_BY_PLATFORM,
  DEMO_EARNINGS_YOY_CHANGE,
  DEMO_PROPOSALS,
  DEMO_TRANSACTIONS,
  FinanceTransaction,
} from "@/lib/demo-data";

const STATUS_TONE: Record<FinanceTransaction["status"], string> = {
  Paid: "bg-good/15 text-good",
  Processing: "bg-warn/15 text-warn",
  Pending: "bg-accent-soft text-accent",
};

const PLATFORM_LABEL: Record<FinanceTransaction["platform"], string> = {
  upwork: "Upwork",
  freelancer: "Freelancer",
  direct: "Direct",
};

const PLATFORM_DOT: Record<FinanceTransaction["platform"], string> = {
  upwork: "bg-chart-scored",
  freelancer: "bg-figure",
  direct: "bg-muted",
};

/** Illustrative marketplace-fee assumption (10%, applied to every real won proposal) used only
 *  to derive "Net revenue" — there's no real fee/payout ledger to read this from. */
const MARKETPLACE_FEE_RATE = 0.1;

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(rows: FinanceTransaction[]) {
  const header = ["Date", "Platform", "Client", "Project", "Amount", "Currency", "Status"];
  const lines = rows.map((r) =>
    [
      new Date(r.date).toLocaleDateString(),
      PLATFORM_LABEL[r.platform],
      r.client,
      r.project,
      r.amount,
      r.currency,
      r.status,
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `autolancer-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Real numbers: total earned, avg project value, and net revenue all come from your own
 * ACCEPTED proposals (the same source Proposals and Projects already use), filtered by the
 * shared date-range control. Everything transaction-shaped — the platform chart, upcoming
 * payouts, top clients, and the recent-transactions table — has no payments integration behind
 * it yet, so it's the illustrative DEMO_TRANSACTIONS set, clearly documented in lib/demo-data.ts.
 */
export default function FinancePage() {
  const { accountId } = useAccountScope();
  const { range } = useDateRange();
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FinanceTransaction["status"]>("all");
  const [showAllTxns, setShowAllTxns] = useState(false);
  // Lazy initializer only runs once (React explicitly allows impurity there), unlike calling
  // Date.now() directly in the render body on every re-render.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await proposals.list(accountId);
        if (!cancelled) setRows(list);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setRows(DEMO_PROPOSALS);
        } else {
          setError(err instanceof Error ? err.message : "Could not load finance data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const won = useMemo(
    () => rows.filter((r) => r.status === "ACCEPTED" && withinRange(r.submitted_at, range)),
    [rows, range],
  );
  const totalEarned = won.reduce((sum, r) => sum + (r.bid_amount ?? 0), 0);
  const avgProjectValue = won.length > 0 ? totalEarned / won.length : 0;
  const netRevenue = totalEarned * (1 - MARKETPLACE_FEE_RATE);

  const past = useMemo(
    () => [...DEMO_TRANSACTIONS].filter((t) => new Date(t.date).getTime() <= now).sort((a, b) => b.date.localeCompare(a.date)),
    [now],
  );
  const upcoming = useMemo(
    () => [...DEMO_TRANSACTIONS].filter((t) => new Date(t.date).getTime() > now).sort((a, b) => a.date.localeCompare(b.date)),
    [now],
  );
  const pendingTotal = DEMO_TRANSACTIONS.filter((t) => t.status !== "Paid").reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = DEMO_TRANSACTIONS.filter((t) => t.status !== "Paid").length;

  const topClients = useMemo(() => {
    const byClient = new Map<string, { amount: number; contracts: number }>();
    for (const t of DEMO_TRANSACTIONS) {
      const entry = byClient.get(t.client) ?? { amount: 0, contracts: 0 };
      entry.amount += t.amount;
      entry.contracts += 1;
      byClient.set(t.client, entry);
    }
    return Array.from(byClient.entries())
      .map(([client, v]) => ({ client, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, []);

  const filteredPast = useMemo(() => {
    const q = search.trim().toLowerCase();
    return past.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.client.toLowerCase().includes(q) || t.project.toLowerCase().includes(q);
    });
  }, [past, search, statusFilter]);
  const visiblePast = showAllTxns ? filteredPast : filteredPast.slice(0, 5);

  if (error) return <Page><ErrorNote>{error}</ErrorNote></Page>;

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Finance Overview</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <button
            type="button"
            onClick={() => exportCsv(filteredPast)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-sunken"
          >
            <Download size={14} aria-hidden="true" />
            Export Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <StaggerIn index={0}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashCard className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Total earned</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{money(totalEarned)}</p>
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-good/15 px-2 py-0.5 font-semibold text-good">
                  <TrendingUp size={11} aria-hidden="true" />+{DEMO_EARNINGS_YOY_CHANGE}%
                </span>
                <span className="text-muted">vs previous period</span>
              </p>
            </DashCard>

            <DashCard className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Pending payouts</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{money(pendingTotal)}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <CalendarClock size={13} aria-hidden="true" />
                {pendingCount} contract{pendingCount === 1 ? "" : "s"} awaiting payment
              </p>
            </DashCard>

            <DashCard className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Avg. project value</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {won.length > 0 ? money(avgProjectValue) : "—"}
              </p>
              <p className="mt-3 text-xs text-muted">Based on {range.label.toLowerCase()}</p>
            </DashCard>

            <DashCard tint className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Net revenue</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {won.length > 0 ? money(netRevenue) : "—"}
              </p>
              <p
                className="mt-3 flex items-center gap-1.5 text-xs text-good"
                title={`Estimated after a ${Math.round(MARKETPLACE_FEE_RATE * 100)}% marketplace fee — illustrative, not a real ledger.`}
              >
                <ArrowUpRight size={13} aria-hidden="true" />
                Healthy margins maintained
              </p>
            </DashCard>
          </div>
        </StaggerIn>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <StaggerIn index={1}>
          <PlatformEarningsChart />
        </StaggerIn>
        <StaggerIn index={1}>
          <UpcomingPayouts items={upcoming} />
        </StaggerIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <StaggerIn index={2}>
          <TransactionsTable
            items={visiblePast}
            total={filteredPast.length}
            search={search}
            onSearch={setSearch}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            showingAll={showAllTxns}
            onToggleAll={() => setShowAllTxns((v) => !v)}
          />
        </StaggerIn>
        <StaggerIn index={2}>
          <TopClients clients={topClients} />
        </StaggerIn>
      </div>
    </Page>
  );
}

/** Grouped bar chart, one hue per platform. Colors are the app's existing chart-scored/
 *  chart-drafted tokens (already validated for CVD-safe categorical separation elsewhere) —
 *  no new palette introduced. A visually-hidden table carries the same values for screen
 *  readers, since color + bar height alone isn't accessible. */
function PlatformEarningsChart() {
  const data = DEMO_EARNINGS_BY_PLATFORM;
  const max = Math.max(...data.map((d) => Math.max(d.upwork, d.freelancer)));

  return (
    <DashCard className="p-5" allowOverflow>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Earnings by Platform</h2>
          <p className="mt-0.5 text-sm text-muted">Aggregated revenue streams, illustrative trend</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-scored" aria-hidden="true" />
            Upwork
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-figure" aria-hidden="true" />
            Freelancer
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-48 items-end justify-between gap-3">
        {data.map((d, i) => (
          <div key={d.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <ChartBar
                heightPct={Math.max(4, (d.upwork / max) * 100)}
                colorClass="bg-chart-scored"
                label={`Upwork · ${d.month}: ${money(d.upwork)}`}
                align={i === 0 ? "start" : "center"}
              />
              <ChartBar
                heightPct={Math.max(4, (d.freelancer / max) * 100)}
                colorClass="bg-figure"
                label={`Freelancer · ${d.month}: ${money(d.freelancer)}`}
                align={i === data.length - 1 ? "end" : "center"}
              />
            </div>
            <span className="font-mono text-[0.65rem] uppercase text-muted">{d.month}</span>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Monthly earnings by platform</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Upwork</th>
            <th>Freelancer</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{money(d.upwork)}</td>
              <td>{money(d.freelancer)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashCard>
  );
}

/** A single bar with a real hover tooltip (not the browser's delayed native `title`) — visible
 *  on mouse hover and on keyboard focus, positioned above whichever bar it's attached to via
 *  `bottom-full` on its own relatively-positioned wrapper, so it tracks each bar's height
 *  without any position math. `align` keeps the tooltip growing inward on the chart's two
 *  outermost bars instead of centering — DashCard clips overflow, so a centered tooltip on the
 *  first/last bar would otherwise get cropped against the card edge. */
function ChartBar({
  heightPct,
  colorClass,
  label,
  align = "center",
}: {
  heightPct: number;
  colorClass: string;
  label: string;
  align?: "start" | "center" | "end";
}) {
  const posClass =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <div className="group/bar relative flex w-full max-w-6 justify-center" style={{ height: `${heightPct}%` }}>
      <div className={`h-full w-full rounded-t-md ${colorClass}`} />
      <div
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max whitespace-nowrap rounded-md bg-foreground px-2 py-1 font-mono text-xs font-medium text-white opacity-0 shadow-(--shadow-md) transition-opacity duration-150 group-hover/bar:opacity-100 group-focus-within/bar:opacity-100 ${posClass}`}
      >
        {label}
      </div>
      <button type="button" className="absolute inset-0 cursor-default" aria-label={label} />
    </div>
  );
}

function UpcomingPayouts({ items }: { items: FinanceTransaction[] }) {
  return (
    <DashCard className="p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight">Upcoming Payouts</h2>
      {items.length === 0 ? (
        <div className="mt-3">
          <Empty>Nothing scheduled.</Empty>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((t) => (
            <li key={t.id} className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <CalendarClock size={16} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="truncate text-xs text-muted">
                  {PLATFORM_LABEL[t.platform]} • {t.project}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-accent">
                  {t.amount.toLocaleString(undefined, { style: "currency", currency: t.currency })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  );
}

function TopClients({ clients }: { clients: { client: string; amount: number; contracts: number }[] }) {
  return (
    <DashCard className="p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight">Top Clients</h2>
      {clients.length === 0 ? (
        <div className="mt-3">
          <Empty>No client history yet.</Empty>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {clients.map((c) => (
            <li key={c.client} className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sunken font-display text-xs font-semibold text-muted">
                {c.client.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.client}</p>
                <p className="text-xs text-muted">
                  {c.contracts} contract{c.contracts === 1 ? "" : "s"}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold text-accent">{money(c.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  );
}

function TransactionsTable({
  items,
  total,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  showingAll,
  onToggleAll,
}: {
  items: FinanceTransaction[];
  total: number;
  search: string;
  onSearch: (v: string) => void;
  statusFilter: "all" | FinanceTransaction["status"];
  onStatusFilter: (v: "all" | FinanceTransaction["status"]) => void;
  showingAll: boolean;
  onToggleAll: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <DashCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">Recent Transactions</h2>
        <div className="flex items-center gap-1">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filter by status"
              className="appearance-none rounded-md border border-border bg-surface py-1.5 pr-7 pl-2.5 text-xs font-medium outline-none focus:border-accent"
            >
              <option value="all">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>
            <Filter size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            aria-label="Search transactions"
            aria-pressed={showSearch}
            className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${showSearch ? "bg-accent-soft text-accent" : "text-muted hover:bg-sunken"}`}
          >
            <Search size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showSearch && (
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by client or project…"
          className="mt-3 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      )}

      {items.length === 0 ? (
        <div className="mt-4">
          <Empty>No transactions match.</Empty>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Platform</th>
                <th className="pb-2 pr-3 font-medium">Client / Project</th>
                <th className="pb-2 pr-3 font-medium">Amount</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-sunken">
                  <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted">
                    {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOT[t.platform]}`} aria-hidden="true" />
                      {PLATFORM_LABEL[t.platform]}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <Link href={`/finance/${t.id}`} className="block truncate font-medium hover:text-accent">
                      {t.client}
                    </Link>
                    <span className="block truncate text-xs text-muted">{t.project}</span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-3 font-mono text-xs tabular-nums">
                    {t.amount.toLocaleString(undefined, { style: "currency", currency: t.currency })}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${STATUS_TONE[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/finance/${t.id}`}
                      title="View transaction details"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-foreground"
                    >
                      •••
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 5 && (
        <div className="mt-4 flex justify-center border-t border-border pt-4">
          <button
            type="button"
            onClick={onToggleAll}
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            {showingAll ? "Show less" : `View All Transactions (${total})`}
            <ChevronDown size={14} className={`transition-transform ${showingAll ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      )}
    </DashCard>
  );
}
