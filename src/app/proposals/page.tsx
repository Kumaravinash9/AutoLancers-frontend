"use client";

import { useEffect, useState } from "react";

import { Card, Empty, ErrorNote, Page, PlatformTag, ScoreBadge } from "@/components/ui";
import { useAccountScope } from "@/components/account-scope";
import { formatAge, proposals, ProposalRow, ProposalStats } from "@/lib/api";

const STATUS_TONE: Record<ProposalRow["status"], string> = {
  DRAFT: "bg-sunken text-muted",
  SUBMITTED: "bg-accent-soft text-accent",
  ACCEPTED: "bg-good/15 text-good",
  REJECTED: "bg-warn/15 text-warn",
  WITHDRAWN: "bg-sunken text-muted",
};

// The client's word for ACCEPTED is "you were selected", so say that rather than echoing an
// internal enum at someone reading their own results.
const STATUS_LABEL: Record<ProposalRow["status"], string> = {
  DRAFT: "Draft",
  SUBMITTED: "Sent",
  ACCEPTED: "Selected",
  REJECTED: "Not selected",
  // Reachable only once outcome syncing exists; today a sent bid stays "Sent".
  WITHDRAWN: "Withdrawn",
};

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
  const [error, setError] = useState<string | null>(null);
  const { accountId, accounts, ready } = useAccountScope();

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      try {
        const [list, s] = await Promise.all([
          proposals.list(accountId),
          proposals.stats(accountId),
        ]);
        if (!cancelled) {
          setRows(list);
          setStats(s);
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
  }, [accountId, ready]);

  if (loading) return <Page><Empty>Loading…</Empty></Page>;
  if (error) return <Page><ErrorNote>{error}</ErrorNote></Page>;

  return (
    <Page className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Proposals</h1>
        <p className="mt-1 text-sm text-muted">
          Everything drafted or bid on, with the score that recommended it.
        </p>
        {accounts.length > 1 && (
          <p className="mt-1 font-mono text-xs text-muted">
            {accountId
              ? `Showing ${accounts.find((a) => a.id === accountId)?.platform_username} · others: ${accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => a.platform_username)
                  .join(", ")}`
              : `Showing all ${accounts.length} accounts combined`}
          </p>
        )}
      </div>

      {stats && !stats.outcome_tracking_enabled && stats.awaiting_outcome > 0 && (
        <ErrorNote>
          {stats.awaiting_outcome} sent {stats.awaiting_outcome === 1 ? "bid has" : "bids have"} no
          recorded outcome. Nothing syncs award status back from Freelancer yet, so a result here
          means we asked and were told — not that you lost the work.
        </ErrorNote>
      )}

      {stats && <Calibration stats={stats} />}

      {rows.length === 0 ? (
        <Empty>Nothing drafted yet. Matches get a draft on each fetch.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="flex flex-wrap items-start gap-3">
                {row.score !== null ? (
                  <ScoreBadge score={row.score} />
                ) : (
                  <span className="rounded bg-sunken px-2 py-0.5 font-mono text-sm text-muted">
                    —
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.project_url ? (
                      <a
                        href={row.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-accent"
                      >
                        {row.project_title || "(untitled)"}
                      </a>
                    ) : (
                      <span className="font-medium">{row.project_title || "(untitled)"}</span>
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[0.7rem] ${STATUS_TONE[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                    <span
                      className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.7rem] text-muted"
                      title={
                        row.was_recommended
                          ? "AutoLancers surfaced and scored this one"
                          : "You bid on this without a recommendation from us"
                      }
                    >
                      {row.was_recommended ? "recommended" : "your own find"}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
                    <PlatformTag platform={row.platform} />
                    <span>{row.freelancer_name}</span>
                    {row.bid_amount !== null && (
                      <span>
                        bid {row.bid_amount.toFixed(0)} {row.currency ?? ""}
                        {row.estimated_days ? ` · ${row.estimated_days}d` : ""}
                      </span>
                    )}
                    <span>
                      {row.submitted_at
                        ? `sent ${formatAge(row.submitted_at)}`
                        : `drafted ${formatAge(row.drafted_at ?? row.created_at)}`}
                    </span>
                    {row.external_bid_id && <span>bid #{row.external_bid_id}</span>}
                    {row.submitted_via && <span>{row.submitted_via.toLowerCase()}</span>}
                    {row.output_tokens !== null && <span>{row.output_tokens} tokens</span>}
                  </div>

                  {row.reasons.length > 0 && (
                    <p className="mt-2 truncate text-xs text-muted">
                      {row.reasons.map((r) => `${r.label} ${r.points > 0 ? "+" : ""}${r.points}`).join(" · ")}
                    </p>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

function Calibration({ stats }: { stats: ProposalStats }) {
  const cells: { label: string; value: string; note?: string }[] = [
    { label: "Total", value: String(stats.total), note: `${stats.drafted} still drafts` },
    {
      label: "Submitted",
      value: String(stats.submitted),
      note: `${stats.from_recommendation} from our picks`,
    },
    {
      label: "Selected",
      value: stats.outcome_tracking_enabled ? String(stats.accepted) : "—",
      note: stats.outcome_tracking_enabled
        ? `${stats.rejected} not selected`
        : "outcomes not synced yet",
    },
    {
      label: "Avg score sent",
      value: stats.avg_score_submitted?.toFixed(1) ?? "—",
      note: stats.avg_score_accepted
        ? `${stats.avg_score_accepted.toFixed(1)} on won work`
        : "needs outcomes to compare against",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cells.map((c) => (
        <Card key={c.label} className="flex flex-col gap-1">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted">
            {c.label}
          </span>
          <span className="font-display text-2xl font-semibold tabular-nums">{c.value}</span>
          {c.note && <span className="text-xs text-muted">{c.note}</span>}
        </Card>
      ))}
    </section>
  );
}
