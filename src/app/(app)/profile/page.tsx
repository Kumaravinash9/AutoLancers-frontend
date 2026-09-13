"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, Globe, Link2, Plus, RefreshCw } from "lucide-react";
import { SiFreelancer, SiUpwork } from "react-icons/si";

import { useAccountScope } from "@/components/account-scope";
import { DashCard, Ring, StaggerIn } from "@/components/app-ui";
import { Button, ErrorNote, Page } from "@/components/ui";
import {
  API_URL,
  Connection,
  connections as connectionsApi,
  formatAge,
  isConnectionError,
  ProfileCard,
  profiles,
} from "@/lib/api";
import { DEMO_CONNECTIONS, DEMO_PROFILE_CARDS } from "@/lib/demo-data";

/**
 * Connected profiles.
 *
 * A card carries only what identifies an account — icon, handle, status, its profile score.
 * Everything that only matters once you've opened one (skills, bid history, disconnect) lives
 * behind "Manage", which is also why the API is split in two: rendering a handle shouldn't ship
 * a bid history.
 */
export default function ProfilesPage() {
  const { accountId } = useAccountScope();
  const [profile, setProfile] = useState<ProfileCard | null>(null);
  const [accounts, setAccounts] = useState<Connection[]>([]);
  const [linkable, setLinkable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [list, conns] = await Promise.all([profiles.list(), connectionsApi.list()]);
        if (!cancelled) {
          setProfile(list[0] ?? null);
          setAccounts(conns);
          setLinkable(true);
        }
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setProfile(DEMO_PROFILE_CARDS[0]);
          setAccounts(DEMO_CONNECTIONS);
          setLinkable(false);
        } else {
          setError(err instanceof Error ? err.message : "Could not load profiles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function syncAll() {
    if (!profile) return;
    setSyncingAll(true);
    try {
      const r = await profiles.sync(profile.id);
      setProfile((p) =>
        p ? { ...p, last_synced_at: r.last_synced_at, bids_synced_at: r.bids_synced_at } : p,
      );
    } catch {
      // A failed top-level sync leaves the last-known timestamp in place; each card's own
      // "Sync now" surfaces the actual error if the user retries there.
    } finally {
      setSyncingAll(false);
    }
  }

  if (loading)
    return (
      <Page className="space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="skeleton h-7 w-40 rounded-full" />
          <div className="skeleton h-9 w-36 rounded-md" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AccountCardSkeleton />
            <AccountCardSkeleton />
          </div>
        </div>
      </Page>
    );
  if (error) return <Page><ErrorNote>{error}</ErrorNote></Page>;

  return (
    <Page className="space-y-8">
      {accounts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SyncBadge lastSyncedAt={profile?.last_synced_at ?? null} />
          <Button variant="primary" onClick={syncAll} disabled={syncingAll || !linkable}>
            <RefreshCw size={14} className={syncingAll ? "animate-spin" : ""} aria-hidden="true" />
            {syncingAll ? "Syncing…" : "Sync all platforms"}
          </Button>
        </div>
      )}

      {accounts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-1.5 font-display text-base font-semibold tracking-tight">
              <Link2 size={16} className="text-accent" aria-hidden="true" /> Active Connections
            </h2>
            <span className="rounded-full bg-sunken px-2.5 py-0.5 font-mono text-xs text-muted">
              {accounts.length} Active
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profile &&
              accounts.map((account, i) => (
                <StaggerIn key={account.id} index={i}>
                  <AccountCard
                    account={account}
                    profile={profile}
                    selected={accountId === account.id}
                    linkable={linkable}
                  />
                </StaggerIn>
              ))}
          </div>
        </section>
      )}

      <StaggerIn index={accounts.length}>
        <DiscoverySection alwaysOpen={accounts.length === 0} />
      </StaggerIn>
    </Page>
  );
}

function SyncBadge({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wide text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden="true" />
      {lastSyncedAt ? `Synced ${formatAge(lastSyncedAt)}` : "Not synced yet"}
    </span>
  );
}

export function platformLabel(platform: string): string {
  if (platform === "freelancer") return "Freelancer.com";
  if (platform === "upwork") return "Upwork";
  return platform;
}

/** Real brand marks (Simple Icons via react-icons), each in its own official color — a logo
 *  reads as that platform specifically because it's the platform's actual mark, not a generic
 *  glyph recolored to match. Falls back to a plain globe for any platform this app doesn't
 *  specifically recognize. */
export function PlatformIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  if (platform === "freelancer") return <SiFreelancer size={size} color="#2F7FC1" aria-hidden="true" />;
  if (platform === "upwork") return <SiUpwork size={size} color="#14A800" aria-hidden="true" />;
  return <Globe size={size} aria-hidden="true" />;
}

/** A soft background tile behind each platform's real logo mark — the tint loosely echoes the
 *  platform's own hue (green for Upwork, blue for Freelancer.com) using this app's own tokens,
 *  while the logo itself (see PlatformIcon) always renders in its true brand color regardless
 *  of this container's tint. */
function platformTileClass(platform: string): string {
  if (platform === "upwork") return "bg-good/15";
  if (platform === "freelancer") return "bg-accent-soft";
  return "bg-sunken";
}

function StatusPill({ status }: { status: string }) {
  const live = status === "ACTIVE";
  const tone = live ? "bg-good/15 text-good" : "bg-warn/15 text-warn";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {live ? "live" : status.toLowerCase()}
    </span>
  );
}

/** Same shape as AccountCard below — icon tile, status pill, name lines, score ring, button
 *  row — so the loading state doesn't jump around once real content replaces it. */
function AccountCardSkeleton() {
  return (
    <DashCard className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="flex flex-col items-end gap-1.5">
          <div className="skeleton h-4 w-14 rounded-full" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
        <div className="skeleton h-19 w-19 shrink-0 rounded-full" />
      </div>
      <div className="flex gap-2 border-t border-border pt-4">
        <div className="skeleton h-8 flex-1 rounded-md" />
        <div className="skeleton h-8 flex-1 rounded-md" />
      </div>
    </DashCard>
  );
}

/**
 * One card per connected marketplace account.
 *
 * A single card listing several accounts inside it read as one thing with a footnote. They are
 * separate accounts with separate results — different handles, skills and win records — so they
 * get separate cards. Skills, bids and disconnect live behind "Manage" instead of crowding the
 * summary card.
 */
function AccountCard({
  account,
  profile,
  selected,
  linkable,
}: {
  account: Connection;
  profile: ProfileCard;
  selected: boolean;
  linkable: boolean;
}) {
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setNote(null);
    try {
      const r = await profiles.sync(profile.id);
      setNote(
        r.board_error
          ? `Jobs: ${r.board_error}`
          : `${r.board_new} new job${r.board_new === 1 ? "" : "s"} · ${r.bids_fetched} bid${r.bids_fetched === 1 ? "" : "s"} checked`,
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  // Rating-based estimate of profile strength until the marketplace exposes a real score.
  const score = account.rating != null ? Math.round((account.rating / 5) * 100) : 60;

  const caption =
    [account.tagline, account.rating != null ? `${account.rating.toFixed(1)}★ (${account.total_reviews ?? 0})` : null]
      .filter(Boolean)
      .join(" · ") || "No tagline set yet";

  return (
    <DashCard className={`flex h-full flex-col gap-4 p-5 ${selected ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${platformTileClass(account.platform)}`}>
          <PlatformIcon platform={account.platform} />
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <StatusPill status={account.status} />
          <span className="font-mono text-[0.65rem] text-muted">
            Synced {account.last_synced_at ? formatAge(account.last_synced_at) : "never"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/profile/${account.id}`}
            className="block truncate font-display text-base font-semibold tracking-tight hover:text-accent"
          >
            {platformLabel(account.platform)}
          </Link>
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {account.platform_username ?? account.display_name ?? "Unnamed profile"}
          </p>
          <p className="mt-1.5 line-clamp-1 text-xs text-muted">{caption}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">
            Profile score
          </span>
          <Ring value={score} size={76} stroke={7} />
        </div>
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <Link
          href={`/profile/${account.id}`}
          className="flex flex-1 items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent-soft"
        >
          Manage
        </Link>
        <Button
          variant="secondary"
          className="flex-1 text-accent"
          onClick={sync}
          disabled={syncing || !linkable}
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} aria-hidden="true" />
          {syncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {note && <p className="font-mono text-[0.7rem] text-muted">{note}</p>}
    </DashCard>
  );
}

/**
 * Marketplaces you can attach an account from.
 *
 * Only Freelancer.com is connectable, and the others say why rather than sitting greyed out with
 * no explanation. Upwork's restriction is a policy one, not a missing feature — its automation
 * rules prohibit watcher tools even with approved API access, so it is not a matter of waiting.
 */
const PLATFORMS = [
  {
    id: "freelancer",
    name: "Freelancer.com",
    detail: "Full access: reads the board, tracks your bids and their outcomes.",
    href: `${API_URL}/auth/freelancer/login`,
  },
  {
    id: "upwork",
    name: "Upwork",
    detail: "Not supported. Upwork's automation policy prohibits tools that watch the job feed.",
    href: null,
  },
  {
    id: "fiverr",
    name: "Fiverr",
    detail: "No public API for seller-side work. Nothing to connect to yet.",
    href: null,
  },
] as const;

function DiscoverySection({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const [picking, setPicking] = useState(alwaysOpen);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-base font-semibold tracking-tight">
          <Compass size={16} className="text-accent" aria-hidden="true" /> Discovery
        </h2>
        <p className="mt-1 text-sm text-muted">Explore and connect more professional platforms.</p>
      </div>

      {picking ? (
        <DashCard className="mx-auto max-w-xl p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display font-semibold tracking-tight">Choose a marketplace</p>
              <p className="mt-0.5 text-sm text-muted">You&apos;ll sign in there and come back.</p>
            </div>
            {!alwaysOpen && (
              <Button variant="ghost" onClick={() => setPicking(false)}>
                Cancel
              </Button>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {PLATFORMS.map((platform) =>
              platform.href ? (
                <li key={platform.id}>
                  <a
                    href={platform.href}
                    className="block rounded-md p-2.5 ring-1 ring-border/60 transition-colors hover:bg-accent-soft hover:ring-accent"
                  >
                    <span className="block text-sm font-medium">{platform.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{platform.detail}</span>
                  </a>
                </li>
              ) : (
                <li key={platform.id} className="rounded-md p-2.5 opacity-60 ring-1 ring-border/60">
                  <span className="block text-sm font-medium">{platform.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{platform.detail}</span>
                </li>
              ),
            )}
          </ul>
        </DashCard>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="grid min-h-56 w-full place-items-center rounded-2xl p-8 text-center ring-1 ring-dashed ring-border transition-colors hover:bg-accent-soft hover:ring-accent"
        >
          <span className="flex flex-col items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Plus size={22} aria-hidden="true" />
            </span>
            <span className="block font-display font-semibold tracking-tight">
              Connect a New Platform
            </span>
            <span className="mx-auto block max-w-sm text-sm text-muted">
              Link your accounts from any freelance marketplace to centralize your workflow and
              earnings.
            </span>
            <span className="mt-1 inline-flex items-center rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white">
              Get Started
            </span>
          </span>
        </button>
      )}
    </section>
  );
}

export function Avatar({
  image,
  initials,
  size = "h-12 w-12 text-sm",
}: {
  image: string | null;
  initials: string;
  size?: string;
}) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${size} grid shrink-0 place-items-center rounded-full bg-accent-soft font-display font-semibold text-accent`}
    >
      {initials}
    </span>
  );
}

export function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs">
      {children}
    </span>
  );
}
