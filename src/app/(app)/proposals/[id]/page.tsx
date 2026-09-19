"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Clock, FileText, Send, X } from "lucide-react";

import { DashCard, StaggerIn } from "@/components/app-ui";
import { Empty, ErrorNote, Page, PlatformTag, ScoreBadge } from "@/components/ui";
import {
  isConnectionError,
  proposals,
  ProposalRow,
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_TONE,
} from "@/lib/api";
import { DEMO_PROPOSALS } from "@/lib/demo-data";
import { formatDateSent, jobLinkLabel, money } from "@/lib/format";

/**
 * One sent (or drafted) proposal, as a receipt — not an editor. Editing and re-sending still
 * happen on the job it came from (linked below via `recommendation_id`); this page is for
 * reviewing what was actually said and what happened to it, the same "look, don't touch" split
 * the job detail page draws between drafting and reviewing scoring detail.
 */
export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const proposalId = params.id;

  const [row, setRow] = useState<ProposalRow | null>(null);
  const [loading, setLoading] = useState(Boolean(params.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await proposals.get(proposalId);
        if (!cancelled) setRow(result);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setRow(DEMO_PROPOSALS.find((p) => p.id === proposalId) ?? DEMO_PROPOSALS[0]);
        } else {
          setError(err instanceof Error ? err.message : "Could not load proposal");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  if (loading)
    return (
      <Page className="space-y-6">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="flex items-start gap-3 border-b border-border pb-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-6 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
          <div className="skeleton h-16 w-16 shrink-0 rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </Page>
    );
  if (error && !row) return <Page><ErrorNote>{error}</ErrorNote></Page>;
  if (!row) return <Page><Empty>Proposal not found.</Empty></Page>;

  const maxReasonPoints = Math.max(1, ...row.reasons.map((r) => Math.abs(r.points)));

  return (
    <Page className="space-y-6">
      <Link href="/proposals" className="text-sm text-muted hover:text-foreground">
        ← Back to proposals
      </Link>

      <div className="flex items-start gap-3 border-b border-border pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {row.project_title || "(untitled)"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <PlatformTag platform={row.platform} />
            <span className={`rounded px-1.5 py-0.5 font-mono text-[0.7rem] ${PROPOSAL_STATUS_TONE[row.status]}`}>
              {PROPOSAL_STATUS_LABEL[row.status]}
            </span>
            <span>{row.was_recommended ? "Recommended by AutoLancers" : "Your own find"}</span>
            {row.bid_amount !== null && (
              <span className="font-mono tabular-nums">{money(row.bid_amount, row.currency)}</span>
            )}
            {row.project_url ? (
              <a href={row.project_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Open {jobLinkLabel(row)} ↗
              </a>
            ) : (
              <span>{jobLinkLabel(row)}</span>
            )}
          </div>
        </div>
        {row.score !== null && <ScoreBadge score={row.score} size="lg" />}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <StaggerIn index={0} className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">What was sent</h2>
            {row.proposal_text ? (
              <DashCard className="p-4">
                <p className="proposal text-sm leading-relaxed">{row.proposal_text}</p>
              </DashCard>
            ) : (
              <Empty>No proposal text recorded for this one.</Empty>
            )}
          </section>

          {row.reasons.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Why it scored {row.score?.toFixed(0) ?? "—"}
              </h2>
              <DashCard className="space-y-3 p-4">
                {row.reasons.map((reason, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{reason.label}</span>
                      <span
                        className={`shrink-0 font-mono text-xs tabular-nums ${reason.points >= 0 ? "text-good" : "text-warn"}`}
                      >
                        {reason.points >= 0 ? "+" : ""}
                        {reason.points.toFixed(0)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{reason.detail}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full rounded-full bg-figure"
                        style={{ width: `${(Math.abs(reason.points) / maxReasonPoints) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </DashCard>
            </section>
          )}
        </StaggerIn>

        <StaggerIn index={1} className="space-y-6">
          <ProposalTimeline row={row} />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Bid details</h2>
            <DashCard className="space-y-2 p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted">Amount</span>
                <span className="font-medium">
                  {row.bid_amount !== null ? money(row.bid_amount, row.currency) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">Delivery estimate</span>
                <span className="font-medium">{row.estimated_days ? `${row.estimated_days} days` : "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">Submitted via</span>
                <span className="font-medium capitalize">{row.submitted_via ?? "—"}</span>
              </div>
              {row.recommendation_id && (
                <div className="pt-2">
                  <Link href={`/jobs/${row.recommendation_id}`} className="text-accent hover:underline">
                    View the matched job →
                  </Link>
                </div>
              )}
            </DashCard>
          </section>

          {(row.model || row.input_tokens !== null || row.output_tokens !== null) && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Drafting details</h2>
              <DashCard className="space-y-1 p-4 font-mono text-xs text-muted">
                {row.model && <p>Model: {row.model}</p>}
                {row.input_tokens !== null && <p>Input tokens: {row.input_tokens.toLocaleString()}</p>}
                {row.output_tokens !== null && <p>Output tokens: {row.output_tokens.toLocaleString()}</p>}
              </DashCard>
            </section>
          )}
        </StaggerIn>
      </div>
    </Page>
  );
}

/** Only the transitions this data can actually prove get a date — "Selected"/"Not selected"/
 *  "Withdrawn" have no separate outcome timestamp in ProposalRow, so they show as the current
 *  state without inventing a date for when it happened. */
function ProposalTimeline({ row }: { row: ProposalRow }) {
  const steps: { label: string; date: string | null; icon: typeof FileText; tone: string }[] = [
    { label: "Drafted", date: row.drafted_at ?? row.created_at, icon: FileText, tone: "text-muted" },
  ];
  if (row.status !== "DRAFT") steps.push({ label: "Sent", date: row.submitted_at, icon: Send, tone: "text-accent" });
  if (row.status === "ACCEPTED") steps.push({ label: "Selected", date: null, icon: Check, tone: "text-good" });
  if (row.status === "REJECTED") steps.push({ label: "Not selected", date: null, icon: X, tone: "text-warn" });
  if (row.status === "WITHDRAWN") steps.push({ label: "Withdrawn", date: null, icon: Clock, tone: "text-muted" });

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Timeline</h2>
      <DashCard className="p-4">
        <ol className="space-y-1">
          {steps.map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sunken ${step.tone}`}>
                  <step.icon size={13} aria-hidden="true" />
                </span>
                {i < steps.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs text-muted">{step.date ? formatDateSent(step.date) : "—"}</p>
              </div>
            </li>
          ))}
        </ol>
      </DashCard>
    </section>
  );
}
