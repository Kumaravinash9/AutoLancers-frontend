"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Link2,
  RefreshCw,
  Search,
  Send,
  Wallet,
} from "lucide-react";

import { useAccountScope } from "@/components/account-scope";
import { Calibration } from "@/components/calibration";
import { DashCard, StaggerIn, StatTile, StatTileSkeleton } from "@/components/app-ui";
import { Empty, ErrorNote, Page, ScoreBadge } from "@/components/ui";
import {
  isConnectionError,
  proposals,
  ProposalRow,
  ProposalStats,
  PROPOSAL_STATUS_LABEL as STATUS_LABEL,
  PROPOSAL_STATUS_TONE as STATUS_TONE,
} from "@/lib/api";
import { formatDateSent, jobLinkLabel, money, pageNumbers } from "@/lib/format";
import { DEMO_PROPOSALS, DEMO_STATS } from "@/lib/demo-data";

type Tab = "all" | "draft" | "sent" | "accepted";

const TABS: { key: Tab; label: string; match: (row: ProposalRow) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "draft", label: "Drafts", match: (row) => row.status === "DRAFT" },
  { key: "sent", label: "Sent", match: (row) => row.status === "SUBMITTED" },
  { key: "accepted", label: "Accepted", match: (row) => row.status === "ACCEPTED" },
];

const PAGE_SIZE = 8;
const WEEK_MS = 7 * 86_400_000;

function StatusPill({ status }: { status: ProposalRow["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}
    >
      {status === "ACCEPTED" && <Check size={11} strokeWidth={3} />}
      {STATUS_LABEL[status]}
    </span>
  );
}

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton mt-1.5 h-3 w-24 rounded" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-28 rounded" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-24 rounded" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-6 w-20 rounded-full" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-16 rounded" />
      </td>
    </tr>
  );
}

/**
 * Every proposal, paired with the score that recommended it.
 *
 * The pairing is the point. A score is a prediction; a submitted bid and its outcome are the
 * result. Seeing them together is what turns the scoring weights from a guess into something you
 * can calibrate — if your accepted work averages 62 and your rejected averages 61, the score
 * isn't earning its place.
 */
export default function ProposalsPage() {
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newThisWeek, setNewThisWeek] = useState(0);
  const { accountId, accounts, ready } = useAccountScope();

  function applyData(list: ProposalRow[], s: ProposalStats) {
    setRows(list);
    setStats(s);
    const cutoff = Date.now() - WEEK_MS;
    setNewThisWeek(
      list.filter((r) => r.status === "SUBMITTED" && r.submitted_at && new Date(r.submitted_at).getTime() >= cutoff)
        .length,
    );
  }

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([proposals.list(accountId), proposals.stats(accountId)]);
      applyData(list, s);
      setError(null);
    } catch (err) {
      if (isConnectionError(err)) {
        applyData(DEMO_PROPOSALS, DEMO_STATS);
      } else {
        setError(err instanceof Error ? err.message : "Could not load");
      }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      await load();
    })();
  }, [ready, load]);

  function selectTab(key: Tab) {
    setTab(key);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await proposals.sync();
    } catch (err) {
      if (!isConnectionError(err)) setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      await load();
      setRefreshing(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: 0, draft: 0, sent: 0, accepted: 0 };
    for (const t of TABS) c[t.key] = rows.filter(t.match).length;
    return c;
  }, [rows]);

  const visibleRows = rows
    .filter(TABS.find((t) => t.key === tab)!.match)
    .filter((r) => !search.trim() || r.project_title.toLowerCase().includes(search.trim().toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageRows = visibleRows.slice(startIdx, startIdx + PAGE_SIZE);

  const sentWithBid = rows.filter((r) => r.bid_amount !== null && (r.status === "SUBMITTED" || r.status === "ACCEPTED"));
  const avgBid = sentWithBid.length
    ? sentWithBid.reduce((sum, r) => sum + (r.bid_amount ?? 0), 0) / sentWithBid.length
    : null;

  const accepted = rows.filter((r) => r.status === "ACCEPTED");
  const revenue = accepted.reduce((sum, r) => sum + (r.bid_amount ?? 0), 0);
  const revenueCurrency = accepted.find((r) => r.bid_amount !== null)?.currency ?? null;

  const responseRate =
    stats && stats.submitted > 0 ? Math.round(((stats.accepted + stats.rejected) / stats.submitted) * 100) : null;

  if (error) return <Page><ErrorNote>{error}</ErrorNote></Page>;

  return (
    <Page className="space-y-6">
      <div className={`flex flex-wrap items-center gap-3 ${accounts.length > 1 ? "justify-between" : "justify-end"}`}>
        {accounts.length > 1 && (
          <span className="rounded-full bg-sunken px-2.5 py-1 font-mono text-xs text-muted">
            {accountId
              ? `Showing ${accounts.find((a) => a.id === accountId)?.platform_username} · others: ${accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => a.platform_username)
                  .join(", ")}`
              : `Showing all ${accounts.length} accounts combined`}
          </span>
        )}
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {stats && !stats.outcome_tracking_enabled && stats.awaiting_outcome > 0 && (
        <ErrorNote>
          {stats.awaiting_outcome} sent {stats.awaiting_outcome === 1 ? "bid has" : "bids have"} no
          recorded outcome. Nothing syncs award status back from Freelancer yet, so a result here
          means we asked and were told — not that you lost the work.
        </ErrorNote>
      )}

      <StaggerIn index={0}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                icon={FileText}
                label="Active proposals"
                value={String(stats.submitted)}
                caption={newThisWeek > 0 ? `+${newThisWeek} this week` : "No new activity this week"}
              />
              <StatTile
                icon={Send}
                label="Response rate"
                value={responseRate !== null ? `${responseRate}%` : "—"}
                caption={
                  stats.outcome_tracking_enabled
                    ? `${stats.accepted} selected · ${stats.rejected} not selected`
                    : "Outcomes not synced yet"
                }
              />
              <StatTile
                icon={Wallet}
                label="Avg bid value"
                value={avgBid !== null ? money(avgBid, sentWithBid[0]?.currency ?? null) : "—"}
                caption={`across ${sentWithBid.length} sent proposal${sentWithBid.length === 1 ? "" : "s"}`}
              />
              <StatTile
                icon={DollarSign}
                tint
                label="Total revenue generated"
                value={revenue > 0 ? money(revenue, revenueCurrency) : "—"}
                caption={`from ${accepted.length} accepted proposal${accepted.length === 1 ? "" : "s"}`}
              />
            </>
          )}
        </div>
      </StaggerIn>

      {stats && (
        <StaggerIn index={1}>
          <Calibration stats={stats} />
        </StaggerIn>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-sunken p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-surface text-foreground ring-1 ring-border/60" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={`font-mono text-xs ${tab === t.key ? "text-accent" : "text-muted"}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search proposals…"
            className="w-full rounded-md border border-border bg-surface py-1.5 pr-3 pl-8 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>

      <StaggerIn index={2}>
        <DashCard className="p-0">
          {!loading && visibleRows.length === 0 ? (
            <div className="p-5">
              <Empty>
                {search
                  ? "No proposals match your search."
                  : tab === "accepted"
                    ? "Nothing selected yet."
                    : tab === "sent"
                      ? "Nothing sent yet."
                      : tab === "draft"
                        ? "Nothing drafted yet. Matches get a draft on each fetch."
                        : "Nothing here yet."}
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-200 table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-36" />
                  <col className="w-32" />
                  <col className="w-28" />
                  <col className="w-24" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Proposal</th>
                    <th className="pb-2 font-medium">Job link</th>
                    <th className="pb-2 font-medium">Date sent</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                    : pageRows.map((row) => (
                        <tr key={row.id} className="group transition-colors hover:bg-sunken">
                          <td className="py-3 pr-3">
                            <Link
                              href={`/proposals/${row.id}`}
                              className="block truncate font-medium hover:text-accent"
                              title={row.project_title || undefined}
                            >
                              {row.project_title || "(untitled)"}
                            </Link>
                            <div className="mt-1 flex items-center gap-1.5">
                              {row.score !== null && <ScoreBadge score={row.score} />}
                              <span className="text-xs text-muted">
                                {row.was_recommended ? "Recommended" : "Your own find"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-1.5">
                              <Link2 size={12} className={row.project_url ? "text-accent" : "text-muted"} />
                              {row.project_url ? (
                                <a
                                  href={row.project_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-xs font-semibold text-accent hover:underline"
                                >
                                  {jobLinkLabel(row)}
                                </a>
                              ) : (
                                <span className="truncate text-xs font-semibold text-muted">{jobLinkLabel(row)}</span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted">
                            {formatDateSent(row.submitted_at)}
                          </td>
                          <td className="py-3 pr-3">
                            <StatusPill status={row.status} />
                          </td>
                          <td className="truncate py-3 pr-3 font-mono text-xs tabular-nums">
                            {row.bid_amount !== null ? money(row.bid_amount, row.currency) : "—"}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && visibleRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted">
              <span>
                Showing {startIdx + 1} to {Math.min(startIdx + PAGE_SIZE, visibleRows.length)} of {visibleRows.length}{" "}
                entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {pageNumbers(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`grid h-7 w-7 place-items-center rounded-md text-xs font-medium transition-colors ${
                        p === currentPage ? "bg-accent text-white" : "hover:bg-sunken"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </DashCard>
      </StaggerIn>
    </Page>
  );
}
