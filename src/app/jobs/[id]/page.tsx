"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card, Empty, ErrorNote, Page, ScoreBadge, StatusChip } from "@/components/ui";
import { api, formatAge, formatBudget, Job, JobStatus } from "@/lib/api";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState("");
  // A non-numeric id can never load, so don't start in a loading state for one.
  const [loading, setLoading] = useState(() => !Number.isNaN(Number(params.id)));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State is only set after an await, so this never triggers a cascading render.
  useEffect(() => {
    if (Number.isNaN(jobId)) return; // loading already starts false for a bad id
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
      <Link href="/" className="text-sm text-muted hover:text-foreground">
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
          {/* Copy is the primary action in v1: nothing is ever submitted through the API. */}
          <Button variant="primary" onClick={copyDraft} disabled={!draft.trim()}>
            {copied ? "Copied" : "Copy proposal"}
          </Button>
          <Button onClick={() => save({ proposal_text: draft })} disabled={!dirty || saving}>
            {saving ? "Saving…" : dirty ? "Save edits" : "Saved"}
          </Button>
          <Button
            onClick={() => save({ status: "approved" })}
            disabled={saving || job.status === "approved"}
            title="Mark as sent — you paste it into Freelancer yourself"
          >
            Mark as sent
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await save({ status: "dismissed" });
              router.push("/");
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

      <section className="space-y-2">
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
