"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

import { DashCard, Ring, Sparkline, StaggerIn } from "@/components/app-ui";
import { ErrorNote } from "@/components/ui";
import { api, isConnectionError, Job, proposals, ProposalStats } from "@/lib/api";
import { DEMO_HIGHLIGHTS, DEMO_JOBS, DEMO_PROFILE_SCORE, DEMO_STATS, DEMO_WIN_RATE_TREND } from "@/lib/demo-data";

const RECOMMENDED_WINDOW_MS = 30 * 24 * 3600_000;

function DeltaArrow({ up }: { up: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      {up ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  );
}

function Delta({ up, children }: { up: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-good" : "text-warn"}`}>
      <DeltaArrow up={up} />
      {children}
    </span>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <DashCard className="p-5">{children}</DashCard>;
}

function CellSkeleton() {
  return (
    <DashCard className="p-5">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton mt-3 h-7 w-16 rounded" />
      <div className="skeleton mt-3 h-3 w-24 rounded" />
    </DashCard>
  );
}

/**
 * The dashboard's metrics rail: five equal-weight cells, four graph-cards plus one ring —
 * Profile Score is the only score drawn as a shape here, so it stays the one signature ring on
 * the page rather than competing with itself.
 */
export function StatCards({ accountId }: { accountId: string | null }) {
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const result = await proposals.stats(accountId);
        if (!cancelled) setStats(result);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setStats(DEMO_STATS);
        } else {
          setStatsError(err instanceof Error ? err.message : "Could not load stats");
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const result = await api.listJobs({ rejected: false, limit: 200 });
        if (!cancelled) setJobs(result);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setJobs(DEMO_JOBS.filter((j) => !j.rejected));
        } else {
          setJobsError(err instanceof Error ? err.message : "Could not load recommended jobs");
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const loading = statsLoading || jobsLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <CellSkeleton />
        <CellSkeleton />
        <CellSkeleton />
        <CellSkeleton />
        <CellSkeleton />
      </div>
    );
  }
  if (statsError) return <ErrorNote>{statsError}</ErrorNote>;
  if (jobsError) return <ErrorNote>{jobsError}</ErrorNote>;
  if (!stats) return null;

  const winRate =
    stats.accepted + stats.rejected > 0
      ? Math.round((100 * stats.accepted) / (stats.accepted + stats.rejected))
      : null;

  const now = Date.now();
  const recommendedLast30Days = jobs.filter(
    (j) => !j.rejected && j.posted_at && now - new Date(j.posted_at).getTime() <= RECOMMENDED_WINDOW_MS,
  ).length;

  return (
    <StaggerIn index={1}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {DEMO_HIGHLIGHTS.map((h) => (
          <Cell key={h.label}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">{h.label}</div>
                <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">{h.value}</div>
                <div className="mt-2 min-h-4">
                  <Delta up={h.deltaUp}>{h.deltaLabel} vs prior 30d</Delta>
                </div>
              </div>
              {h.trend.length > 1 && (
                <div className="mt-1 shrink-0">
                  <Sparkline values={h.trend} positive={h.deltaUp} />
                </div>
              )}
            </div>
          </Cell>
        ))}

        <Cell>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-muted">Win rate</div>
              <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">
                {stats.outcome_tracking_enabled && winRate !== null ? `${winRate}%` : "—"}
              </div>
              <p className="mt-2 text-xs text-muted">
                {stats.outcome_tracking_enabled
                  ? `${stats.accepted} of ${stats.accepted + stats.rejected} selected`
                  : "Connect outcome sync to track wins"}
              </p>
            </div>
            <div className="mt-1 shrink-0">
              <Sparkline values={DEMO_WIN_RATE_TREND} positive />
            </div>
          </div>
        </Cell>

        <Cell>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Proposals sent</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">{stats.submitted}</div>
          <p className="mt-2 text-xs text-muted">
            {stats.drafted} drafted · {stats.accepted} selected
          </p>
        </Cell>

        <Cell>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Recommended jobs</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">{recommendedLast30Days}</div>
          <p className="mt-2 text-xs text-muted">in the last 30 days</p>
        </Cell>

        <Cell>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Profile score</div>
          <div className="mt-2 flex items-center gap-3">
            <Ring value={DEMO_PROFILE_SCORE} size={56} stroke={5} />
            <p className="text-xs text-muted">Your profile across every connected platform.</p>
          </div>
          <Link
            href="/account"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            View account →
          </Link>
        </Cell>
      </div>
    </StaggerIn>
  );
}
