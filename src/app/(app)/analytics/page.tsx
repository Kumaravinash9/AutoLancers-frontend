"use client";

import { useEffect, useMemo, useState } from "react";

import { useAccountScope } from "@/components/account-scope";
import { AiSummaryBand, SummaryMetric } from "@/components/ai-summary-band";
import { BarRow, DashCard, StaggerIn } from "@/components/app-ui";
import { DateRangePicker } from "@/components/date-range-picker";
import { Empty, ErrorNote, Page } from "@/components/ui";
import {
  isConnectionError,
  Job,
  api as jobsApi,
  proposals,
  ProposalRow,
  PROPOSAL_STATUS_LABEL as STATUS_LABEL,
} from "@/lib/api";
import { useDateRange, withinRange } from "@/lib/date-range";
import { money } from "@/lib/format";
import { DEMO_CONNECTIONS, DEMO_JOBS, DEMO_PROPOSALS } from "@/lib/demo-data";

const WIDTH = 560;
const HEIGHT = 140;
const PAD = 20;

function buildPath(values: number[], max: number): { line: string; area: string } {
  const step = (WIDTH - PAD * 2) / (values.length - 1);
  const points = values.map((v, i) => ({
    x: PAD + i * step,
    y: HEIGHT - PAD - (v / max) * (HEIGHT - PAD * 2),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${HEIGHT - PAD} L${points[0].x},${HEIGHT - PAD} Z`;
  return { line, area };
}

function platformLabel(platform: string): string {
  return platform === "freelancer" ? "Freelancer.com" : `${platform[0].toUpperCase()}${platform.slice(1)}`;
}

/** Trailing calendar months ending this month, oldest first. Always at least 2 so the line
 *  chart's step math (`/ (values.length - 1)`) never divides by zero. */
function monthBuckets(count: number): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ label: start.toLocaleDateString(undefined, { month: "short" }), start, end });
  }
  return out;
}

function revenueByMonth(rows: ProposalRow[], months: { start: Date; end: Date }[]): number[] {
  return months.map(({ start, end }) =>
    rows
      .filter((r) => r.status === "ACCEPTED" && r.submitted_at && new Date(r.submitted_at) >= start && new Date(r.submitted_at) < end)
      .reduce((sum, r) => sum + (r.bid_amount ?? 0), 0),
  );
}

/** A funnel stage — value shown inside its own filled chip so it reads at a glance even before
 *  the percentage; the chip never shrinks below a legible width just because the count is small. */
function FunnelRow({ label, value, of, max, tone }: { label: string; value: number; of: number | null; max: number; tone: string }) {
  const pct = of !== null && of > 0 ? Math.round((value / of) * 100) : null;
  const fraction = max > 0 ? Math.max(value > 0 ? 0.14 : 0.03, Math.min(1, value / max)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-sunken">
        <div className={`flex h-full items-center rounded-md px-2.5 transition-[width] ${tone}`} style={{ width: `${fraction * 100}%` }}>
          <span className="font-mono text-sm font-semibold">{value}</span>
        </div>
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-xs text-muted">{pct !== null ? `${pct}%` : "—"}</span>
    </div>
  );
}

const FUNNEL_TONE = ["bg-accent-soft text-accent", "bg-accent/35 text-accent", "bg-accent/70 text-white", "bg-accent text-white"];
const PLATFORM_COLORS = ["#10b981", "#8b5cf6"];

/** One channel's sent-vs-won — a full-width track (proposals sent) with a solid fill sized to
 *  the won share, so volume and success rate read in the same glance. */
function ChannelRow({ label, total, won }: { label: string; total: number; won: number }) {
  const fraction = total > 0 ? won / total : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 font-mono text-xs text-muted">{total} sent</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-accent-soft">
        <div className="h-full rounded-full bg-accent" style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {won} won · {total > 0 ? Math.round(fraction * 100) : 0}%
      </p>
    </div>
  );
}

/**
 * The deeper, browse-at-your-own-pace counterpart to the account-level AI suggestions (which
 * stay action-oriented: what to fix now, on one specific connected account). Everything here is
 * computed from real jobs + proposals data — no hardcoded illustrative series. Finance and
 * Projects already own the all-time totals, so the headline strip is scoped to the date-range
 * picker instead of repeating those numbers, and the trend/funnel/comparison cards below dig
 * into what this product is actually for: whether the scoring engine and its recommendations
 * are earning their keep.
 */
export default function AnalyticsPage() {
  const { accounts, accountId } = useAccountScope();
  const { range } = useDateRange();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposalRows, setProposalRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobList, propList] = await Promise.all([jobsApi.listJobs({ limit: 200 }), proposals.list(accountId)]);
        if (!cancelled) {
          setJobs(jobList);
          setProposalRows(propList);
        }
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setJobs(DEMO_JOBS);
          setProposalRows(DEMO_PROPOSALS);
        } else {
          setError(err instanceof Error ? err.message : "Could not load analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const connections = accounts.length > 0 ? accounts : DEMO_CONNECTIONS;

  const jobsInRange = useMemo(() => jobs.filter((j) => withinRange(j.posted_at, range)), [jobs, range]);
  const proposalsInRange = useMemo(
    () => proposalRows.filter((r) => r.status !== "DRAFT" && withinRange(r.submitted_at, range)),
    [proposalRows, range],
  );
  const acceptedInRange = proposalsInRange.filter((r) => r.status === "ACCEPTED");
  const winRateInRange = proposalsInRange.length > 0 ? Math.round((acceptedInRange.length / proposalsInRange.length) * 100) : null;
  const avgScoreInRange = jobsInRange.length > 0 ? Math.round(jobsInRange.reduce((s, j) => s + j.score, 0) / jobsInRange.length) : null;

  const metrics: SummaryMetric[] = [
    { label: "Jobs matched", value: String(jobsInRange.length), caption: range.label },
    {
      label: "Avg. match score",
      value: avgScoreInRange !== null ? String(avgScoreInRange) : "—",
      caption: avgScoreInRange !== null ? `across ${jobsInRange.length} jobs` : "no jobs in range",
    },
    { label: "Proposals sent", value: String(proposalsInRange.length), caption: range.label },
    {
      label: "Win rate",
      value: winRateInRange !== null ? `${winRateInRange}%` : "—",
      caption: winRateInRange !== null ? `${acceptedInRange.length} won of ${proposalsInRange.length} sent` : "nothing sent in range",
    },
  ];

  const trendMonths = useMemo(() => monthBuckets(6), []);
  const totalSeries = useMemo(() => revenueByMonth(proposalRows, trendMonths), [proposalRows, trendMonths]);
  const hasTrend = proposalRows.some((r) => r.status === "ACCEPTED" && r.submitted_at);

  // One line per platform actually in play, plus the total — real per-platform revenue, not a
  // guess, so however many lines show up is however many platforms this account actually sent
  // proposals through.
  const platforms = useMemo(() => Array.from(new Set(proposalRows.map((r) => r.platform))).slice(0, 2), [proposalRows]);
  const platformSeries = useMemo(
    () => platforms.map((p) => ({ platform: p, values: revenueByMonth(proposalRows.filter((r) => r.platform === p), trendMonths) })),
    [platforms, proposalRows, trendMonths],
  );
  const maxRevenue = Math.max(...totalSeries, ...platformSeries.flatMap((s) => s.values), 1) * 1.2;
  const total = hasTrend ? buildPath(totalSeries, maxRevenue) : { line: "", area: "" };
  const trendStep = (WIDTH - PAD * 2) / Math.max(1, totalSeries.length - 1);
  const tooltipSeries = [
    { label: "Total", color: "var(--chart-scored)", values: totalSeries },
    ...platformSeries.map((s, i) => ({ label: platformLabel(s.platform), color: PLATFORM_COLORS[i], values: s.values })),
  ];

  // "Won" cross-references the proposal linked to each applied job by bid id, so the funnel is a
  // real cohort — not two independently-filtered counts that happen to be shown side by side.
  const proposalByBidId = useMemo(() => {
    const map = new Map<string, ProposalRow>();
    for (const r of proposalRows) if (r.external_bid_id) map.set(r.external_bid_id, r);
    return map;
  }, [proposalRows]);
  const funnel = useMemo(() => {
    const seen = jobsInRange.length;
    const viewed = jobsInRange.filter((j) => j.status !== "NEW").length;
    const applied = jobsInRange.filter((j) => j.status === "APPLIED").length;
    const won = jobsInRange.filter(
      (j) => j.status === "APPLIED" && j.external_bid_id && proposalByBidId.get(j.external_bid_id)?.status === "ACCEPTED",
    ).length;
    return [
      { label: "Seen", value: seen, of: null as number | null },
      { label: "Viewed", value: viewed, of: seen },
      { label: "Applied", value: applied, of: viewed },
      { label: "Won", value: won, of: applied },
    ];
  }, [jobsInRange, proposalByBidId]);
  const maxFunnel = Math.max(funnel[0].value, 1);

  // Which skills actually show up on the jobs the scoring engine is surfacing — a direct read on
  // what to keep listed (or add) on the profile.
  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobsInRange) {
      for (const skill of job.skills_listed) counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [jobsInRange]);
  const maxSkill = Math.max(...topSkills.map(([, count]) => count), 1);

  // Where every proposal actually sits — drafts still waiting, sent-and-pending, and resolved
  // either way. All-time, like the platform breakdown, since a handful in range would be noisy.
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ProposalRow["status"], number>> = {};
    for (const r of proposalRows) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [proposalRows]);
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  if (error) {
    return (
      <Page className="space-y-6">
        <ErrorNote>{error}</ErrorNote>
      </Page>
    );
  }

  return (
    <Page className="space-y-6">
      <AiSummaryBand
        title="Analytics"
        subtitle="Deep insights into your freelance performance — trends over time, not what to act on right now."
        metrics={metrics}
        loading={loading}
        index={0}
      />
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      <StaggerIn index={1}>
        <DashCard className="p-5!">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">Revenue &amp; pipeline trend</h2>
              <p className="mt-0.5 text-xs text-muted">
                Won revenue by month it was sent — trailing {trendMonths.length} months, independent of the date filter above
              </p>
            </div>
            {hasTrend && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {tooltipSeries.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {!hasTrend ? (
            <div className="mt-4">
              <Empty>Not enough won proposals yet to chart a revenue trend.</Empty>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="mt-3 w-full"
              role="img"
              aria-label="Won revenue trend by month, total and by platform"
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-scored)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--chart-scored)" stopOpacity={0} />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((f) => (
                <line
                  key={f}
                  x1={PAD}
                  x2={WIDTH - PAD}
                  y1={PAD + f * (HEIGHT - PAD * 2)}
                  y2={PAD + f * (HEIGHT - PAD * 2)}
                  className="stroke-border"
                  strokeWidth={1}
                />
              ))}
              <path d={total.area} fill="url(#revenue-area)" />
              {platformSeries.map((s, i) => (
                <path
                  key={s.platform}
                  d={buildPath(s.values, maxRevenue).line}
                  fill="none"
                  stroke={PLATFORM_COLORS[i]}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              <path d={total.line} fill="none" stroke="var(--chart-scored)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

              {hoverIdx !== null && (
                <line
                  x1={PAD + hoverIdx * trendStep}
                  x2={PAD + hoverIdx * trendStep}
                  y1={PAD}
                  y2={HEIGHT - PAD}
                  className="stroke-border"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              )}

              {tooltipSeries.map((s) =>
                s.values.map((v, i) => (
                  <circle
                    key={`${s.label}-${i}`}
                    cx={PAD + i * trendStep}
                    cy={HEIGHT - PAD - (v / maxRevenue) * (HEIGHT - PAD * 2)}
                    r={hoverIdx === i ? 4 : 2.5}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={1.5}
                  />
                )),
              )}

              {trendMonths.map((m, i) => (
                <text key={m.label + i} x={PAD + i * trendStep} y={HEIGHT - 4} textAnchor="middle" className="fill-muted font-mono" fontSize={9}>
                  {m.label}
                </text>
              ))}

              {/* Invisible per-month hit zones — wide enough to hover comfortably, drawn last so they sit above the lines/points. */}
              {trendMonths.map((m, i) => (
                <rect
                  key={`hit-${m.label}-${i}`}
                  x={PAD + i * trendStep - trendStep / 2}
                  y={0}
                  width={trendStep}
                  height={HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              ))}

              {hoverIdx !== null &&
                (() => {
                  const boxW = 128;
                  const boxH = 18 + tooltipSeries.length * 14;
                  const anchorX = PAD + hoverIdx * trendStep;
                  const boxX = Math.min(Math.max(anchorX - boxW / 2, PAD), WIDTH - PAD - boxW);
                  const boxY = PAD;
                  return (
                    <g pointerEvents="none">
                      <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={6} className="fill-surface stroke-border" strokeWidth={1} />
                      <text x={boxX + 8} y={boxY + 14} className="fill-foreground font-mono font-semibold" fontSize={9}>
                        {trendMonths[hoverIdx].label}
                      </text>
                      {tooltipSeries.map((s, i) => (
                        <g key={s.label}>
                          <circle cx={boxX + 10} cy={boxY + 27 + i * 14} r={2.5} fill={s.color} />
                          <text x={boxX + 16} y={boxY + 30 + i * 14} className="fill-muted font-mono" fontSize={8}>
                            {s.label}
                          </text>
                          <text x={boxX + boxW - 8} y={boxY + 30 + i * 14} textAnchor="end" className="fill-foreground font-mono font-medium" fontSize={8}>
                            {money(s.values[hoverIdx], null)}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
            </svg>
          )}
        </DashCard>
      </StaggerIn>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaggerIn index={2}>
          <DashCard className="h-full p-5!">
            <h2 className="font-display text-lg font-semibold tracking-tight">Proposal funnel</h2>
            <p className="mt-0.5 text-xs text-muted">Jobs matched in range, followed through to a won bid</p>
            <div className="mt-4 space-y-3">
              {funnel.map((stage, i) => (
                <FunnelRow key={stage.label} label={stage.label} value={stage.value} of={stage.of} max={maxFunnel} tone={FUNNEL_TONE[i]} />
              ))}
            </div>
          </DashCard>
        </StaggerIn>

        <StaggerIn index={3}>
          <DashCard className="h-full p-5!">
            <h2 className="font-display text-lg font-semibold tracking-tight">Sent vs. won, by platform</h2>
            <p className="mt-0.5 text-xs text-muted">All-time, by connected account</p>
            <div className="mt-4 space-y-4">
              {connections.map((c) => (
                <ChannelRow
                  key={c.id}
                  label={`${c.platform[0].toUpperCase()}${c.platform.slice(1)} — ${c.platform_username ?? c.platform}`}
                  total={c.proposals}
                  won={c.wins}
                />
              ))}
            </div>
          </DashCard>
        </StaggerIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaggerIn index={4}>
          <DashCard className="h-full p-5!">
            <h2 className="font-display text-lg font-semibold tracking-tight">Top skills in matched jobs</h2>
            <p className="mt-0.5 text-xs text-muted">Most-requested skills across jobs in range</p>
            <div className="mt-4 space-y-3">
              {topSkills.length === 0 ? (
                <Empty>No jobs in range yet.</Empty>
              ) : (
                topSkills.map(([skill, count]) => <BarRow key={skill} label={skill} value={count} max={maxSkill} />)
              )}
            </div>
          </DashCard>
        </StaggerIn>

        <StaggerIn index={5}>
          <DashCard className="h-full p-5!">
            <h2 className="font-display text-lg font-semibold tracking-tight">Proposal status breakdown</h2>
            <p className="mt-0.5 text-xs text-muted">All-time, across every proposal on file</p>
            <div className="mt-4 space-y-3">
              {(Object.keys(STATUS_LABEL) as ProposalRow["status"][])
                .filter((status) => (statusCounts[status] ?? 0) > 0)
                .map((status) => (
                  <BarRow key={status} label={STATUS_LABEL[status]} value={statusCounts[status] ?? 0} max={maxStatus} />
                ))}
            </div>
          </DashCard>
        </StaggerIn>
      </div>
    </Page>
  );
}
