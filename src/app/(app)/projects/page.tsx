"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Link2, Search, TriangleAlert } from "lucide-react";

import { useAccountScope } from "@/components/account-scope";
import { AiSummaryBand, SummaryMetric } from "@/components/ai-summary-band";
import { DashCard, StaggerIn } from "@/components/app-ui";
import { Empty, ErrorNote, Page, PlatformTag } from "@/components/ui";
import { isConnectionError, proposals, ProposalRow } from "@/lib/api";
import { formatDateSent, jobLinkLabel, money, pageNumbers, relativeDeadline } from "@/lib/format";
import { DEMO_PROJECTS, DEMO_PROPOSALS, DemoProject } from "@/lib/demo-data";

const DELIVERY_TONE: Record<DemoProject["delivery_status"], string> = {
  Kickoff: "bg-accent-soft text-accent",
  "In progress": "bg-accent-soft text-accent",
  "At risk": "bg-warn/15 text-warn",
  "On hold": "bg-sunken text-muted",
  Delivered: "bg-good/15 text-good",
};

type Bucket = "all" | "active" | "hold" | "completed";

const BUCKETS: { key: Bucket; label: string; match: (s: DemoProject["delivery_status"]) => boolean }[] = [
  { key: "all", label: "All Projects", match: () => true },
  { key: "active", label: "In Progress", match: (s) => s === "Kickoff" || s === "In progress" || s === "At risk" },
  { key: "hold", label: "On Hold", match: (s) => s === "On hold" },
  { key: "completed", label: "Completed", match: (s) => s === "Delivered" },
];

const PAGE_SIZE = 8;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function RowSkeleton() {
  return (
    <tr>
      <td className="py-4 pr-4 align-top">
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton mt-2 h-3 w-40 rounded" />
      </td>
      <td className="py-4 pr-4 align-top">
        <div className="flex items-center gap-2.5">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div>
            <div className="skeleton h-3.5 w-20 rounded" />
            <div className="skeleton mt-1.5 h-4 w-16 rounded" />
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 align-top">
        <div className="skeleton h-3.5 w-20 rounded" />
        <div className="skeleton mt-1.5 h-3 w-16 rounded" />
      </td>
      <td className="py-4 pr-3 align-top">
        <div className="skeleton h-6 w-20 rounded-full" />
      </td>
    </tr>
  );
}

/**
 * "Won" is the same ACCEPTED status the Proposals page already tracks — this page is a
 * different view of the same jobs, not a separate data source, so its revenue figure can never
 * disagree with Proposals or Finance. Delivery status/client/deadline only exist for the demo
 * fallback (see DEMO_PROJECTS) — there's no post-win tracking in the real schema yet, so a real
 * ACCEPTED proposal shows "Not tracked yet" honestly instead of a fabricated status, and the
 * delivery-stage tabs (which need that dimension to mean anything) only appear in demo mode.
 */
export default function ProjectsPage() {
  const { accountId } = useAccountScope();
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<Bucket>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await proposals.list(accountId);
        if (!cancelled) {
          setRows(list);
          setIsDemo(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setRows(DEMO_PROPOSALS);
          setIsDemo(true);
        } else {
          setError(err instanceof Error ? err.message : "Could not load projects");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  function selectBucket(key: Bucket) {
    setBucket(key);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const won = rows.filter((r) => r.status === "ACCEPTED");
  const demoFor = (row: ProposalRow) => (isDemo ? DEMO_PROJECTS.find((p) => p.title === row.project_title) : undefined);

  const totalRevenue = won.reduce((sum, r) => sum + (r.bid_amount ?? 0), 0);
  const revenueCurrency = won.find((r) => r.bid_amount !== null)?.currency ?? null;
  const platformCount = new Set(won.map((r) => r.platform)).size;

  const wonDemoProjects = won.map(demoFor).filter((p): p is DemoProject => p !== undefined);
  const inDelivery = wonDemoProjects.filter((p) => p.delivery_status !== "Delivered");
  const nextDeadline = [...inDelivery].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  )[0];

  const metrics: SummaryMetric[] = [
    {
      label: "Won projects",
      value: String(won.length),
      caption: platformCount > 0 ? `across ${platformCount} platform${platformCount === 1 ? "" : "s"}` : "—",
    },
    {
      label: "In delivery",
      value: isDemo ? String(inDelivery.length) : "—",
      caption: isDemo ? `${wonDemoProjects.length - inDelivery.length} delivered` : "Not tracked yet",
    },
    {
      label: "Next deadline",
      value: nextDeadline ? relativeDeadline(nextDeadline.deadline).text : "—",
      caption: nextDeadline ? nextDeadline.title : "Not tracked yet",
    },
    {
      label: "Generated revenue",
      value: totalRevenue > 0 ? money(totalRevenue, revenueCurrency) : "—",
      caption: `from ${won.length} won project${won.length === 1 ? "" : "s"}`,
    },
  ];

  const bucketCounts = isDemo
    ? BUCKETS.reduce<Record<Bucket, number>>(
        (acc, b) => {
          acc[b.key] = wonDemoProjects.filter((p) => b.match(p.delivery_status)).length;
          return acc;
        },
        { all: won.length, active: 0, hold: 0, completed: 0 },
      )
    : { all: won.length, active: 0, hold: 0, completed: 0 };

  const visible = won
    .filter((row) => {
      if (!isDemo || bucket === "all") return true;
      const demo = demoFor(row);
      return demo ? BUCKETS.find((b) => b.key === bucket)!.match(demo.delivery_status) : false;
    })
    .filter((row) => !search.trim() || row.project_title.toLowerCase().includes(search.trim().toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageRows = visible.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <Page className="space-y-6">
      <AiSummaryBand
        title="Project Portfolio"
        subtitle="Overview of your active and upcoming engagements."
        metrics={metrics}
        loading={loading}
        index={0}
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isDemo ? (
          <div className="flex flex-wrap gap-1 rounded-lg bg-sunken p-1">
            {BUCKETS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => selectBucket(b.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  bucket === b.key ? "bg-surface text-foreground ring-1 ring-border/60" : "text-muted hover:text-foreground"
                }`}
              >
                {b.label}
                {b.key !== "all" && (
                  <span className={`font-mono text-xs ${bucket === b.key ? "text-accent" : "text-muted"}`}>
                    {bucketCounts[b.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-md border border-border bg-surface py-1.5 pr-3 pl-8 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>

      <StaggerIn index={1}>
        <DashCard className="p-0">
          {!loading && visible.length === 0 ? (
            <div className="p-5">
              <Empty>
                {search
                  ? "No projects match your search."
                  : bucket === "hold"
                    ? "Nothing on hold."
                    : bucket === "completed"
                      ? "Nothing delivered yet."
                      : "No won jobs yet — accepted proposals will show up here."}
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-180 table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-44" />
                  <col className="w-32" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Project</th>
                    <th className="pb-2 font-medium">Client / Platform</th>
                    <th className="pb-2 font-medium">Deadline</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
                    : pageRows.map((row) => {
                        const demo = demoFor(row);
                        const deadline = demo ? relativeDeadline(demo.deadline) : null;
                        return (
                          <tr key={row.id} className="group transition-colors hover:bg-sunken">
                            <td className="py-4 pr-4 align-top">
                              <Link
                                href={`/projects/${row.id}`}
                                className="block truncate font-medium hover:text-accent"
                                title={row.project_title || undefined}
                              >
                                {row.project_title || "(untitled)"}
                              </Link>
                              <p className="mt-1.5 truncate text-xs leading-relaxed text-muted">
                                {row.score !== null && <span className="font-medium text-foreground/70">Score {row.score.toFixed(0)} · </span>}
                                {row.was_recommended ? "Recommended" : "Your own find"} · Won{" "}
                                {formatDateSent(row.submitted_at)} ·{" "}
                                <span className="font-mono">{money(row.bid_amount ?? 0, row.currency)}</span>
                              </p>
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {demo ? (
                                <div className="flex items-center gap-2.5">
                                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-xs font-semibold text-white">
                                    {initials(demo.client)}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">{demo.client}</div>
                                    <div className="mt-1">
                                      <PlatformTag platform={row.platform} />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 pt-1.5">
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
                              )}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {demo && deadline ? (
                                <div className="space-y-0.5">
                                  <div
                                    className={`flex items-center gap-1 text-xs font-semibold ${deadline.soon ? "text-warn" : "text-foreground"}`}
                                  >
                                    {deadline.soon && <TriangleAlert size={11} className="shrink-0" />}
                                    {new Date(demo.deadline).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className={`text-xs ${deadline.soon ? "text-warn" : "text-muted"}`}>
                                    {deadline.text}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted">Not tracked yet</span>
                              )}
                            </td>
                            <td className="py-4 pr-3 align-top">
                              {demo ? (
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${DELIVERY_TONE[demo.delivery_status]}`}
                                >
                                  {demo.delivery_status}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                                  Not tracked
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && visible.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted">
              <span>
                Showing {startIdx + 1} to {Math.min(startIdx + PAGE_SIZE, visible.length)} of {visible.length} entries
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
