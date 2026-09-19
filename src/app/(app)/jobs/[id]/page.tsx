"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashCard, StaggerIn } from "@/components/app-ui";
import {
  Button,
  Empty,
  ErrorNote,
  inputClass,
  Page,
  PlatformTag,
  ScoreBadge,
  StatusChip,
} from "@/components/ui";
import {
  api,
  BidAvailability,
  formatAge,
  formatBudget,
  isConnectionError,
  Job,
  JobStatus,
} from "@/lib/api";
import { DEMO_JOBS } from "@/lib/demo-data";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState("");
  const [linkable, setLinkable] = useState(true);
  // No id means nothing to fetch, so don't start in a loading state.
  const [loading, setLoading] = useState(Boolean(params.id));
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State is only set after an await, so this never triggers a cascading render.
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await api.getJob(jobId);
        if (!cancelled) {
          setJob(result);
          setDraft(result.proposal_text ?? "");
          setLinkable(true);
        }
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          const fallback = DEMO_JOBS.find((j) => j.id === jobId) ?? DEMO_JOBS[0];
          setJob(fallback);
          setDraft(fallback.proposal_text ?? "");
          setLinkable(false);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load job");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function writeDraft() {
    setDrafting(true);
    setError(null);
    try {
      const updated = await api.draft(jobId);
      setJob(updated);
      setDraft(updated.proposal_text ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not draft");
    } finally {
      setDrafting(false);
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard is blocked — select the text and copy manually.");
    }
  }

  async function save(patch: { proposal_text?: string; status?: JobStatus }) {
    setSaving(true);
    setError(null);
    try {
      setJob(await api.patchJob(jobId, patch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Page className="space-y-6">
        <div className="skeleton h-4 w-28 rounded" />
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
  if (error && !job) return <Page><ErrorNote>{error}</ErrorNote></Page>;
  if (!job) return <Page><Empty>Job not found.</Empty></Page>;

  const dirty = draft !== (job.proposal_text ?? "");
  const maxReasonPoints = Math.max(1, ...job.reasons.map((r) => Math.abs(r.points)));

  return (
    <Page className="space-y-6">
      <Link href="/queue" className="text-sm text-muted hover:text-foreground">
        ← Back to queue
      </Link>

      <div className="flex items-start gap-3 border-b border-border pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{job.title || "(untitled)"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <PlatformTag platform={job.platform} />
            <span className="font-mono tabular-nums">{formatBudget(job)}</span>
            <span>{job.bid_count ?? "?"} bids</span>
            <span>{formatAge(job.posted_at)}</span>
            <StatusChip status={job.status} />
            {job.url && (
              <a href={job.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Open on Freelancer ↗
              </a>
            )}
          </div>
        </div>
        <ScoreBadge score={job.score} size="lg" />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {job.has_changes && (
        <ErrorNote>
          This listing changed{job.changed_at ? ` ${formatAge(job.changed_at)}` : ""} since you first
          saw it — worth a re-read before you bid.
        </ErrorNote>
      )}
      {job.rejected && job.rejection_reason && (
        <ErrorNote>Auto-rejected by scoring: {job.rejection_reason}</ErrorNote>
      )}
      {!job.rejected && job.status === "DISMISSED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-sunken px-3 py-2 text-sm">
          <span>You dismissed this job — it won&apos;t reappear in the queue unless you bring it back.</span>
          <Button variant="ghost" onClick={() => save({ status: "NEW" })} disabled={saving || !linkable}>
            Reconsider
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <StaggerIn index={0} className="space-y-2 lg:col-start-1 lg:row-start-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your proposal</h2>

          {job.proposal_text === null && (
            <DashCard className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-muted">
                No draft yet. Each fetch only drafts the highest-scoring jobs, so this one is waiting
                its turn.
              </p>
              <Button variant="primary" onClick={writeDraft} disabled={drafting || !linkable}>
                {drafting ? "Writing…" : "Draft with AI"}
              </Button>
            </DashCard>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            placeholder="Write or edit the proposal…"
            className="proposal w-full rounded-lg bg-surface p-3 text-sm leading-relaxed ring-1 ring-border/60 outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy stays enabled even on demo data — it's a pure client-side clipboard action,
                nothing to save. Every other action needs the backend to persist anything. */}
            <Button variant="primary" onClick={copyDraft} disabled={!draft.trim()}>
              {copied ? "Copied" : "Copy proposal"}
            </Button>
            <Button onClick={() => save({ proposal_text: draft })} disabled={!dirty || saving || !linkable}>
              {saving ? "Saving…" : dirty ? "Save edits" : "Saved"}
            </Button>
            {job.proposal_text !== null && (
              <Button
                onClick={writeDraft}
                disabled={drafting || !linkable}
                title="Writes a fresh draft. The current one is kept as a version, so this is never destructive."
              >
                {drafting ? "Rewriting…" : "Rewrite with AI"}
              </Button>
            )}
            <Button
              onClick={() => save({ status: "APPLIED" })}
              disabled={saving || job.status === "APPLIED" || !linkable}
              title="Mark as sent — you paste it into Freelancer yourself"
            >
              Mark as sent
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await save({ status: "DISMISSED" });
                router.push("/queue");
              }}
              disabled={saving || !linkable}
            >
              Dismiss
            </Button>
            <span className="ml-auto text-xs text-muted">
              {draft.trim() ? `${draft.trim().split(/\s+/).length} words` : ""}
            </span>
          </div>
        </StaggerIn>

        <StaggerIn index={1} className="space-y-6 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Why it scored {job.score.toFixed(0)}
            </h2>
            {job.reasons.length === 0 ? (
              <Empty>No scoring detail recorded.</Empty>
            ) : (
              <DashCard className="space-y-3 p-4">
                {job.reasons.map((reason, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{reason.label}</span>
                      <span className={`shrink-0 font-mono text-xs tabular-nums ${reason.points >= 0 ? "text-good" : "text-warn"}`}>
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
            )}
          </section>

          <BidPanel job={job} linkable={linkable} onPlaced={setJob} />
        </StaggerIn>

        <StaggerIn index={2} className="space-y-6 lg:col-start-1 lg:row-start-2">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Client&apos;s post</h2>
            <DashCard className="p-4">
              <p className="proposal text-sm leading-relaxed">{job.description || "(no description)"}</p>
              {job.skills_listed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {job.skills_listed.map((skill) => (
                    <span key={skill} className="rounded bg-sunken px-1.5 py-0.5 text-xs text-muted">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </DashCard>
          </section>

          <ClientInfo job={job} />
        </StaggerIn>
      </div>
    </Page>
  );
}

/**
 * Client-quality signal — the "who's actually posting this" context Upwork's own listing page
 * (and third-party tools like Vollna/Vibeworker) surface alongside a job. All fields are
 * optional (see the comment on `Job` in lib/api.ts) — no real endpoint returns them yet, so this
 * section renders nothing on a real job until the backend adds it, rather than a fabricated
 * "unverified" claim about someone real.
 */
function ClientInfo({ job }: { job: Job }) {
  const hasAny =
    job.client_country != null ||
    job.client_rating != null ||
    job.client_total_spend != null ||
    job.client_hire_rate != null ||
    job.client_payment_verified != null;
  if (!hasAny) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">About the client</h2>
      <DashCard className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {job.client_payment_verified != null && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                job.client_payment_verified ? "bg-good/15 text-good" : "bg-sunken text-muted"
              }`}
            >
              {job.client_payment_verified ? "Payment verified" : "Payment not verified"}
            </span>
          )}
          {job.client_country && <span className="text-xs text-muted">{job.client_country}</span>}
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Rating</dt>
            <dd className="font-medium">
              {job.client_rating != null
                ? `${job.client_rating.toFixed(1)}★ (${job.client_reviews_count ?? 0})`
                : "No rating yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Total spent</dt>
            <dd className="font-medium">
              {job.client_total_spend != null ? `$${job.client_total_spend.toLocaleString()}` : "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Hire rate</dt>
            <dd className="font-medium">
              {job.client_hire_rate != null ? `${job.client_hire_rate}%` : "Unknown"}
            </dd>
          </div>
        </dl>
      </DashCard>
    </section>
  );
}

/**
 * Placing a real bid.
 *
 * Two deliberate frictions: the button never submits on first press, and the confirm state spells
 * out the exact amount and period. Both are cheap; a wrong bid costs a bid credit and, on a badly
 * matched job, your reputation with that client.
 */
function BidPanel({
  job,
  linkable,
  onPlaced,
}: {
  job: Job;
  linkable: boolean;
  onPlaced: (job: Job) => void;
}) {
  const [availability, setAvailability] = useState<BidAvailability | null>(() =>
    linkable ? null : { available: false, reason: "Connect the backend to enable bidding." },
  );
  const [amount, setAmount] = useState<string>(
    job.bid_amount?.toString() ?? job.budget_max?.toString() ?? "",
  );
  const [days, setDays] = useState<string>(job.bid_period_days?.toString() ?? "7");
  const [arming, setArming] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkable) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await api.bidAvailability();
        if (!cancelled) setAvailability(result);
      } catch {
        if (!cancelled) setAvailability({ available: false, reason: "Backend unreachable." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkable]);

  if (job.external_bid_id) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your bid</h2>
        <DashCard className="p-4">
          <p className="text-sm">
            Bid placed for{" "}
            <strong>
              {job.bid_amount?.toFixed(0)} {job.currency ?? ""}
            </strong>{" "}
            over {job.bid_period_days} days.
          </p>
          <p className="mt-1 text-xs text-muted">
            Freelancer bid {job.external_bid_id}
            {job.bid_submitted_at && ` · ${new Date(job.bid_submitted_at).toLocaleString()}`}
          </p>
        </DashCard>
      </section>
    );
  }

  const blocked = availability && !availability.available;
  const noDraft = !job.proposal_text?.trim();

  async function place() {
    setPlacing(true);
    setError(null);
    try {
      await api.placeBid(job.id, {
        amount: Number(amount),
        period_days: Number(days),
        confirm: true,
      });
      onPlaced(await api.getJob(job.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bid failed");
      setArming(false);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Place a bid</h2>
      <DashCard className="space-y-3 p-4">
        {availability === null ? (
          <p className="text-sm text-muted">Checking whether bidding is available…</p>
        ) : blocked ? (
          <p className="text-sm text-muted">{availability.reason}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">
                  Amount {job.currency ? `(${job.currency})` : ""}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setArming(false);
                  }}
                  className={`${inputClass} w-32`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Delivery (days)</span>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    setArming(false);
                  }}
                  className={`${inputClass} w-24`}
                />
              </label>
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            {noDraft && <p className="text-sm text-muted">Write or generate a proposal before bidding.</p>}

            {arming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">
                  Send this proposal and bid {Number(amount).toFixed(0)} {job.currency ?? ""} over{" "}
                  {days} days?
                </span>
                <Button variant="primary" onClick={place} disabled={placing}>
                  {placing ? "Placing…" : "Yes, place the bid"}
                </Button>
                <Button variant="ghost" onClick={() => setArming(false)} disabled={placing}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setArming(true)} disabled={noDraft || !Number(amount) || !Number(days)}>
                Place bid…
              </Button>
            )}

            <p className="text-xs text-muted">This submits to Freelancer.com and cannot be undone from here.</p>
          </>
        )}
      </DashCard>
    </section>
  );
}
