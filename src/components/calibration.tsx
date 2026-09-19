import { DashCard } from "@/components/app-ui";
import { ProposalStats } from "@/lib/api";

/**
 * The score-vs-outcome stat strip, shared by the Proposals page and the Dashboard so both
 * ever show the same, honestly-caveated numbers — never a second implementation that could
 * quietly drift (e.g. showing a win rate before outcomes actually sync). One unified bar
 * divided by hairlines, same pattern as the dashboard's own metrics rail, rather than four
 * separate boxes.
 */
export function Calibration({ stats }: { stats: ProposalStats }) {
  const cells: { label: string; value: string; note?: string }[] = [
    { label: "Total", value: String(stats.total), note: `${stats.drafted} still drafts` },
    {
      label: "Submitted",
      value: String(stats.submitted),
      note: `${stats.from_recommendation} from our picks`,
    },
    {
      label: "Selected",
      value: stats.outcome_tracking_enabled ? String(stats.accepted) : "—",
      note: stats.outcome_tracking_enabled
        ? `${stats.rejected} not selected`
        : "outcomes not synced yet",
    },
    {
      label: "Avg score sent",
      value: stats.avg_score_submitted?.toFixed(1) ?? "—",
      note: stats.avg_score_accepted
        ? `${stats.avg_score_accepted.toFixed(1)} on won work`
        : "needs outcomes to compare against",
    },
  ];

  return (
    <DashCard className="p-0">
      <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {cells.map((c) => (
          <div key={c.label} className="p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{c.label}</div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums">{c.value}</div>
            {c.note && <p className="mt-2 text-xs text-muted">{c.note}</p>}
          </div>
        ))}
      </div>
    </DashCard>
  );
}
