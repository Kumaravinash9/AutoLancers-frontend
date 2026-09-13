"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, CircleDashed, Link2, PauseCircle, TriangleAlert } from "lucide-react";

import { DashCard, StaggerIn } from "@/components/app-ui";
import { Empty, ErrorNote, Page, PlatformTag } from "@/components/ui";
import { isConnectionError, proposals, ProposalRow } from "@/lib/api";
import { DEMO_PROJECTS, DEMO_PROPOSALS, DemoProject } from "@/lib/demo-data";
import { formatDateSent, jobLinkLabel, money, relativeDeadline } from "@/lib/format";

/** Same 10% figure finance/page.tsx uses for its own margin note — kept as a local literal
 *  there and here (rather than shared) because neither is a real fee schedule yet, just an
 *  illustrative placeholder until billing exists. */
const MARKETPLACE_FEE_RATE = 0.1;

const STAGE_ORDER: DemoProject["delivery_status"][] = ["Kickoff", "In progress", "Delivered"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * A "project" is just an ACCEPTED proposal viewed after the fact — same row, same id, same
 * source of truth as the proposal detail page. `client` / `delivery_status` / `deadline` only
 * exist on the demo overlay (see DEMO_PROJECTS in demo-data.ts); a real won proposal has none of
 * that yet, so this page says "Not tracked yet" instead of guessing at a status.
 */
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [row, setRow] = useState<ProposalRow | null>(null);
  const [loading, setLoading] = useState(Boolean(params.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await proposals.get(projectId);
        if (!cancelled) setRow(result);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          const fallback =
            DEMO_PROPOSALS.find((p) => p.id === projectId && p.status === "ACCEPTED") ??
            DEMO_PROPOSALS.find((p) => p.status === "ACCEPTED") ??
            null;
          setRow(fallback);
        } else {
          setError(err instanceof Error ? err.message : "Could not load project");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading)
    return (
      <Page className="space-y-6">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="flex items-start gap-3 border-b border-border pb-6">
          <div className="skeleton h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-6 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </Page>
    );
  if (error && !row) return <Page><ErrorNote>{error}</ErrorNote></Page>;
  if (!row || row.status !== "ACCEPTED")
    return (
      <Page>
        <Empty>Project not found.</Empty>
      </Page>
    );

  const demo = DEMO_PROJECTS.find((p) => p.title === row.project_title);
  const deadline = demo ? relativeDeadline(demo.deadline) : null;
  const net = row.bid_amount !== null ? row.bid_amount * (1 - MARKETPLACE_FEE_RATE) : null;

  return (
    <Page className="space-y-6">
      <Link href="/projects" className="text-sm text-muted hover:text-foreground">
        ← Back to projects
      </Link>

      <div className="flex items-start gap-3 border-b border-border pb-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-white">
          {initials(demo?.client ?? row.platform)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {row.project_title || "(untitled)"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <PlatformTag platform={row.platform} />
            {demo ? (
              <span className="font-medium text-foreground">{demo.client}</span>
            ) : (
              <span>Client not tracked</span>
            )}
            <span>Won {formatDateSent(row.submitted_at)}</span>
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
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <StaggerIn index={0} className="space-y-6">
          <DeliveryStage demo={demo} />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">The winning proposal</h2>
            <DashCard className="p-4">
              {row.proposal_text ? (
                <p className="proposal text-sm leading-relaxed">{row.proposal_text}</p>
              ) : (
                <Empty>No proposal text recorded for this one.</Empty>
              )}
              <div className="mt-3 border-t border-border pt-3">
                <Link href={`/proposals/${row.id}`} className="text-sm text-accent hover:underline">
                  View the full proposal record →
                </Link>
              </div>
            </DashCard>
          </section>
        </StaggerIn>

        <StaggerIn index={1} className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Deadline</h2>
            <DashCard className="p-4 text-sm">
              {demo && deadline ? (
                <>
                  <div className={`flex items-center gap-1.5 font-semibold ${deadline.soon ? "text-warn" : "text-foreground"}`}>
                    {deadline.soon && <TriangleAlert size={13} className="shrink-0" />}
                    {new Date(demo.deadline).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <p className={`mt-1 text-xs ${deadline.soon ? "text-warn" : "text-muted"}`}>{deadline.text}</p>
                </>
              ) : (
                <p className="text-muted">Not tracked yet — no delivery deadline on record for this project.</p>
              )}
            </DashCard>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Payment</h2>
            <DashCard className="space-y-2 p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted">Contract value</span>
                <span className="font-medium">{row.bid_amount !== null ? money(row.bid_amount, row.currency) : "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">Marketplace fee</span>
                <span className="font-medium text-muted">{Math.round(MARKETPLACE_FEE_RATE * 100)}%</span>
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-2">
                <span className="text-muted">Est. net</span>
                <span className="font-semibold text-good">{net !== null ? money(net, row.currency) : "—"}</span>
              </div>
              <div className="pt-2">
                <Link href="/finance" className="text-accent hover:underline">
                  View payout in Finance →
                </Link>
              </div>
            </DashCard>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Source listing</h2>
            <DashCard className="p-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Link2 size={13} className={row.project_url ? "text-accent" : "text-muted"} />
                {row.project_url ? (
                  <a href={row.project_url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                    {jobLinkLabel(row)}
                  </a>
                ) : (
                  <span className="font-medium text-muted">{jobLinkLabel(row)}</span>
                )}
              </div>
              {row.recommendation_id && (
                <div className="mt-2">
                  <Link href={`/jobs/${row.recommendation_id}`} className="text-xs text-accent hover:underline">
                    View original job listing →
                  </Link>
                </div>
              )}
            </DashCard>
          </section>
        </StaggerIn>
      </div>
    </Page>
  );
}

/**
 * "At risk" and "On hold" aren't a 4th and 5th step after "In progress" — they're the state
 * "In progress" can be in, so the tracker keeps 3 canonical stages and layers a banner on the
 * current one instead of stretching the stepper into a branch it can't represent honestly.
 */
function DeliveryStage({ demo }: { demo: DemoProject | undefined }) {
  if (!demo) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Delivery status</h2>
        <DashCard className="p-4 text-sm text-muted">
          Delivery isn&apos;t tracked yet for this project — that&apos;ll appear here once the projects API ships.
        </DashCard>
      </section>
    );
  }

  const status = demo.delivery_status;
  const isDelivered = status === "Delivered";
  const currentIndex = status === "Kickoff" ? 0 : isDelivered ? 2 : 1;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Delivery status</h2>
      <DashCard className="p-4">
        <ol className="flex items-start">
          {STAGE_ORDER.map((stage, i) => {
            const done = i < currentIndex || isDelivered;
            const current = i === currentIndex && !isDelivered;
            return (
              <li key={stage} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                      done || (current && i === 2)
                        ? "bg-good text-white"
                        : current
                          ? "bg-accent text-white"
                          : "bg-sunken text-muted"
                    }`}
                  >
                    {done || (current && i === 2) ? <Check size={14} /> : current ? <span className="h-2 w-2 rounded-full bg-white" /> : <CircleDashed size={14} />}
                  </span>
                  <span className={`text-xs font-medium ${current ? "text-foreground" : done ? "text-muted" : "text-muted/70"}`}>
                    {stage}
                  </span>
                </div>
                {i < STAGE_ORDER.length - 1 && (
                  <span className={`mx-2 h-px flex-1 ${done ? "bg-good" : "bg-border"}`} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        {status === "At risk" && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>This project is flagged at risk — the deadline is close and delivery hasn&apos;t caught up.</span>
          </div>
        )}
        {status === "On hold" && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-sunken px-3 py-2 text-sm text-muted">
            <PauseCircle size={15} className="mt-0.5 shrink-0" />
            <span>Work is paused on this project — waiting on the client before it can move again.</span>
          </div>
        )}
      </DashCard>
    </section>
  );
}
