"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card, Empty, ErrorNote, Page, ScoreBadge, StatusChip, inputClass } from "@/components/ui";
import { api, BidAvailability, formatAge, formatBudget, Job, JobStatus } from "@/lib/api";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState("");
  // No id means nothing to fetch, so don't start in a loading state.
  const [loading, setLoading] = useState(Boolean(params.id));
  const [saving, setSaving] = useState(false);
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
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

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

  if (loading) return <Page><Empty>Loading…</Empty></Page>;
  if (error && !job) return <Page><ErrorNote>{error}</ErrorNote></Page>;
  if (!job) return <Page><Empty>Job not found.</Empty></Page>;

  const dirty = draft !== (job.proposal_text ?? "");

  return (
    <Page className="space-y-5">
      <Link href="/queue" className="text-sm text-muted hover:text-foreground">
        ← Back to queue
      </Link>

      <div className="flex items-start gap-3">
        <ScoreBadge score={job.score} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold">{job.title || "(untitled)"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{formatBudget(job)}</span>
            <span>{job.bid_count ?? "?"} bids</span>
            <span>{formatAge(job.posted_at)}</span>
            <StatusChip status={job.status} />
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Open on Freelancer ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {job.rejected && job.rejection_reason && (
        <ErrorNote>Rejected: {job.rejection_reason}</ErrorNote>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your proposal</h2>

        {job.proposal_text === null ? (
          <Empty>
            No draft yet. Drafts are generated for the highest-scoring unrejected jobs on each
            fetch — or write one here yourself.
          </Empty>
        ) : null}

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={14}
          placeholder="Write or edit the proposal…"
          className="proposal w-full rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy stays the primary action. Bidding through the API is opt-in and lives in its
              own panel below, behind its own confirmation. */}
          <Button variant="primary" onClick={copyDraft} disabled={!draft.trim()}>
            {copied ? "Copied" : "Copy proposal"}
          </Button>
          <Button onClick={() => save({ proposal_text: draft })} disabled={!dirty || saving}>
            {saving ? "Saving…" : dirty ? "Save edits" : "Saved"}
          </Button>
          <Button
            onClick={() => save({ status: "APPLIED" })}
            disabled={saving || job.status === "APPLIED"}
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
            disabled={saving}
          >
            Dismiss
          </Button>
          <span className="ml-auto text-xs text-muted">
            {draft.trim() ? `${draft.trim().split(/\s+/).length} words` : ""}
          </span>
        </div>
      </section>

      <BidPanel job={job} onPlaced={setJob} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Why it scored {job.score.toFixed(0)}
        </h2>
        {job.reasons.length === 0 ? (
          <Empty>No scoring detail recorded.</Empty>
        ) : (
          <Card>
            <ul className="space-y-1.5 text-sm">
              {job.reasons.map((reason, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-14 shrink-0 tabular-nums text-muted">
                    {reason.points > 0 ? `+${reason.points.toFixed(1)}` : reason.points.toFixed(1)}
                  </span>
                  <span>
                    <strong className="font-medium">{reason.label}</strong>
                    <span className="text-muted"> — {reason.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="space-y-2" id="clients-post">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Client&apos;s post
        </h2>
        <Card>
          <p className="proposal text-sm leading-relaxed">{job.description || "(no description)"}</p>
          {job.skills_listed.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.skills_listed.map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-border px-1.5 py-0.5 text-xs text-muted"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Card>
      </section>
    </Page>
  );
}

/**
 * Placing a real bid.
 *
 * Two deliberate frictions: the button never submits on first press, and the confirm state spells
 * out the exact amount and period. Both are cheap; a wrong bid costs a bid credit and, on a badly
 * matched job, your reputation with that client.
 */
function BidPanel({ job, onPlaced }: { job: Job; onPlaced: (job: Job) => void }) {
  const [availability, setAvailability] = useState<BidAvailability | null>(null);
  const [amount, setAmount] = useState<string>(
    job.bid_amount?.toString() ?? job.budget_max?.toString() ?? "",
  );
  const [days, setDays] = useState<string>(job.bid_period_days?.toString() ?? "7");
  const [arming, setArming] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  if (job.external_bid_id) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your bid</h2>
        <Card className="border-good/40">
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
        </Card>
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
      <Card className="space-y-3">
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

            {noDraft && (
              <p className="text-sm text-muted">Write or generate a proposal before bidding.</p>
            )}

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
              <Button
                onClick={() => setArming(true)}
                disabled={noDraft || !Number(amount) || !Number(days)}
              >
                Place bid…
              </Button>
            )}

            <p className="text-xs text-muted">
              This submits to Freelancer.com and cannot be undone from here.
            </p>
          </>
        )}
      </Card>
    </section>
  );
}
