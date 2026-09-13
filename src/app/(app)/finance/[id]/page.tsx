"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, CircleDashed, Download } from "lucide-react";

import { DashCard, StaggerIn } from "@/components/app-ui";
import { Empty, Page } from "@/components/ui";
import { DEMO_PROJECTS, DEMO_PROPOSALS, DEMO_TRANSACTIONS, FinanceTransaction } from "@/lib/demo-data";

/** Same 10% figure finance/page.tsx uses — kept as a local literal there and here since neither
 *  is a real fee schedule yet, just an illustrative placeholder until billing exists. */
const MARKETPLACE_FEE_RATE = 0.1;

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

const STAGE_ORDER: FinanceTransaction["status"][] = ["Pending", "Processing", "Paid"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * There's no payments/billing integration behind any of this yet (see finance/page.tsx's own
 * header comment and Settings → Billing's "not on a paid plan" notice) — DEMO_TRANSACTIONS is
 * the only source that exists, so unlike the other three detail pages this one has no real-data
 * branch or fetch-with-fallback: it's a straight lookup, honestly.
 */
export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const txn = DEMO_TRANSACTIONS.find((t) => t.id === params.id);

  if (!txn)
    return (
      <Page>
        <Empty>Transaction not found.</Empty>
      </Page>
    );

  const gross = txn.amount;
  const fee = gross * MARKETPLACE_FEE_RATE;
  const net = gross - fee;
  const stageIndex = STAGE_ORDER.indexOf(txn.status);

  // Loose title match: DEMO_TRANSACTIONS uses shortened project names in a couple of rows
  // (e.g. "Internal analytics dashboard" vs the project's full "...for a SaaS team" title).
  const linkedProject = DEMO_PROJECTS.find(
    (p) => p.title === txn.project || p.title.startsWith(txn.project) || txn.project.startsWith(p.title),
  );
  const linkedProposal = linkedProject
    ? DEMO_PROPOSALS.find((p) => p.status === "ACCEPTED" && p.project_title === linkedProject.title)
    : undefined;

  return (
    <Page className="space-y-6">
      <Link href="/finance" className="text-sm text-muted hover:text-foreground">
        ← Back to finance
      </Link>

      <div className="flex items-start gap-3 border-b border-border pb-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-white">
          {initials(txn.client)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{txn.project}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-medium text-foreground">{txn.client}</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-figure" aria-hidden="true" />
              {PLATFORM_LABEL[txn.platform]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${STATUS_TONE[txn.status]}`}>
              {txn.status}
            </span>
            <span className="font-mono tabular-nums">
              {txn.amount.toLocaleString(undefined, { style: "currency", currency: txn.currency })}
            </span>
            <span>
              {new Date(txn.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <StaggerIn index={0} className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Payment progress</h2>
            <DashCard className="p-4">
              <ol className="flex items-start">
                {STAGE_ORDER.map((stage, i) => {
                  const done = i < stageIndex;
                  const current = i === stageIndex;
                  return (
                    <li key={stage} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                            done ? "bg-good text-white" : current ? "bg-accent text-white" : "bg-sunken text-muted"
                          }`}
                        >
                          {done ? <Check size={14} /> : current ? <span className="h-2 w-2 rounded-full bg-white" /> : <CircleDashed size={14} />}
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
              <p className="mt-4 text-sm text-muted">
                {txn.status === "Pending" &&
                  `Invoiced ${new Date(txn.date) > new Date() ? "for" : "on"} ${new Date(txn.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} — waiting on the client to release funds.`}
                {txn.status === "Processing" && "Released by the client and clearing through the platform's escrow — usually a few business days before it lands as available balance."}
                {txn.status === "Paid" && "Cleared and paid out — this amount is already reflected in your available balance."}
              </p>
            </DashCard>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Fee breakdown</h2>
            <DashCard className="space-y-2 p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted">Gross amount</span>
                <span className="font-medium">{gross.toLocaleString(undefined, { style: "currency", currency: txn.currency })}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">Marketplace fee ({Math.round(MARKETPLACE_FEE_RATE * 100)}%)</span>
                <span className="font-medium text-warn">
                  −{fee.toLocaleString(undefined, { style: "currency", currency: txn.currency })}
                </span>
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-2">
                <span className="text-muted">Net payout</span>
                <span className="font-semibold text-good">{net.toLocaleString(undefined, { style: "currency", currency: txn.currency })}</span>
              </div>
            </DashCard>
          </section>
        </StaggerIn>

        <StaggerIn index={1} className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Linked project</h2>
            <DashCard className="p-4 text-sm">
              {linkedProposal ? (
                <>
                  <p className="font-medium">{linkedProject!.title}</p>
                  <p className="mt-1 text-xs text-muted">{linkedProject!.delivery_status}</p>
                  <div className="mt-3 border-t border-border pt-3">
                    <Link href={`/projects/${linkedProposal.id}`} className="text-accent hover:underline">
                      View project →
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-muted">Not linked to a tracked project.</p>
              )}
            </DashCard>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Receipt</h2>
            <DashCard className="p-4">
              <button
                type="button"
                disabled
                title="Downloadable receipts aren't available yet"
                className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted opacity-60"
              >
                <Download size={14} aria-hidden="true" />
                Download receipt
              </button>
            </DashCard>
          </section>
        </StaggerIn>
      </div>
    </Page>
  );
}
