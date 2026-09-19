"use client";

import { useState } from "react";

import { useAccountScope } from "@/components/account-scope";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { NeedsReviewTable } from "@/components/dashboard/needs-review-table";
import { PipelineChartCard } from "@/components/dashboard/pipeline-chart-card";
import { RecentProposalsCard } from "@/components/dashboard/recent-proposals-card";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TodayMatchBand } from "@/components/dashboard/today-match-band";
import { Button, Page } from "@/components/ui";

/**
 * Home for a signed-in user. Every card fetches independently, so one dead call never blanks
 * out the rest of the page. Refresh remounts every card (via `refreshKey`) rather than reaching
 * into each one's internals — same effect as a real refetch, without touching six components.
 */
export default function DashboardPage() {
  const { accountId, accounts, ready } = useAccountScope();
  const [refreshKey, setRefreshKey] = useState(0);

  const primary = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const firstName = primary?.display_name?.split(" ")[0];

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            What needs your attention, and what you&apos;ve sent lately.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setRefreshKey((k) => k + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      {ready && (
        <>
          <TodayMatchBand key={`today-${refreshKey}`} accountId={accountId} />

          <StatCards key={`stats-${refreshKey}`} accountId={accountId} />

          <NeedsReviewTable key={`review-${refreshKey}`} accountId={accountId} />

          <div className="grid items-stretch gap-4 lg:grid-cols-[2fr_1fr]">
            <PipelineChartCard key={`pipeline-${refreshKey}`} />
            <InsightsCard key={`insights-${refreshKey}`} />
          </div>

          <RecentProposalsCard key={`proposals-${refreshKey}`} accountId={accountId} />
        </>
      )}
    </Page>
  );
}
