"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  AlignLeft,
  ArrowUp,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  GraduationCap,
  Image as ImageIcon,
  Scissors,
  Sparkles,
  Target,
  Type,
  X,
} from "lucide-react";

import { Avatar, SkillTag } from "@/app/(app)/profile/page";
import { useAccountScope } from "@/components/account-scope";
import { DashCard, StaggerIn } from "@/components/app-ui";
import { Button, Empty, ErrorNote, Page, PlatformTag, ScoreBadge } from "@/components/ui";
import {
  Connection,
  connections as connectionsApi,
  formatAge,
  isConnectionError,
  ProfileDetail,
  profiles,
  ProposalRow,
  proposals as proposalsApi,
} from "@/lib/api";
import {
  DEMO_CONNECTIONS,
  DEMO_PROFILE_DETAIL,
  DEMO_PROFILE_DIAGNOSIS,
  DEMO_PROFILE_DIAGNOSIS_FALLBACK,
  DEMO_PROPOSALS,
  ProfileDiagnosis,
  ProfileSuggestion,
  ProfileSuggestionCategory,
} from "@/lib/demo-data";

const CATEGORY_LABEL: Record<ProfileSuggestionCategory, string> = {
  tagline: "Tagline",
  overview: "Overview",
  skill: "Skills",
  portfolio: "Portfolio",
  rate: "Rate",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
};

const CATEGORY_ICON: Record<ProfileSuggestionCategory, typeof Type> = {
  tagline: Type,
  overview: AlignLeft,
  skill: Scissors,
  portfolio: ImageIcon,
  rate: DollarSign,
  experience: Briefcase,
  education: GraduationCap,
  certifications: Award,
};

const CATEGORY_ORDER: ProfileSuggestionCategory[] = [
  "tagline",
  "overview",
  "skill",
  "portfolio",
  "rate",
  "experience",
  "education",
  "certifications",
];

function diagnosisFor(platform: string): ProfileDiagnosis {
  return DEMO_PROFILE_DIAGNOSIS[platform] ?? DEMO_PROFILE_DIAGNOSIS_FALLBACK;
}

function scoreTone(score: number) {
  if (score < 60) return { label: "Needs improvement", text: "text-danger", bg: "bg-danger/15", bar: "bg-danger", Icon: AlertTriangle };
  if (score < 80) return { label: "Good progress", text: "text-warn", bg: "bg-warn/15", bar: "bg-warn", Icon: AlertTriangle };
  return { label: "Excellent", text: "text-good", bg: "bg-good/15", bar: "bg-good", Icon: CheckCircle2 };
}

/**
 * One connected profile, in full — a single marketplace connection (Upwork, Freelancer.com),
 * not to be confused with /account (your one Autolancer account).
 *
 * Everything shown here belongs to the connected profile itself — the picture, handle, tagline,
 * summary, skills, rate and reviews as the marketplace holds them, plus every bid placed from
 * it. Your Autolancer account and its matching setup are a separate thing and get a link, not a
 * panel: someone opening a connected profile wants to see what a client would see, not how we
 * rank jobs for it.
 *
 * AI Suggestions are scoped to this specific connected profile (Freelancer vs. Upwork get
 * different gaps) — there's no suggestion endpoint yet, so this is always the illustrative demo
 * set looked up by platform, shown whether it came from the real API or the demo fallback below.
 *
 * Built from endpoints that already exist: the connections list, the profile detail, and the
 * proposals list scoped by connection.
 */
export default function ConnectedProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accountId, select } = useAccountScope();

  const [account, setAccount] = useState<Connection | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [bids, setBids] = useState<ProposalRow[]>([]);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [linkable, setLinkable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string[] | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    void (async () => {
      try {
        const [conns, cards, rows] = await Promise.all([
          connectionsApi.list(),
          profiles.list(),
          proposalsApi.list(params.id),
        ]);
        const found = conns.find((c) => c.id === params.id) ?? null;
        const detail = cards[0] ? await profiles.get(cards[0].id) : null;
        if (cancelled) return;
        setAccount(found);
        setProfile(detail);
        setBids(rows);
        if (found) {
          const d = diagnosisFor(found.platform);
          setSuggestions(d.suggestions);
          setActiveSuggestionId(d.suggestions[0]?.id ?? null);
        }
        setLinkable(true);
        if (!found) setError("That profile isn't connected any more.");
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          const demoAccount = DEMO_CONNECTIONS.find((c) => c.id === params.id) ?? DEMO_CONNECTIONS[0];
          const d = diagnosisFor(demoAccount.platform);
          setAccount(demoAccount);
          setProfile(DEMO_PROFILE_DETAIL);
          // DEMO_PROPOSALS spans every demo platform at once (it backs the site-wide Proposals
          // page too) — a single connected profile only ever sees its own platform's bids.
          setBids(DEMO_PROPOSALS.filter((p) => p.platform === demoAccount.platform));
          setSuggestions(d.suggestions);
          setActiveSuggestionId(d.suggestions[0]?.id ?? null);
          setLinkable(false);
        } else {
          setError(err instanceof Error ? err.message : "Could not load the connected profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function sync() {
    if (!profile) return;
    setSyncing(true);
    setSyncNote(null);
    try {
      const r = await profiles.sync(profile.id);
      setSyncNote([
        r.board_error
          ? `Jobs: ${r.board_error}`
          : `Jobs: ${r.board_fetched} seen · ${r.board_new} new · ${r.board_changed} changed`,
        r.bids_error
          ? `Bids: ${r.bids_error}`
          : `Bids: ${r.bids_fetched} found · ${r.outcomes_updated} outcomes updated`,
      ]);
      setBids(await proposalsApi.list(params.id));
    } catch (err) {
      setSyncNote([err instanceof Error ? err.message : "Sync failed"]);
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (!account) return;
    const name = account.platform_username ?? account.platform;
    if (!window.confirm(`Disconnect ${name}? Its bid history is kept; you'd need to reconnect.`))
      return;
    try {
      await connectionsApi.remove(account.id);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect");
    }
  }

  // No suggestion endpoint exists yet — "Apply" makes the one part of a suggestion that can be
  // real (adding a skill, changing the listed rate) straight on this account's live fields, the
  // same optimistic-local pattern the old skill-suggestion flow used. "Discard" just clears it
  // from view. Neither persists anywhere.
  function removeSuggestion(id: string) {
    setSuggestions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      setActiveSuggestionId((current) => {
        if (current !== id) return current;
        const removed = prev.find((x) => x.id === id);
        const sameCategory = removed ? next.find((x) => x.category === removed.category) : undefined;
        return sameCategory?.id ?? next[0]?.id ?? null;
      });
      return next;
    });
  }

  function applySuggestion(s: ProfileSuggestion) {
    if (account) {
      if (s.category === "skill" && s.addSkill && !account.account_skills.includes(s.addSkill)) {
        setAccount({ ...account, account_skills: [...account.account_skills, s.addSkill] });
      } else if (s.category === "rate" && s.applyRate !== undefined) {
        setAccount({ ...account, hourly_rate: s.applyRate });
      }
    }
    removeSuggestion(s.id);
  }

  function dismissSuggestion(s: ProfileSuggestion) {
    removeSuggestion(s.id);
  }

  function jumpToSuggestion(s: ProfileSuggestion) {
    setActiveSuggestionId(s.id);
    document.getElementById("suggestions-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading)
    return (
      <Page className="space-y-8">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="flex justify-end gap-2">
          <div className="skeleton h-9 w-24 rounded-md" />
          <div className="skeleton h-9 w-20 rounded-md" />
        </div>
        <DashCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-1 items-start gap-4">
              <div className="skeleton h-16 w-16 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton h-3 w-56 rounded" />
              </div>
            </div>
            <div className="skeleton h-24 w-full rounded-2xl sm:w-56" />
          </div>
        </DashCard>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </Page>
    );
  if (!account)
    return (
      <Page className="space-y-4">
        <Link href="/profile" className="text-sm text-muted hover:text-foreground">
          ← All profiles
        </Link>
        <ErrorNote>{error ?? "Not found."}</ErrorNote>
      </Page>
    );

  const handle = account.platform_username ?? "unnamed profile";
  const isSelected = accountId === account.id;
  const won = bids.filter((b) => b.status === "ACCEPTED");
  const diagnosis = diagnosisFor(account.platform);

  return (
    <Page className="space-y-8">
      <Link href="/profile" className="text-sm text-muted hover:text-foreground">
        ← All profiles
      </Link>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="font-mono text-xs text-muted">
          bids {account.last_synced_at ? `synced ${formatAge(account.last_synced_at)}` : "never synced"}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={sync} disabled={syncing || !linkable}>
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
          <Button
            onClick={() => void select(isSelected ? null : account.id)}
            title={isSelected ? "Go back to showing every profile" : "Filter the app to this one"}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
          <Button variant="ghost" onClick={disconnect} disabled={!linkable}>
            Disconnect
          </Button>
        </div>
      </div>

      <StaggerIn index={0}>
        <DiagnosisHero account={account} diagnosis={diagnosis} handle={handle} />
      </StaggerIn>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
        <span>@{handle}</span>
        {account.country && <span>{account.country}</span>}
        {account.hourly_rate ? (
          <span>
            {account.hourly_rate} {account.currency ?? ""}/hr
          </span>
        ) : null}
        {/* A rating only appears once the marketplace has one to give. Printing "0★ from 0
            reviews" would read as a bad score rather than an absent one. */}
        <span>
          {account.rating
            ? `${account.rating}★ from ${account.total_reviews ?? 0} reviews`
            : "no rating yet"}
        </span>
        {account.member_since && <span>member since {new Date(account.member_since).getFullYear()}</span>}
        {/* The granted scope decides whether bidding from here is even possible, so say it
            outright instead of counting tokens in a string nobody can see. */}
        <span title={account.scope ?? "no scope recorded"}>
          {account.scope?.includes("bid") ? "can place bids" : "read only"}
        </span>
        {profile && (
          <Link href="/account" className="hover:text-accent">
            your account →
          </Link>
        )}
      </div>

      {syncNote && (
        <ul className="space-y-0.5 font-mono text-xs text-muted">
          {syncNote.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <StaggerIn index={1}>
          <StrengthBreakdown metrics={diagnosis.metrics} />
        </StaggerIn>
        <StaggerIn index={1}>
          <TopPriorities suggestions={suggestions} onSelect={jumpToSuggestion} />
        </StaggerIn>
      </div>

      <StaggerIn index={2}>
        <SuggestionsWorkbench
          account={account}
          suggestions={suggestions}
          activeSuggestionId={activeSuggestionId}
          onSelectSuggestion={setActiveSuggestionId}
          onApply={applySuggestion}
          onDiscard={dismissSuggestion}
        />
      </StaggerIn>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bids placed" value={account.proposals} />
        <Stat label="Won" value={account.wins} />
        <Stat
          label="From our picks"
          value={bids.filter((b) => b.was_recommended).length}
          note="the rest you found yourself"
        />
        {account.portfolio_count !== null && (
          <Stat label="Portfolio items" value={account.portfolio_count} note="on the marketplace" />
        )}
      </section>

      {/* Everything below comes from the marketplace, not from us — this is the profile as a
          client browsing Freelancer.com would find it. */}
      {account.summary && (
        <Section title="Summary">
          <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted">{account.summary}</p>
        </Section>
      )}

      <Section title={`Skills on this profile · ${account.account_skills.length}`}>
        {account.account_skills.length === 0 ? (
          <Empty>
            No skills listed on this profile. Add them on {platformName(account.platform)} and sync.
          </Empty>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {account.account_skills.map((skill) => (
              <SkillTag key={skill}>{skill}</SkillTag>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Bids from this profile · ${bids.length}`}>
        {bids.length === 0 ? (
          <Empty>
            No bids yet on this profile. Sync pulls in anything placed on the marketplace directly.
          </Empty>
        ) : (
          <DashCard className="overflow-x-auto p-0">
            <table className="w-full min-w-160 table-fixed text-sm">
              <colgroup>
                <col className="w-14" />
                <col />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="p-3 pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Bid</th>
                  <th className="pb-2 pr-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bids.slice(0, 25).map((bid) => (
                  <tr key={bid.id} className="transition-colors hover:bg-sunken">
                    <td className="p-3 py-2.5">{bid.score !== null && <ScoreBadge score={bid.score} />}</td>
                    <td className="py-2.5 pr-3">
                      <a
                        href={bid.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-medium hover:text-accent"
                      >
                        {bid.project_title}
                      </a>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {bid.was_recommended ? "we suggested it" : "your own find"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <PlatformTag platform={bid.platform} />
                    </td>
                    <td className="truncate py-2.5 pr-3 font-mono text-xs tabular-nums">
                      {bid.bid_amount !== null ? `${bid.bid_amount.toFixed(0)} ${bid.currency ?? ""}` : "—"}
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-muted">
                      {bid.submitted_at ? formatAge(bid.submitted_at) : "not sent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashCard>
        )}
        {won.length > 0 && (
          <p className="font-mono text-xs text-muted">
            {won.length} won: {won.map((b) => b.project_title).join(", ")}
          </p>
        )}
      </Section>
    </Page>
  );
}

function platformName(platform: string): string {
  return platform === "freelancer" ? "Freelancer.com" : platform;
}

/**
 * Score, status pill, and the AI-written diagnosis paragraph — the score and metrics below are
 * illustrative (see the comment on DEMO_PROFILE_DIAGNOSIS), the name/tagline/avatar are real.
 */
function DiagnosisHero({
  account,
  diagnosis,
  handle,
}: {
  account: Connection;
  diagnosis: ProfileDiagnosis;
  handle: string;
}) {
  const tone = scoreTone(diagnosis.score);
  const StatusIcon = tone.Icon;

  return (
    <DashCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Avatar image={account.avatar_url} initials={handle.slice(0, 2).toUpperCase()} size="h-16 w-16 text-lg" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {platformName(account.platform)} profile
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight">{account.display_name || handle}</h1>
            <p className="mt-1 max-w-lg text-sm text-muted">
              {account.tagline || `${platformName(account.platform)} profile`}
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-2xl bg-sunken p-4 sm:w-56">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tone.bg} ${tone.text}`}
          >
            <StatusIcon size={12} aria-hidden="true" />
            {tone.label}
          </span>
          <div className="mt-3 flex items-baseline justify-end gap-1">
            <span className="font-display text-3xl font-bold tabular-nums">{diagnosis.score}</span>
            <span className="text-sm text-muted">/100</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${diagnosis.score}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3 border-t border-border/60 pt-5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-white">
          <Sparkles size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">AI Profile Diagnosis</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{diagnosis.summary}</p>
        </div>
      </div>
    </DashCard>
  );
}

function StrengthBreakdown({ metrics }: { metrics: { label: string; value: number }[] }) {
  return (
    <DashCard className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold">
          <Target size={16} aria-hidden="true" className="text-accent" />
          Strength Breakdown
        </h2>
        <span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-[0.65rem] text-muted">
          {metrics.length} metrics
        </span>
      </div>
      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between text-sm">
              <span>{m.label}</span>
              <span className="font-mono text-xs tabular-nums text-muted">{m.value}/100</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sunken">
              <div
                className={`h-full rounded-full ${m.value < 50 ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </DashCard>
  );
}

/** Ranked by impact, not by category order — the highest score-boost suggestion is always the
 *  emphasized first row. Clicking a row jumps the Workbench below to that exact suggestion.
 *  Collapsed to the top 5 by default since a full profile can have well over a dozen open
 *  suggestions across all eight categories — "View all" expands the rest in place. */
function TopPriorities({
  suggestions,
  onSelect,
}: {
  suggestions: ProfileSuggestion[];
  onSelect: (s: ProfileSuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ranked = [...suggestions].sort((a, b) => b.impact - a.impact);
  const visible = expanded ? ranked : ranked.slice(0, 5);

  return (
    <DashCard className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold">
          <AlertTriangle size={16} aria-hidden="true" className="text-danger" />
          Top Priorities
        </h2>
        {ranked.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-accent hover:underline"
          >
            {expanded ? "Show less" : `View all (${ranked.length})`}
          </button>
        )}
      </div>
      {ranked.length === 0 ? (
        <Empty>No open priorities — this profile looks well optimized.</Empty>
      ) : (
        <ul className="space-y-2">
          {visible.map((s, i) => {
            const Icon = CATEGORY_ICON[s.category];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    i === 0 ? "bg-accent-soft ring-1 ring-accent/30" : "bg-sunken hover:bg-accent-soft"
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-white">
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="truncate text-xs text-muted">{s.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-surface px-2 py-1 font-mono text-xs font-bold text-accent ring-1 ring-border">
                    +{s.impact}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}

function currentValueFor(account: Connection, category: ProfileSuggestionCategory): string {
  switch (category) {
    case "tagline":
      return account.tagline?.trim() || "No tagline set";
    case "overview":
      return account.summary?.trim() || "No overview written yet";
    case "skill":
      return account.account_skills.length > 0 ? account.account_skills.join(", ") : "No skills listed";
    case "portfolio":
      return `${account.portfolio_count ?? 0} portfolio item${account.portfolio_count === 1 ? "" : "s"} shown`;
    case "rate":
      return account.hourly_rate ? `${account.hourly_rate} ${account.currency ?? ""}/hr` : "No rate set";
    default:
      // experience, education, certifications — no per-connection field exists for these yet.
      return "Not tracked on this connection yet";
  }
}

/** One tab per profile field a real Upwork or Freelancer.com profile has and is worth coaching
 *  on (see the comment on ProfileSuggestion for how these eight were chosen). "Current" is read
 *  live off the account for the fields this app tracks; "issue"/"suggested"/"reason" are the
 *  illustrative coaching copy. A category can hold more than one suggestion — prev/next cycles
 *  through them without leaving the tab. */
function SuggestionsWorkbench({
  account,
  suggestions,
  activeSuggestionId,
  onSelectSuggestion,
  onApply,
  onDiscard,
}: {
  account: Connection;
  suggestions: ProfileSuggestion[];
  activeSuggestionId: string | null;
  onSelectSuggestion: (id: string) => void;
  onApply: (s: ProfileSuggestion) => void;
  onDiscard: (s: ProfileSuggestion) => void;
}) {
  const active = suggestions.find((s) => s.id === activeSuggestionId) ?? null;
  const activeCategory = active?.category ?? CATEGORY_ORDER.find((c) => suggestions.some((s) => s.category === c));
  const categorySuggestions = activeCategory ? suggestions.filter((s) => s.category === activeCategory) : [];
  const indexInCategory = active ? categorySuggestions.findIndex((s) => s.id === active.id) : -1;

  function selectCategory(category: ProfileSuggestionCategory) {
    const first = suggestions.find((s) => s.category === category);
    if (first) onSelectSuggestion(first.id);
  }

  function step(delta: 1 | -1) {
    if (indexInCategory < 0 || categorySuggestions.length < 2) return;
    const next = categorySuggestions[(indexInCategory + delta + categorySuggestions.length) % categorySuggestions.length];
    onSelectSuggestion(next.id);
  }

  return (
    <DashCard id="suggestions-workbench" className="space-y-5 p-5">
      <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold">
        <Sparkles size={16} aria-hidden="true" className="text-accent" />
        AI Suggestions Workbench
      </h2>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-sunken p-1">
        {CATEGORY_ORDER.map((c) => {
          const Icon = CATEGORY_ICON[c];
          const count = suggestions.filter((s) => s.category === c).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => selectCategory(c)}
              disabled={count === 0}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                activeCategory === c ? "bg-surface text-accent shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {CATEGORY_LABEL[c]}
              {count > 1 && <span className="font-mono text-[0.65rem] text-muted">{count}</span>}
            </button>
          );
        })}
      </div>

      {!active || !activeCategory ? (
        <Empty>No open suggestions right now — this profile looks well optimized.</Empty>
      ) : (
        <>
          {categorySuggestions.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted">
                {indexInCategory + 1} of {categorySuggestions.length} for {CATEGORY_LABEL[activeCategory].toLowerCase()}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous suggestion"
                  onClick={() => step(-1)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-border transition-colors hover:bg-accent-soft"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next suggestion"
                  onClick={() => step(1)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-border transition-colors hover:bg-accent-soft"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl p-4 ring-1 ring-border">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted">
                Current {CATEGORY_LABEL[active.category].toLowerCase()}
              </p>
              <p className="mt-2 text-sm text-muted line-through decoration-danger/50">
                {currentValueFor(account, active.category)}
              </p>
              <div className="mt-3 flex items-start gap-1.5 text-xs text-danger">
                <X size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                {active.issue}
              </div>
            </div>
            <div className="rounded-xl bg-accent-soft p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-widest text-accent">
                  <Sparkles size={12} aria-hidden="true" />
                  AI Suggestion
                </p>
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-bold text-white">
                  +{active.impact}% Score Boost
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold">{active.suggested}</p>
              <div className="mt-3 flex items-start gap-1.5 text-xs text-good">
                <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                {active.reason}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onDiscard(active)}>
              Discard
            </Button>
            <Button variant="primary" onClick={() => onApply(active)}>
              <ArrowUp size={14} aria-hidden="true" />
              Apply to profile
            </Button>
          </div>
        </>
      )}
    </DashCard>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <StaggerIn className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{title}</h2>
        {aside}
      </div>
      {children}
    </StaggerIn>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <DashCard className="flex flex-col gap-1 p-4">
      <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted">{label}</span>
      <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </DashCard>
  );
}
