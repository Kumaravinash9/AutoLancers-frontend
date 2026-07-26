"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, SkillTag } from "@/app/profile/page";
import { useAccountScope } from "@/components/account-scope";
import { Button, Card, Empty, ErrorNote, Page, ScoreBadge } from "@/components/ui";
import {
  Connection,
  connections as connectionsApi,
  formatAge,
  ProfileDetail,
  profiles,
  ProposalRow,
  proposals as proposalsApi,
} from "@/lib/api";

/**
 * One connected marketplace account, in full.
 *
 * Everything shown here belongs to the account itself — the picture, handle, tagline, summary,
 * skills, rate and reviews as the marketplace holds them, plus every bid placed from it. Our
 * scoring profile is a separate thing and gets a link, not a panel: someone opening an account
 * wants to see what a client would see, not how we rank jobs for it.
 *
 * Built from endpoints that already exist: the connections list, the profile detail, and the
 * proposals list scoped by connection.
 */
export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accountId, select } = useAccountScope();

  const [account, setAccount] = useState<Connection | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [bids, setBids] = useState<ProposalRow[]>([]);
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
        if (!found) setError("That account isn't connected any more.");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the account");
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
      if (accountId === account.id) select(null);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect");
    }
  }

  if (loading)
    return (
      <Page>
        <Empty>Loading…</Empty>
      </Page>
    );
  if (!account)
    return (
      <Page className="space-y-4">
        <Link href="/profile" className="text-sm text-muted hover:text-foreground">
          ← All accounts
        </Link>
        <ErrorNote>{error ?? "Not found."}</ErrorNote>
      </Page>
    );

  const handle = account.platform_username ?? "unnamed account";
  const isSelected = accountId === account.id;
  const won = bids.filter((b) => b.status === "ACCEPTED");

  return (
    <Page className="space-y-8">
      <Link href="/profile" className="text-sm text-muted hover:text-foreground">
        ← All accounts
      </Link>

      {error && <ErrorNote>{error}</ErrorNote>}

      <header className="flex flex-wrap items-start gap-5">
        <Avatar
          image={account.avatar_url}
          initials={handle.slice(0, 2).toUpperCase()}
          size="h-20 w-20 text-xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {account.display_name || handle}
          </h1>
          {/* The tagline is the account's own one-liner. Falling back to the platform name keeps
              the line from collapsing on an account that hasn't written one. */}
          <p className="mt-1 max-w-2xl text-muted">
            {account.tagline || `${platformName(account.platform)} account`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
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
            {account.member_since && (
              <span>member since {new Date(account.member_since).getFullYear()}</span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
            <span>{account.status.toLowerCase()}</span>
            <span>
              bids{" "}
              {account.last_synced_at ? `synced ${formatAge(account.last_synced_at)}` : "never synced"}
            </span>
            {/* The granted scope decides whether bidding from here is even possible, so say it
                outright instead of counting tokens in a string nobody can see. */}
            <span title={account.scope ?? "no scope recorded"}>
              {account.scope?.includes("bid") ? "can place bids" : "read only"}
            </span>
            {profile && (
              <Link href={`/profile/${profile.id}`} className="hover:text-accent">
                scored by {profile.display_name} →
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={sync} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
          <Button
            onClick={() => select(isSelected ? null : account.id)}
            title={isSelected ? "Go back to showing every account" : "Filter the app to this one"}
          >
            {isSelected ? "Showing this account" : "Show only this"}
          </Button>
          <Button variant="ghost" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </header>

      {syncNote && (
        <ul className="space-y-0.5 font-mono text-xs text-muted">
          {syncNote.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

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

      {/* Everything below comes from the marketplace, not from us — this is the account as a
          client browsing Freelancer.com would find it. */}
      {account.summary && (
        <Section title="Summary">
          <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted">
            {account.summary}
          </p>
        </Section>
      )}

      <Section title={`Skills on this account · ${account.account_skills.length}`}>
        {account.account_skills.length === 0 ? (
          <Empty>
            No skills listed on this account. Add them on {platformName(account.platform)} and sync.
          </Empty>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {account.account_skills.map((skill) => (
              <SkillTag key={skill}>{skill}</SkillTag>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Bids from this account · ${bids.length}`}>
        {bids.length === 0 ? (
          <Empty>
            No bids yet on this account. Sync pulls in anything placed on the marketplace directly.
          </Empty>
        ) : (
          <ul className="space-y-2">
            {bids.slice(0, 25).map((bid) => (
              <li key={bid.id}>
                <Card className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={bid.project_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium hover:text-accent"
                    >
                      {bid.project_title}
                    </a>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {bid.bid_amount !== null && `${bid.bid_amount} ${bid.currency ?? ""} · `}
                      {bid.submitted_at ? formatAge(bid.submitted_at) : "not sent"}
                      {bid.was_recommended ? " · we suggested it" : " · your own find"}
                    </p>
                  </div>
                  {bid.score !== null && <ScoreBadge score={bid.score} />}
                  <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[0.7rem] uppercase text-muted">
                    {bid.status.toLowerCase()}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
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
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </Card>
  );
}
