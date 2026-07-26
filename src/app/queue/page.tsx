"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button, Card, Empty, ErrorNote, Page, ScoreBadge, StatusChip } from "@/components/ui";
import { api, formatAge, formatBudget, Job } from "@/lib/api";

type Tab = "review" | "matched" | "rejected";

const TABS: { key: Tab; label: string; blurb: string }[] = [
  { key: "review", label: "Needs review", blurb: "Scored and drafted, waiting on you." },
  { key: "matched", label: "All matched", blurb: "Everything that cleared your filters." },
  { key: "rejected", label: "Rejected", blurb: "Filtered out, and why." },
];

export default function QueuePage() {
  const [tab, setTab] = useState<Tab>("review");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchJobs = useCallback(async (): Promise<Job[]> => {
    const results = await api.listJobs({ rejected: tab === "rejected" });
    // "Needs review" is the subset you haven't acted on yet — approved and dismissed jobs stay
    // visible under "All matched" but drop out of the working queue.
    return tab === "review"
      ? results.filter((j) => j.status === "NEW" || j.status === "VIEWED")
      : results;
  }, [tab]);

  // State is only set after an await, so this never triggers a cascading render. The cancelled
  // flag stops a slow response from a previous tab overwriting the current one.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchJobs();
        if (!cancelled) {
          setJobs(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchJobs]);

  // Called from event handlers only, where setting state synchronously is fine.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJobs(await fetchJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  async function runNow() {
    setRunning(true);
    setNotice(null);
    setError(null);
    try {
      const report = await api.runPipeline();
      setNotice(
        report.error ??
          `Fetched ${report.fetched} · ${report.new} new · ${report.drafted} drafted` +
            (report.draft_failures ? ` · ${report.draft_failures} draft failures` : ""),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Page className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Job queue</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={runNow} disabled={running}>
            {running ? "Fetching…" : "Fetch now"}
          </Button>
          <Button onClick={load} variant="ghost">
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setLoading(true);
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === t.key
                ? "border-accent font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted">{TABS.find((t) => t.key === tab)?.blurb}</p>

      {notice && <ErrorNote>{notice}</ErrorNote>}
      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <Empty>Loading…</Empty>
      ) : jobs.length === 0 ? (
        <Empty>
          {tab === "rejected"
            ? "Nothing has been rejected yet."
            : "No jobs yet. Connect your account in Settings, then hit Fetch now."}
        </Empty>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobRow job={job} showRejection={tab === "rejected"} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

function JobRow({ job, showRejection }: { job: Job; showRejection: boolean }) {
  return (
    <Card className="transition-colors hover:border-accent/50">
      <div className="flex items-start gap-3">
        <ScoreBadge score={job.score} />
        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${job.id}`} className="font-medium hover:text-accent">
            {job.title || "(untitled)"}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{formatBudget(job)}</span>
            <span>{job.bid_count ?? "?"} bids</span>
            <span>{formatAge(job.posted_at)}</span>
            <StatusChip status={job.status} />
            {job.proposal_text && <span className="text-good">draft ready</span>}
          </div>

          {showRejection && job.rejection_reason && (
            <p className="mt-2 text-sm text-muted">{job.rejection_reason}</p>
          )}

          {job.skills_listed.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.skills_listed.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-border px-1.5 py-0.5 text-xs text-muted"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
