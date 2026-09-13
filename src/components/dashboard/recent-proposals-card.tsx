"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Empty, ErrorNote, ScoreBadge } from "@/components/ui";
import { DashCard, StaggerIn } from "@/components/app-ui";
import {
  formatAge,
  isConnectionError,
  proposals,
  ProposalRow,
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_TONE,
} from "@/lib/api";
import { DEMO_PROPOSALS } from "@/lib/demo-data";

const PREVIEW_COUNT = 5;

function RowSkeleton() {
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="skeleton h-6 w-9 rounded" />
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-14 rounded" />
    </li>
  );
}

export function RecentProposalsCard({ accountId }: { accountId: string | null }) {
  const [allRows, setAllRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await proposals.list(accountId);
        if (!cancelled) setAllRows(list);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setAllRows(DEMO_PROPOSALS);
        } else {
          setError(err instanceof Error ? err.message : "Could not load proposals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const rows = allRows.slice(0, PREVIEW_COUNT);

  return (
    <StaggerIn index={5}>
      <DashCard className="space-y-4 p-5!">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight">Recent proposals</h2>
          <Link
            href="/proposals"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform hover:translate-x-0.5"
          >
            View all →
          </Link>
        </div>

        {error ? (
          <ErrorNote>{error}</ErrorNote>
        ) : !loading && rows.length === 0 ? (
          <Empty>Nothing drafted yet.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)
              : rows.map((row) => (
                  <li key={row.id} className="rounded-lg first:pt-0 last:pb-0">
                    <Link
                      href={`/proposals/${row.id}`}
                      className="block rounded-lg py-2.5 transition-colors hover:bg-sunken"
                    >
                      <div className="flex flex-wrap items-center gap-2 px-2">
                        {row.score !== null ? (
                          <ScoreBadge score={row.score} />
                        ) : (
                          <span className="rounded bg-sunken px-2 py-0.5 font-mono text-sm text-muted">—</span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {row.project_title || "(untitled)"}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[0.7rem] ${PROPOSAL_STATUS_TONE[row.status]}`}
                        >
                          {PROPOSAL_STATUS_LABEL[row.status]}
                        </span>
                      </div>
                      <p className="mt-1 px-2 text-xs text-muted">
                        {row.submitted_at
                          ? `sent ${formatAge(row.submitted_at)}`
                          : `drafted ${formatAge(row.drafted_at ?? row.created_at)}`}
                      </p>
                    </Link>
                  </li>
                ))}
          </ul>
        )}
      </DashCard>
    </StaggerIn>
  );
}
