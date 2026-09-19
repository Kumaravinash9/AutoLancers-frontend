"use client";

import { DashCard, StaggerIn } from "@/components/app-ui";
import { Page } from "@/components/ui";

function ToggleRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
      <span
        className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full bg-sunken opacity-60"
        title="Coming soon"
        aria-disabled="true"
      >
        <span className="ml-0.5 h-4 w-4 rounded-full bg-surface shadow-(--shadow-sm)" />
      </span>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Page className="space-y-6">
      <StaggerIn index={0}>
        <DashCard className="p-5!">
          <p className="text-sm text-muted">
            Digest delivery isn&apos;t wired up yet — everything below is what&apos;s planned, shown
            disabled rather than hidden so you know it&apos;s coming rather than missing.
          </p>
          <div className="mt-4 divide-y divide-border">
            <ToggleRow label="Daily digest email" detail="New matches, items waiting on you, and win-rate changes." />
            <ToggleRow label="High-score alert" detail="Ping the moment a job scores above your threshold." />
            <ToggleRow label="Weekly summary" detail="A once-a-week recap, good for sharing with a client or partner." />
          </div>
        </DashCard>
      </StaggerIn>
    </Page>
  );
}
