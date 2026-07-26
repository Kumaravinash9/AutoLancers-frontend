"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
 * Profile browse view.
 *
 * A card carries only what identifies a profile — face, name, headline, a few skills. Everything
 * that only matters once you've chosen one lives behind the click, which is also why the API is
 * split in two: rendering a name shouldn't ship a portfolio.
 */
export default function ProfilesPage() {
  const [cards, setCards] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await profiles.list();
        if (!cancelled) setCards(list);
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
        <h1 className="font-display text-xl font-semibold tracking-tight">Profiles</h1>
        <p className="mt-1 text-sm text-muted">
          Open one to see its skills, rates and connected marketplaces.
        </p>
      </div>

      {cards.length === 0 ? (
        <Empty>No profiles yet.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <ProfileTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </Page>
  );
}

function ProfileTile({ card }: { card: ProfileCard }) {
  const [accounts, setAccounts] = useState<Connection[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);

  async function sync() {
    setSyncing(true);
    setResult(null);
    try {
      const r = await profiles.sync(card.id);
      // Reported separately: the two halves fail for different reasons, and one line saying
      // "synced" would hide a bid pull that quietly did nothing.
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await connectionsApi.list();
        if (!cancelled) setAccounts(list);
      } catch {
        if (!cancelled) setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function disconnect(id: string, name: string) {
    // Removing a credential is easy to do by accident and tedious to undo — it means
    // re-authorising on the marketplace.
    if (!window.confirm(`Disconnect ${name}? Your bid history is kept; you'd need to reconnect.`))
      return;
    try {
      await connectionsApi.remove(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setResult([err instanceof Error ? err.message : "Could not disconnect"]);
    }
  }

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="group flex items-start gap-3">
        <Avatar image={card.profile_image} initials={card.initials} />
        <div className="min-w-0">
          <Link
            href={`/profile/${card.id}`}
            className="block truncate font-display font-semibold tracking-tight hover:text-accent"
          >
            {card.display_name}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
            {card.headline || "No headline set"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {card.skills.slice(0, 5).map((skill) => (
          <SkillTag key={skill}>{skill}</SkillTag>
        ))}
        {card.skill_count > 5 && (
          <span className="rounded-full px-2 py-0.5 font-mono text-[0.7rem] text-muted">
            +{card.skill_count - 5}
          </span>
        )}
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        {[
          ["Matches", card.recommendations],
          ["Bids", card.proposals],
          ["Won", card.wins],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
              {label}
            </dt>
            <dd className="font-display text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Two syncs, named for what they fetch. Collapsing them into one button would hide that
          one reads the marketplace for new work and the other reads back your own results. */}
      <div className="space-y-2 border-t border-border pt-3">
        <dl className="grid gap-1 font-mono text-[0.7rem] text-muted">
          <div className="flex justify-between gap-2">
            <dt>Board</dt>
            <dd>{card.last_synced_at ? formatAge(card.last_synced_at) : "never"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Your bids</dt>
            <dd>{card.bids_synced_at ? formatAge(card.bids_synced_at) : "never synced"}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
            Accounts
          </p>
          {accounts.length === 0 ? (
            <p className="text-xs text-muted">None connected.</p>
          ) : (
            <ul className="space-y-1.5">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <Avatar
                    image={a.avatar_url}
                    initials={(a.platform_username ?? a.platform).slice(0, 2).toUpperCase()}
                    size="h-6 w-6 text-[0.6rem]"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {a.platform_username ?? a.platform}
                    <span className="text-muted"> · {a.platform}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => disconnect(a.id, a.platform_username ?? a.platform)}
                    className="rounded px-1.5 py-0.5 font-mono text-[0.65rem] text-muted transition-colors hover:text-accent"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <a
            href={`${API_URL}/auth/freelancer/login`}
            className="inline-block font-mono text-[0.7rem] text-accent hover:underline"
          >
            + connect another account
          </a>
        </div>

        <Button variant="primary" onClick={sync} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync now"}
        </Button>

        {result && (
          <ul className="space-y-0.5 font-mono text-[0.7rem] text-muted">
            {result.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
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
