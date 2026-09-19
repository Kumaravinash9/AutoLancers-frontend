"use client";

import { useEffect, useState } from "react";

import { AiSummaryBand } from "@/components/ai-summary-band";
import { ErrorNote } from "@/components/ui";
import { api, isConnectionError, Job } from "@/lib/api";
import { DEMO_JOBS, DEMO_TIME_TO_DRAFT } from "@/lib/demo-data";

const DAY_MS = 24 * 3600_000;
/** Same "good" threshold ScoreBadge already uses elsewhere — reused rather than inventing a
 *  second definition of "high-matched." */
const HIGH_SCORE = 75;

/**
 * Computed from the real job list — revenue and match counts, not invented; the draft-latency
 * figure is illustrative until a timing endpoint exists (see DEMO_TIME_TO_DRAFT).
 */
export function TodayMatchBand({ accountId }: { accountId: string | null }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listJobs({ limit: 200 });
        if (!cancelled) setJobs(result);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setJobs(DEMO_JOBS);
        } else {
          setError(err instanceof Error ? err.message : "Could not load today's matches");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (error) return <ErrorNote>{error}</ErrorNote>;

  const now = Date.now();
  const todayJobs = jobs.filter((j) => j.posted_at && now - new Date(j.posted_at).getTime() <= DAY_MS);
  const highMatched = todayJobs.filter((j) => j.score >= HIGH_SCORE);
  const estRevenue = highMatched
    .filter((j) => j.budget_type === "FIXED" && j.budget_max !== null)
    .reduce((sum, j) => sum + (j.budget_max ?? 0), 0);
  const highestScore = todayJobs.length > 0 ? Math.max(...todayJobs.map((j) => j.score)) : null;

  return (
    <AiSummaryBand
      index={0}
      title="Today's match"
      subtitle="What the pipeline found for you in the last 24 hours."
      loading={loading}
      metrics={[
        { label: "High-matched jobs", value: String(highMatched.length), caption: `score ${HIGH_SCORE}+` },
        {
          label: "Est. revenue if accepted",
          value: estRevenue > 0 ? `$${estRevenue.toLocaleString()}` : "—",
          caption: "fixed-price jobs only",
        },
        { label: "Est. time to draft", value: DEMO_TIME_TO_DRAFT, caption: "from match to ready-to-send" },
        {
          label: "Highest match today",
          value: highestScore !== null ? String(highestScore) : "—",
          caption: "out of 100",
        },
      ]}
    />
  );
}
