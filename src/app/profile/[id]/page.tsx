"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, SkillTag } from "@/app/profile/page";
import { Card, Empty, ErrorNote, Page } from "@/components/ui";
import { formatAge, ProfileDetail, profiles } from "@/lib/api";

/**
 * One profile in full.
 *
 * Laid out the way a marketplace profile reads — face and headline first, then what they do,
 * then the operating detail — rather than as a form. Editing lives on its own screen; this is
 * for looking.
 */
export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await profiles.get(params.id);
        if (!cancelled) setProfile(detail);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) return <Page><Empty>Loading…</Empty></Page>;
  if (error || !profile) return <Page><ErrorNote>{error ?? "Not found."}</ErrorNote></Page>;

  const maxWeight = Math.max(1, ...profile.weighted_skills.map((s) => s.weight));

  return (
    <Page className="space-y-8">
      <Link href="/profile" className="text-sm text-muted hover:text-foreground">
        ← All profiles
      </Link>

      <header className="flex flex-wrap items-start gap-5">
        <Avatar
          image={profile.profile_image}
          initials={profile.initials}
          size="h-20 w-20 text-xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {profile.display_name}
          </h1>
          <p className="mt-1 max-w-2xl text-muted">{profile.headline || "No headline set"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
            <span>
              {profile.rate_min > 0 || profile.rate_max > 0
                ? `${profile.rate_min}–${profile.rate_max} ${profile.currency}/hr`
                : "rate not set"}
            </span>
            <span>{profile.availability.replace("_", " ").toLowerCase()}</span>
            <span>{profile.status.toLowerCase()}</span>
            {profile.last_synced_at && <span>synced {formatAge(profile.last_synced_at)}</span>}
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent-soft"
        >
          Edit
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Matches scored" value={profile.recommendations} />
        <Stat label="Bids placed" value={profile.proposals} />
        <Stat label="Won" value={profile.wins} />
        <Stat
          label="Avg score"
          value={profile.avg_score ?? "—"}
          note={profile.avg_score === null ? "nothing cleared the bar yet" : "on matches kept"}
        />
      </section>

      {profile.bio && (
        <Section title="About">
          <p className="max-w-3xl leading-relaxed text-muted">{profile.bio}</p>
        </Section>
      )}

      <Section title={`Skills · ${profile.weighted_skills.length}`}>
        {profile.weighted_skills.length === 0 ? (
          <Empty>No skills yet. Scoring needs at least one.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.weighted_skills.map((skill) => (
              <span
                key={skill.name}
                title={`weight ${skill.weight}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1.5 text-sm"
              >
                {skill.name}
                {/* The dot encodes weight — a five is visibly heavier than a one, without
                    printing a number on every tag. */}
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-accent"
                  style={{ opacity: 0.25 + 0.75 * (skill.weight / maxWeight) }}
                />
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Portfolio · ${profile.portfolio.length}`}>
        {profile.portfolio.length === 0 ? (
          <Empty>No portfolio items synced from the marketplace yet.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.portfolio.map((item, i) => (
              <Card key={i} className="space-y-2 overflow-hidden">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="aspect-video w-full rounded object-cover"
                  />
                )}
                <p className="font-medium">{item.title || "Untitled"}</p>
                {item.description && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Experience">
        {profile.experience.length === 0 ? (
          <Empty>Not provided by the marketplace API — add it from your own records.</Empty>
        ) : (
          <div className="space-y-2">
            {profile.experience.map((item, i) => (
              <Card key={i}>
                <p className="text-sm leading-relaxed text-muted">{entryText(item)}</p>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {profile.education.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {profile.education.map((item, i) => (
              <Card key={i}>
                <p className="text-sm leading-relaxed text-muted">{entryText(item)}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section title="Connected marketplaces">
        {profile.connections.length === 0 ? (
          <Empty>Nothing connected. Discovery still works, with fewer fields.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.connections.map((c) => (
              <Card key={c.platform} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{c.platform}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[0.7rem] ${
                      c.status === "ACTIVE" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"
                    }`}
                  >
                    {c.status.toLowerCase()}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted">
                  {c.platform_username ?? "account linked"}
                  {c.rating !== null && ` · ${c.rating}★ (${c.total_reviews ?? 0})`}
                </p>
                <p className="font-mono text-xs text-muted">
                  scope {c.scope ?? "unknown"}
                  {c.connected_at && ` · since ${new Date(c.connected_at).toLocaleDateString()}`}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Matching rules">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Min score" value={profile.min_match_score} />
          <Stat
            label="Crowded at"
            value={`${profile.crowded_at_bids} bids`}
            note="where competition costs half its points"
          />
          <Stat label="Fixed floor" value={`${profile.fixed_project_min} ${profile.currency}`} />
          <Stat label="Hourly floor" value={`${profile.rate_min} ${profile.currency}`} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TagList title="Must include" items={profile.keywords_include} empty="anything" />
          <TagList title="Never show" items={profile.keywords_exclude} empty="nothing excluded" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["Skills", profile.weight_skills],
              ["Budget", profile.weight_budget],
              ["Competition", profile.weight_competition],
              ["Recency", profile.weight_recency],
            ] as const
          ).map(([label, value]) => (
            <SkillTag key={label}>
              {label} <span className="font-mono text-muted">{value}</span>
            </SkillTag>
          ))}
        </div>
      </Section>

      {profile.proposal_notes && (
        <Section title="Used in proposals">
          <Card>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {profile.proposal_notes}
            </p>
          </Card>
        </Section>
      )}
    </Page>
  );
}

/** Experience/education entries have no fixed shape (they aren't synced), so render whatever
 *  human-readable string values an entry carries. */
function entryText(item: Record<string, unknown>): string {
  return Object.values(item)
    .filter((v): v is string | number => typeof v === "string" || typeof v === "number")
    .join(" · ");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <span className="font-display text-xl font-semibold tabular-nums">{value}</span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </Card>
  );
}

function TagList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <SkillTag key={item}>{item}</SkillTag>
          ))}
        </div>
      )}
    </div>
  );
}
