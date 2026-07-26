"use client";

import { useEffect, useState } from "react";

import { Button, Card, Empty, ErrorNote, Field, Page, inputClass } from "@/components/ui";
import { api, formatAge, Profile } from "@/lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await api.getProfile();
        setProfile(result);
        setSkillsText(result.skills.map((s) => `${s.name}:${s.weight}`).join("\n"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save(thenRescore: boolean) {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const skills = skillsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, weight] = line.split(":");
          return { name: name.trim(), weight: Number(weight ?? 1) || 1 };
        })
        .filter((s) => s.name);

      const saved = await api.saveProfile({ ...profile, skills });
      setProfile(saved);

      if (thenRescore) {
        const { rescored } = await api.rescore();
        setNotice(`Saved, and re-scored ${rescored} stored job${rescored === 1 ? "" : "s"}.`);
      } else {
        setNotice("Saved. Stored jobs keep their old scores until you re-score.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Page><Empty>Loading…</Empty></Page>;
  if (!profile) return <Page><ErrorNote>{error ?? "Could not load the profile."}</ErrorNote></Page>;

  return (
    <Page className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-muted">
          This drives both scoring and the proposal drafts. Expect to tune it for the first week —
          the queue is only as good as what&apos;s here.
        </p>
        <SyncStatus profile={profile} />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && <ErrorNote>{notice}</ErrorNote>}

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Identity</h2>
        <Field label="Name or brand">
          <input
            className={inputClass}
            value={profile.display_name}
            onChange={(e) => set("display_name", e.target.value)}
          />
        </Field>
        <Field label="Headline">
          <input
            className={inputClass}
            value={profile.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
        </Field>
        <Field
          label="Proof points and standard offer"
          hint="Injected into the draft as facts. Only put things here that are true and that a client could verify."
        >
          <textarea
            className={`${inputClass} min-h-28`}
            value={profile.proposal_notes}
            onChange={(e) => set("proposal_notes", e.target.value)}
          />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Matching</h2>
        <Field label="Skills" hint="One per line, as name:weight — e.g. next.js:5">
          <textarea
            className={`${inputClass} min-h-40 font-mono text-xs`}
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Must include (comma separated)" hint="Leave empty to allow anything">
            <input
              className={inputClass}
              value={profile.keywords_include.join(", ")}
              onChange={(e) => set("keywords_include", splitList(e.target.value))}
            />
          </Field>
          <Field label="Never show (comma separated)">
            <input
              className={inputClass}
              value={profile.keywords_exclude.join(", ")}
              onChange={(e) => set("keywords_exclude", splitList(e.target.value))}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberField
            label="Fixed min"
            value={profile.fixed_project_min}
            onChange={(v) => set("fixed_project_min", v)}
          />
          <NumberField
            label="Hourly min"
            value={profile.rate_min}
            onChange={(v) => set("rate_min", v)}
          />
          <NumberField
            label="Max bids"
            value={profile.max_existing_bids}
            onChange={(v) => set("max_existing_bids", v)}
          />
          <NumberField
            label="Min score"
            value={profile.min_match_score}
            onChange={(v) => set("min_match_score", v)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Score weights
        </h2>
        <p className="text-sm text-muted">
          Relative, not percentages — they&apos;re normalised, so only the ratios matter.
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberField
            label="Skills"
            value={profile.weight_skills}
            onChange={(v) => set("weight_skills", v)}
          />
          <NumberField
            label="Budget"
            value={profile.weight_budget}
            onChange={(v) => set("weight_budget", v)}
          />
          <NumberField
            label="Competition"
            value={profile.weight_competition}
            onChange={(v) => set("weight_competition", v)}
          />
          <NumberField
            label="Recency"
            value={profile.weight_recency}
            onChange={(v) => set("weight_recency", v)}
          />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => save(true)} disabled={saving}>
          {saving ? "Saving…" : "Save and re-score"}
        </Button>
        <Button onClick={() => save(false)} disabled={saving}>
          Save only
        </Button>
      </div>
    </Page>
  );
}

/**
 * When this profile last had the marketplace re-read against it.
 *
 * Marketplace profiles drift — rates change, skills get added, a listing's requirements move —
 * so a score is only as current as the sync it was computed from. Showing the age of that sync
 * is what stops a confident-looking number from quietly being stale.
 */
function SyncStatus({ profile }: { profile: Profile }) {
  const synced = profile.last_synced_at;
  // Staleness is decided by the server: reading the clock here would make the component
  // non-deterministic, and a skewed client clock shouldn't flag good data as old.
  const stale = profile.sync_is_stale;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
      <span className={stale ? "text-warn" : "text-muted"}>
        {synced ? `Board synced ${formatAge(synced)}` : "Never synced"}
      </span>
      <span className="text-muted">Profile edited {formatAge(profile.updated_at)}</span>
      {stale && (
        <span className="text-warn">
          — scores may be out of date. Run a fetch from the queue.
        </span>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
