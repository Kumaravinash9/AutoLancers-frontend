"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Link2,
  RefreshCw,
  Share2,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { PlatformIcon, platformLabel } from "@/app/(app)/profile/page";
import { useAccountScope } from "@/components/account-scope";
import { DashCard, Ring, StaggerIn } from "@/components/app-ui";
import { Button, Empty, ErrorNote, Page } from "@/components/ui";
import { Connection, isConnectionError, ProfileDetail, profiles } from "@/lib/api";
import {
  DEMO_AGGREGATED_EARNINGS,
  DEMO_PROFILE_DETAIL,
  DEMO_TESTIMONIALS,
  placeholderEndorsements,
} from "@/lib/demo-data";

/**
 * Your Autolancer account — one polished, "for looking" rollup of every connected marketplace
 * profile. Distinct from /profile (the list of connected marketplace *profiles* themselves).
 *
 * Aggregated earnings, per-skill endorsement counts, and client testimonials have no backend
 * source yet (see the comment above their constants in lib/demo-data.ts) — they're built ahead
 * of that endpoint work and are the first things to wire up for real once it lands.
 */
export default function AccountPage() {
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [linkable, setLinkable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cards = await profiles.list();
        const detail = cards[0] ? await profiles.get(cards[0].id) : null;
        if (cancelled) return;
        setProfile(detail);
        setLinkable(true);
        if (!detail) setError("No account yet — connect a marketplace profile first.");
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setProfile(DEMO_PROFILE_DETAIL);
          setLinkable(false);
        } else {
          setError(err instanceof Error ? err.message : "Could not load your account");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading)
    return (
      <Page className="space-y-6">
        <div className="flex justify-end">
          <div className="skeleton h-8 w-40 rounded-md" />
        </div>
        <DashCard className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-1 items-center gap-4">
              <div className="skeleton h-20 w-20 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton h-4 w-56 rounded" />
              </div>
            </div>
            <div className="skeleton h-22 w-22 shrink-0 rounded-full" />
            <div className="skeleton h-10 w-28 shrink-0 rounded-md" />
          </div>
        </DashCard>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="skeleton h-32 rounded-2xl" />
              <div className="skeleton h-32 rounded-2xl" />
            </div>
            <div className="skeleton h-40 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-36 rounded-2xl" />
            <div className="skeleton h-44 rounded-2xl" />
          </div>
        </div>
      </Page>
    );
  if (error || !profile) return <Page><ErrorNote>{error ?? "Not found."}</ErrorNote></Page>;

  const winRate = profile.proposals > 0 ? Math.round((profile.wins / profile.proposals) * 100) : null;
  const totalReviews = profile.connections.reduce((sum, c) => sum + (c.total_reviews ?? 0), 0);

  return (
    <Page className="space-y-6">
      <StaggerIn index={0}>
        <AccountHero profile={profile} />
      </StaggerIn>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <StaggerIn index={1}>
            <section className="space-y-4">
              <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wide text-muted">
                <TrendingUp size={14} aria-hidden="true" /> Project success results
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <HighlightCard
                  icon={Award}
                  title="Win rate"
                  subtitle={`Across ${profile.platforms.length} platform${profile.platforms.length === 1 ? "" : "s"}`}
                  metric={winRate !== null ? `${winRate}%` : "—"}
                  metricLabel="Of placed bids won"
                  description={`${profile.wins} won from ${profile.proposals} bid${profile.proposals === 1 ? "" : "s"} placed.`}
                />
                <HighlightCard
                  icon={Target}
                  title="Match quality"
                  subtitle="Recommendations scored"
                  metric={`${profile.recommendations}`}
                  metricLabel="Jobs scored for fit"
                  description={
                    profile.avg_score !== null
                      ? `Averaging ${profile.avg_score.toFixed(1)} on kept matches.`
                      : "Nothing cleared the bar yet."
                  }
                />
              </div>
            </section>
          </StaggerIn>

          <StaggerIn index={2}>
            <section className="space-y-4">
              <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wide text-muted">
                <ShieldCheck size={14} aria-hidden="true" /> Skills &amp; endorsements
              </h2>
              {profile.weighted_skills.length === 0 ? (
                <Empty>No skills yet. Scoring needs at least one.</Empty>
              ) : (
                <DashCard className="flex flex-wrap gap-2 p-5">
                  {profile.weighted_skills.map((skill) => (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-2 rounded-xl bg-sunken py-2 pl-3.5 pr-1.5 text-sm font-semibold"
                    >
                      {skill.name}
                      <span className="rounded-lg bg-accent-soft px-2.5 py-1 font-mono text-[0.7rem] font-bold text-accent">
                        {placeholderEndorsements(skill.weight)} Endorsements
                      </span>
                    </span>
                  ))}
                </DashCard>
              )}
            </section>
          </StaggerIn>

          <StaggerIn index={3}>
            <section className="space-y-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
                Client testimonials
              </h2>
              <TestimonialCarousel />
            </section>
          </StaggerIn>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <StaggerIn index={1}>
            <EarningsCard profile={profile} totalReviews={totalReviews} />
          </StaggerIn>

          <StaggerIn index={2}>
            <NetworkConnections connections={profile.connections} />
          </StaggerIn>

          <StaggerIn index={3}>
            <ActionsCard profileId={profile.id} linkable={linkable} />
          </StaggerIn>
        </div>
      </div>
    </Page>
  );
}

function AccountHero({ profile }: { profile: ProfileDetail }) {
  // Local only: ProfileCard/ProfileDetail is a read model (there's no PATCH for availability
  // yet), so this reflects what you last set here for this session rather than something saved
  // to the backend. Toggling is real; persistence is the next piece to wire up.
  const [open, setOpen] = useState(() => profile.availability.toUpperCase().includes("AVAILABLE"));
  const bioLine = profile.bio.trim() || profile.headline || "No headline set";

  return (
    <DashCard tint className="p-6">
      <div className="flex flex-wrap items-center divide-y divide-border/70 sm:divide-y-0 sm:divide-x">
        <div className="flex min-w-0 flex-1 items-center gap-4 pb-5 sm:pb-0 sm:pr-6">
          <div className="relative shrink-0">
            {profile.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_image}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-surface"
              />
            ) : (
              <div
                aria-hidden="true"
                className="grid h-20 w-20 place-items-center rounded-2xl bg-accent-soft font-display text-xl font-semibold text-accent ring-4 ring-surface"
              >
                {profile.initials}
              </div>
            )}
            {open && (
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface bg-good"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {profile.display_name}
              </h1>
              {/* Decorative — no verification system exists behind this yet. Matches the
                  reference design's badge; flagging so it isn't mistaken for a real claim. */}
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
                <BadgeCheck size={12} aria-hidden="true" />
                Expert Verified
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 max-w-md text-sm text-muted">{bioLine}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 py-5 sm:px-6 sm:py-0">
          <div className="flex flex-col items-center gap-1.5">
            <span className="whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-widest text-muted">
              Account average score
            </span>
            <Ring value={profile.avg_score ?? 0} size={88} stroke={7} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-5 sm:pt-0 sm:pl-6">
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">Availability</span>
          <span className={`text-sm font-bold uppercase tracking-wide ${open ? "text-good" : "text-muted"}`}>
            {open ? "Open to work" : "Not available"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={open}
            aria-label="Available for work"
            onClick={() => setOpen((v) => !v)}
            className="-ml-0.5"
          >
            <ToggleTrack on={open} />
          </button>
        </div>
      </div>
    </DashCard>
  );
}

function ToggleTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </span>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  subtitle,
  metric,
  metricLabel,
  description,
}: {
  icon: typeof Award;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  description: string;
}) {
  return (
    <DashCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="rounded-xl bg-accent-soft px-4 py-3.5">
        <span className="block font-display text-3xl font-bold tabular-nums text-accent">{metric}</span>
        <span className="mt-0.5 block text-sm font-semibold">{metricLabel}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{description}</p>
    </DashCard>
  );
}

function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const testimonial = DEMO_TESTIMONIALS[index];

  return (
    <DashCard className="space-y-4 p-5">
      <div className="flex text-figure" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-muted">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
          >
            {testimonial.author.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{testimonial.author}</p>
            <p className="truncate text-xs text-muted">{testimonial.role}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => setIndex((i) => (i - 1 + DEMO_TESTIMONIALS.length) % DEMO_TESTIMONIALS.length)}
            className="grid h-7 w-7 place-items-center rounded-md border border-border transition-colors hover:bg-accent-soft"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => setIndex((i) => (i + 1) % DEMO_TESTIMONIALS.length)}
            className="grid h-7 w-7 place-items-center rounded-md border border-border transition-colors hover:bg-accent-soft"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </DashCard>
  );
}

function EarningsCard({ profile, totalReviews }: { profile: ProfileDetail; totalReviews: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-deep p-5 text-deep-fg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--deep-fg) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-deep-muted">
              Aggregated earnings
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums">
              ${DEMO_AGGREGATED_EARNINGS.toLocaleString()}+
            </p>
            <p className="mt-1 text-xs text-deep-muted">
              Verified across {profile.platforms.length} platform{profile.platforms.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
            <Wallet size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-deep-muted">Jobs</p>
            <p className="mt-1 font-display text-lg font-semibold tabular-nums">{profile.wins}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-deep-muted">Reviews</p>
            <p className="mt-1 font-display text-lg font-semibold tabular-nums">{totalReviews}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** PlatformIcon renders each platform's real logo in its own true brand color (see its own
 *  doc comment) — this tile is just a soft, token-tinted backdrop behind it, not a substitute
 *  brand color of its own. */
function ConnectionIcon({ platform }: { platform: string }) {
  const style =
    platform === "upwork" ? "bg-good/15" : platform === "freelancer" ? "bg-accent-soft" : "bg-sunken ring-1 ring-border";
  return (
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style}`}>
      <PlatformIcon platform={platform} size={18} />
    </div>
  );
}

/**
 * The toggle scopes the whole app to one connected profile — same switch the navbar picker and
 * the connected-profiles list already expose, surfaced here too since this is where you'd look
 * for it. It's not a connect/disconnect switch: that stays a deliberate action on /profile/[id],
 * not a stray tap here.
 *
 * Only real connections are listed — no LinkedIn row, since that isn't an integration this app
 * has.
 */
function NetworkConnections({ connections }: { connections: Connection[] }) {
  const { accountId, select } = useAccountScope();

  return (
    <DashCard className="space-y-3 p-5">
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          <Link2 size={14} aria-hidden="true" /> Network connections
        </h2>
        <p className="mt-1 text-xs text-muted">Switch which connected profile the app is scoped to.</p>
      </div>
      {connections.length === 0 ? (
        <Empty>
          Nothing connected yet.{" "}
          <Link href="/profile" className="text-accent hover:underline">
            Connect a profile
          </Link>
          .
        </Empty>
      ) : (
        <ul className="space-y-2">
          {connections.map((c) => {
            const scoped = accountId === c.id;
            return (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors ${scoped ? "bg-accent-soft" : "bg-sunken"}`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <ConnectionIcon platform={c.platform} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{platformLabel(c.platform)}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.status === "ACTIVE" ? "bg-good" : "bg-warn"}`}
                      />
                      {scoped
                        ? "Scoped to this profile"
                        : c.status === "ACTIVE"
                          ? "Connected"
                          : c.status.toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={scoped}
                  aria-label={`Scope the app to ${platformLabel(c.platform)}`}
                  onClick={() => void select(scoped ? null : c.id)}
                  className="shrink-0 rounded-full p-0.5"
                >
                  <ToggleTrack on={scoped} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}

function ActionsCard({ profileId, linkable }: { profileId: string; linkable: boolean }) {
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function syncAll() {
    setSyncing(true);
    try {
      await profiles.sync(profileId);
    } catch {
      // Nothing to show here — this card has no error slot; a failed sync just leaves
      // last-synced timestamps as they were, same as the connected-profiles list page.
    } finally {
      setSyncing(false);
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the URL is still right there in the address bar.
    }
  }

  return (
    <DashCard className="space-y-2 p-5">
      <Button variant="secondary" className="w-full" onClick={syncAll} disabled={syncing || !linkable}>
        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} aria-hidden="true" />
        {syncing ? "Syncing…" : "Sync all accounts"}
      </Button>
      <Button variant="primary" className="w-full" onClick={share}>
        <Share2 size={14} aria-hidden="true" />
        {copied ? "Link copied" : "Share profile URL"}
      </Button>
    </DashCard>
  );
}
