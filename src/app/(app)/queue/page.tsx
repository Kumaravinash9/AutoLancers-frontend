"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AiSummaryBand } from "@/components/ai-summary-band";
import { DashCard, StaggerIn } from "@/components/app-ui";
import { JobBadge, JobTable } from "@/components/job-table";
import { Button, ErrorNote, Page } from "@/components/ui";
import { api, isConnectionError, Job } from "@/lib/api";
import { DEMO_JOBS } from "@/lib/demo-data";

type Tab = "apply" | "ready" | "review" | "low" | "ignore";

const TABS: { key: Tab; label: string }[] = [
  { key: "apply", label: "Apply immediately" },
  { key: "ready", label: "Proposal ready" },
  { key: "review", label: "Needs review" },
  { key: "low", label: "Low priority" },
  { key: "ignore", label: "Ignored" },
];

const DAY_MS = 24 * 3600_000;
/** Same "good" threshold ScoreBadge already uses elsewhere. */
const HIGH_SCORE = 75;
/** A step above that — the score band worth bidding on the moment you see it. */
const APPLY_SCORE = 90;
/** Same floor demo-data's own profile uses for `min_match_score`. */
const LOW_SCORE = 55;

/** One job belongs to exactly one tab — a drafted job is "ready" regardless of score, a
 *  rejected one is "ignored" regardless of anything else, and score alone sorts the rest. */
function classify(job: Job): Tab {
  if (job.rejected) return "ignore";
  if (job.proposal_text) return "ready";
  if (job.score >= APPLY_SCORE) return "apply";
  if (job.score < LOW_SCORE) return "low";
  return "review";
}

export default function QueuePage() {
  const [tab, setTab] = useState<Tab>("apply");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listJobs({ limit: 200 });
      setJobs(result);
    } catch (err) {
      if (isConnectionError(err)) {
        setJobs(DEMO_JOBS);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { apply: 0, ready: 0, review: 0, low: 0, ignore: 0 };
    for (const job of jobs) counts[classify(job)]++;
    return counts;
  }, [jobs]);

  const visibleJobs = jobs
    .filter((j) => classify(j) === tab)
    .filter((j) => !search.trim() || j.title.toLowerCase().includes(search.trim().toLowerCase()));

  function getBadges(job: Job): JobBadge[] {
    const badges: JobBadge[] = [];
    if (tab !== "ready" && job.proposal_text) badges.push({ label: "Proposal ready", tone: "good" });
    if (job.bid_count !== null && job.bid_count <= 8) badges.push({ label: "Low competition", tone: "good" });
    if (job.posted_at && Date.now() - new Date(job.posted_at).getTime() <= 2 * 3600_000) {
      badges.push({ label: "Just posted", tone: "muted" });
    }
    return badges.slice(0, 2);
  }

  const now = Date.now();
  const todayJobs = jobs.filter((j) => j.posted_at && now - new Date(j.posted_at).getTime() <= DAY_MS);
  const highMatched = jobs.filter((j) => !j.rejected && j.score >= HIGH_SCORE);
  const readyToSubmit = jobs.filter((j) => !j.rejected && j.proposal_text && j.status !== "APPLIED");
  const potentialRevenue = highMatched
    .filter((j) => j.budget_type === "FIXED" && j.budget_max !== null)
    .reduce((sum, j) => sum + (j.budget_max ?? 0), 0);

  return (
    <Page className="space-y-5">
      <div className="flex justify-end">
        <Button variant="primary" onClick={runNow} disabled={running}>
          {running ? "Fetching…" : "Fetch now"}
        </Button>
      </div>

      {notice && <ErrorNote>{notice}</ErrorNote>}
      {error && <ErrorNote>{error}</ErrorNote>}

      <AiSummaryBand
        index={0}
        title="AI summary"
        subtitle="What's in your queue right now."
        loading={loading}
        metrics={[
          { label: "Jobs scanned today", value: String(todayJobs.length), caption: "posted in the last 24h" },
          { label: "Recommended / high match", value: String(highMatched.length), caption: `score ${HIGH_SCORE}+` },
          { label: "Proposal ready to submit", value: String(readyToSubmit.length), caption: "drafted, not yet sent" },
          {
            label: "Potential revenue, recommended",
            value: potentialRevenue > 0 ? `$${potentialRevenue.toLocaleString()}` : "—",
            caption: "fixed-price jobs only",
          },
        ]}
      />

      <div className="relative sm:max-w-xs">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search job titles…"
          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-sunken p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-surface text-foreground ring-1 ring-border/60" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {!loading && (
              <span className={`font-mono text-xs ${tab === t.key ? "text-accent" : "text-muted"}`}>
                {tabCounts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <StaggerIn index={1}>
        <DashCard className="p-5!">
          <JobTable
            jobs={visibleJobs}
            loading={loading}
            skeletonRows={6}
            variant={tab === "ignore" ? "reason" : "status"}
            getBadges={getBadges}
            emptyMessage={
              tab === "ignore"
                ? "Nothing has been filtered out yet."
                : search
                  ? "No jobs match your search."
                  : "No jobs yet. Connect your account in Settings, then hit Fetch now."
            }
          />
        </DashCard>
      </StaggerIn>
    </Page>
  );
}
