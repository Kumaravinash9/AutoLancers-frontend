"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAccountScope } from "@/components/account-scope";
import { ConnectUpwork } from "@/components/connect-upwork";
import { Card, Empty, ErrorNote, Page } from "@/components/ui";
import {
  API_URL,
  Connection,
  connections as connectionsApi,
  formatAge,
  ProfileCard,
  profiles,
} from "@/lib/api";
import { Button } from "@/components/ui";

/**
 * Connected accounts.
 *
 * A card carries only what identifies an account — face, handle, tagline, its bid record, a few
 * of its skills. Everything that only matters once you've opened one lives behind the click,
 * which is also why the API is split in two: rendering a handle shouldn't ship a bid history.
 */
export default function ProfilesPage() {
  const { accountId, select } = useAccountScope();
  const [profile, setProfile] = useState<ProfileCard | null>(null);
  const [accounts, setAccounts] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [list, conns] = await Promise.all([profiles.list(), connectionsApi.list()]);
        if (!cancelled) {
          setProfile(list[0] ?? null);
          setAccounts(conns);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load profiles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Page><Empty>Loading…</Empty></Page>;
  if (error) return <Page><ErrorNote>{error}</ErrorNote></Page>;

  return (
    <Page className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-1 text-sm text-muted">
          {accounts.length === 0
            ? "Connect a marketplace to start seeing work."
            : `${accounts.length} connected. Open one for its skills, bids and history.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile &&
          accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              profile={profile}
              selected={accountId === account.id}
              onSelect={() => void select(accountId === account.id ? null : account.id)}
              onRemoved={(id) => setAccounts((prev) => prev.filter((a) => a.id !== id))}
            />
          ))}
        <ConnectCard />
      </div>
    </Page>
  );
}

/**
 * One card per connected marketplace account.
 *
 * A single card listing several accounts inside it read as one thing with a footnote. They are
 * separate accounts with separate results — different handles, skills and win records — so they
 * get separate cards.
 */
function AccountCard({
  account,
  profile,
  selected,
  onSelect,
  onRemoved,
}: {
  account: Connection;
  profile: ProfileCard;
  selected: boolean;
  onSelect: () => void;
  onRemoved: (id: string) => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);

  async function sync() {
    setSyncing(true);
    setResult(null);
    try {
      const r = await profiles.sync(profile.id);
      setResult([
        r.board_error
          ? `Jobs: ${r.board_error}`
          : `Jobs: ${r.board_fetched} seen · ${r.board_new} new · ${r.board_changed} changed`,
        r.bids_error
          ? `Bids: ${r.bids_error}`
          : `Bids: ${r.bids_fetched} found · ${r.outcomes_updated} outcomes updated`,
      ]);
    } catch (err) {
      setResult([err instanceof Error ? err.message : "Sync failed"]);
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    const name = account.platform_username ?? account.platform;
    if (!window.confirm(`Disconnect ${name}? Its bid history is kept; you'd need to reconnect.`))
      return;
    try {
      await connectionsApi.remove(account.id);
      onRemoved(account.id);
    } catch (err) {
      setResult([err instanceof Error ? err.message : "Could not disconnect"]);
    }
  }

  return (
    <Card
      className={`flex h-full flex-col gap-4 transition-colors ${
        selected ? "border-accent" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          image={account.avatar_url}
          initials={(account.platform_username ?? account.platform).slice(0, 2).toUpperCase()}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/account/${account.id}`}
            className="block truncate font-display font-semibold tracking-tight hover:text-accent"
          >
            {account.platform_username ?? "unnamed account"}
          </Link>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {account.platform}
            {account.rating ? ` · ${account.rating}★ (${account.total_reviews ?? 0})` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[0.65rem] ${
              account.status === "ACTIVE" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"
            }`}
          >
            {account.status.toLowerCase()}
          </span>
          {/* Which account the rest of the app is filtered to. Without it, the navbar picker is
              the only place that says, and it's easy to forget a filter is on. */}
          {selected && (
            <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[0.65rem] text-white">
              selected
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 border-y border-border py-3 text-center">
        <div>
          <dt className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">Bids</dt>
          <dd className="font-display text-lg font-semibold tabular-nums">{account.proposals}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">Won</dt>
          <dd className="font-display text-lg font-semibold tabular-nums">{account.wins}</dd>
        </div>
      </dl>

      {/* The account's own skills as the marketplace lists them — what a client sees. */}
      <div className="space-y-1.5">
        <p className="line-clamp-1 font-mono text-[0.7rem] text-muted">
          {account.tagline || "No tagline set"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {account.account_skills.slice(0, 4).map((skill) => (
            <SkillTag key={skill}>{skill}</SkillTag>
          ))}
          {account.account_skills.length > 4 && (
            <span className="rounded-full px-2 py-0.5 font-mono text-[0.7rem] text-muted">
              +{account.account_skills.length - 4}
            </span>
          )}
          {account.account_skills.length === 0 && (
            <span className="font-mono text-[0.7rem] text-muted">no skills listed yet</span>
          )}
        </div>
      </div>

      <dl className="mt-auto grid gap-1 font-mono text-[0.7rem] text-muted">
        <div className="flex justify-between gap-2">
          <dt>Board</dt>
          <dd>{profile.last_synced_at ? formatAge(profile.last_synced_at) : "never"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Your bids</dt>
          <dd>{account.last_synced_at ? formatAge(account.last_synced_at) : "never synced"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/profile/account/${account.id}`}
          className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Open
        </Link>
        <Button onClick={sync} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync"}
        </Button>
        <Button variant="ghost" onClick={onSelect}>
          {selected ? "Show all" : "Select"}
        </Button>
        <Button variant="ghost" onClick={disconnect}>
          Disconnect
        </Button>
      </div>

      {result && (
        <ul className="space-y-0.5 font-mono text-[0.7rem] text-muted">
          {result.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Marketplaces you can attach an account from, and how each is attached.
 *
 * Three different answers, not two. Freelancer.com is an OAuth redirect. Fiverr has no public API for
 * seller-side work and nothing to connect to. Upwork is neither: its automation policy prohibits
 * tools that *watch* the board, which is why there is no poller for it — but the browser extension is
 * not a watcher. It reads a page you opened, when you click, and stops. So Upwork connects through
 * that, and its row is a component rather than a link, because handing the extension its credentials
 * is a conversation with the browser rather than a navigation.
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
    detail: "Through the browser extension — it reads pages you open, when you click.",
    href: null,
    connect: "extension" as const,
  },
  {
    id: "fiverr",
    name: "Fiverr",
    detail: "No public API for seller-side work. Nothing to connect to yet.",
    href: null,
  },
] as const;

function ConnectCard() {
  const [picking, setPicking] = useState(false);

  if (!picking) {
    return (
      <button
        type="button"
        onClick={() => setPicking(true)}
        className="grid min-h-[16rem] place-items-center rounded-lg border border-dashed border-border p-6 text-center transition-colors hover:border-accent hover:bg-accent-soft"
      >
        <span>
          <span className="block font-display font-semibold">Connect an account</span>
          <span className="mt-1 block text-sm text-muted">
            Add another marketplace account to watch and bid from.
          </span>
        </span>
      </button>
    );
  }

  return (
    <Card className="flex min-h-[16rem] flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-semibold tracking-tight">Choose a marketplace</p>
          <p className="mt-0.5 text-sm text-muted">You&apos;ll sign in there and come back.</p>
        </div>
        <Button variant="ghost" onClick={() => setPicking(false)}>
          Cancel
        </Button>
      </div>

      <ul className="space-y-2">
        {PLATFORMS.map((platform) =>
          platform.href ? (
            <li key={platform.id}>
              <a
                href={platform.href}
                className="block rounded-md border border-border px-3 py-2 transition-colors hover:border-accent hover:bg-accent-soft"
              >
                <span className="block text-sm font-medium">{platform.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{platform.detail}</span>
              </a>
            </li>
          ) : "connect" in platform ? (
            <li key={platform.id} className="space-y-2 rounded-md border border-border px-3 py-2">
              <div>
                <span className="block text-sm font-medium">{platform.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{platform.detail}</span>
              </div>
              <ConnectUpwork />
            </li>
          ) : (
            <li
              key={platform.id}
              className="rounded-md border border-border px-3 py-2 opacity-60"
            >
              <span className="block text-sm font-medium">{platform.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{platform.detail}</span>
            </li>
          )
        )}
      </ul>
    </Card>
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
    <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs">
      {children}
    </span>
  );
}
