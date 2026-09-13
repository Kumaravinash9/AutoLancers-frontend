"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import {
  Bell,
  Mail,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { SiFreelancer } from "react-icons/si";

import { Avatar } from "@/app/(app)/profile/page";
import { DashCard, StaggerIn } from "@/components/app-ui";
import { Button, Empty, ErrorNote, Page } from "@/components/ui";
import {
  Account,
  accounts,
  API_URL,
  api,
  AuthStatus,
  formatAge,
  isConnectionError,
  Profile,
  profiles,
} from "@/lib/api";
import { DEMO_ACCOUNT, DEMO_AUTH_STATUS, DEMO_PROFILE, DEMO_PROFILE_CARDS } from "@/lib/demo-data";

type Tab = "general" | "notifications" | "connected" | "billing" | "security";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "notifications", label: "Notifications" },
  { key: "connected", label: "Connected Accounts" },
  { key: "billing", label: "Billing" },
  { key: "security", label: "Security" },
];

const tintedInput =
  "w-full rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60";

/** Mirrors the General tab's shape (header + tab bar, profile-details card, two sidebar cards)
 *  so there's no layout jump once real content replaces it — used both as the Suspense fallback
 *  and the post-fetch loading state, since they're the same wait from the user's perspective. */
function SettingsSkeleton() {
  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-8 w-48 rounded" />
        </div>
        <div className="skeleton h-11 w-80 max-w-full rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="space-y-6">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    </Page>
  );
}

export default function SettingsPage() {
  // useSearchParams needs a Suspense boundary — the OAuth callback returns here with ?connected=.
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Settings />
    </Suspense>
  );
}

/**
 * System Preferences — a tabbed settings shell. Only two things here are genuinely wired to a
 * backend: the profile fields (name/title, via the same `/profile` endpoint the matching-profile
 * editor uses) and the Freelancer.com connection (existing OAuth flow, just relocated under
 * "Connected Accounts"). Everything else — notification toggles, billing, password change,
 * account deactivation — has no endpoint yet, so it's either a local-only toggle (clearly
 * commented) or an honest "not available yet" state, never a fabricated success.
 */
function Settings() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");
  const callbackError = searchParams.get("error");

  const [tab, setTab] = useState<Tab>(connectedParam || callbackError ? "connected" : "general");

  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState("?");
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [linkable, setLinkable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Local only — no notification-preference endpoint exists yet (same situation as the
  // disabled rows on /notifications). Toggling is real; persistence is the next piece to wire up.
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [me, prof, cards, status] = await Promise.all([
          accounts.me(),
          api.getProfile(),
          profiles.list(),
          api.authStatus(),
        ]);
        if (cancelled) return;
        setAccount(me);
        setProfile(prof);
        setFullName(prof.display_name);
        setTitle(prof.headline);
        setAvatarUrl(cards[0]?.profile_image ?? null);
        setAvatarInitials(cards[0]?.initials ?? (prof.display_name.slice(0, 2).toUpperCase() || "?"));
        setAuthStatus(status);
        setLinkable(true);
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setAccount(DEMO_ACCOUNT);
          setProfile(DEMO_PROFILE);
          setFullName(DEMO_PROFILE.display_name);
          setTitle(DEMO_PROFILE.headline);
          setAvatarUrl(DEMO_PROFILE_CARDS[0]?.profile_image ?? null);
          setAvatarInitials(DEMO_PROFILE_CARDS[0]?.initials ?? "JD");
          setAuthStatus(DEMO_AUTH_STATUS);
          setLinkable(false);
        } else {
          setError(err instanceof Error ? err.message : "Could not load settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recheckAuth = useCallback(async () => {
    setCheckingAuth(true);
    try {
      setAuthStatus(await api.authStatus());
    } catch (err) {
      if (isConnectionError(err)) setAuthStatus(DEMO_AUTH_STATUS);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  async function saveProfile() {
    if (!profile) return;
    if (!linkable) {
      setNotice("Connect the backend to save changes — this is sample data.");
      return;
    }
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const saved = await api.saveProfile({ ...profile, display_name: fullName, headline: title });
      setProfile(saved);
      setNotice("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function deactivateAccount() {
    if (
      !window.confirm(
        "Deactivate your account? This pauses automation hooks and archives your proposals — you'd need to reconnect to resume.",
      )
    )
      return;
    setNotice("Account deactivation isn't available yet — nothing was changed.");
  }

  if (loading) return <SettingsSkeleton />;

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Account configuration</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">System Preferences</h1>
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-sunken p-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-accent text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {connectedParam === "1" && <ErrorNote>Account connected.</ErrorNote>}
      {callbackError && <ErrorNote>Authorization failed: {callbackError}</ErrorNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && <ErrorNote>{notice}</ErrorNote>}

      {tab === "general" && (
        <StaggerIn index={0}>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
            <DashCard className="space-y-6 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight">Profile Details</h2>
                  <p className="mt-1 text-sm text-muted">Update your public identity and regional preferences.</p>
                </div>
                <Button variant="primary" onClick={saveProfile} disabled={saving || !profile}>
                  <Save size={14} aria-hidden="true" />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>

              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <Avatar image={avatarUrl} initials={avatarInitials} size="h-24 w-24 text-2xl" />
                  <span
                    className="font-mono text-[0.65rem] uppercase tracking-wide text-muted"
                    title="Photo upload isn't available yet"
                  >
                    JPG, PNG max 5MB
                  </span>
                </div>
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <FormField label="Full name">
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={tintedInput}
                    />
                  </FormField>
                  <FormField label="Email address">
                    <input
                      value={account?.email ?? ""}
                      disabled
                      title="Changing your sign-in email isn't available yet"
                      className={tintedInput}
                    />
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Professional title">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={tintedInput}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </DashCard>

            <div className="space-y-6">
              <DashCard className="space-y-1 p-5">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
                  Global notifications
                </h2>
                <div className="divide-y divide-border">
                  <NotificationRow
                    icon={Mail}
                    label="Email Alerts"
                    detail="Daily digest & critical matches."
                    on={emailAlerts}
                    onToggle={() => setEmailAlerts((v) => !v)}
                  />
                  <NotificationRow
                    icon={Bell}
                    label="Push Notifications"
                    detail="Real-time browser activity."
                    on={pushAlerts}
                    onToggle={() => setPushAlerts((v) => !v)}
                  />
                </div>
              </DashCard>

              <DashCard className="space-y-3 bg-danger/5 p-5 ring-1 ring-danger/20">
                <div className="flex items-center gap-2 text-danger">
                  <TriangleAlert size={16} aria-hidden="true" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide">Critical Actions</h2>
                </div>
                <p className="text-sm text-danger/90">
                  Deactivating your account will pause all active automation hooks and archive your proposals.
                </p>
                <button
                  type="button"
                  onClick={deactivateAccount}
                  className="w-full rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Deactivate Account
                </button>
              </DashCard>
            </div>
          </div>
        </StaggerIn>
      )}

      {tab === "notifications" && (
        <StaggerIn index={0}>
          <div className="space-y-6">
            <DashCard className="space-y-1 p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight">Notification preferences</h2>
              <p className="text-sm text-muted">
                Quick toggles now — the fuller digest and alert rules below are still being built.
              </p>
              <div className="mt-3 divide-y divide-border">
                <NotificationRow
                  icon={Mail}
                  label="Email Alerts"
                  detail="Daily digest & critical matches."
                  on={emailAlerts}
                  onToggle={() => setEmailAlerts((v) => !v)}
                />
                <NotificationRow
                  icon={Bell}
                  label="Push Notifications"
                  detail="Real-time browser activity."
                  on={pushAlerts}
                  onToggle={() => setPushAlerts((v) => !v)}
                />
              </div>
            </DashCard>

            <DashCard className="space-y-1 p-6">
              <p className="text-sm text-muted">
                Coming soon — shown disabled rather than hidden, so you know it&apos;s planned rather than missing.
              </p>
              <div className="mt-3 divide-y divide-border">
                <ComingSoonRow
                  label="Daily digest email"
                  detail="New matches, items waiting on you, and win-rate changes."
                />
                <ComingSoonRow
                  label="High-score alert"
                  detail="Ping the moment a job scores above your threshold."
                />
                <ComingSoonRow
                  label="Weekly summary"
                  detail="A once-a-week recap, good for sharing with a client or partner."
                />
              </div>
            </DashCard>
          </div>
        </StaggerIn>
      )}

      {tab === "connected" && (
        <StaggerIn index={0}>
          <DashCard className="space-y-3 p-6">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft">
                <SiFreelancer size={16} color="#2F7FC1" aria-hidden="true" />
              </div>
              <h2 className="font-display font-semibold tracking-tight">Freelancer.com</h2>
              <span
                className={`h-2 w-2 rounded-full ${authStatus?.connected ? "bg-good" : "bg-muted"}`}
                aria-hidden="true"
              />
              {checkingAuth ? (
                <span className="text-sm text-muted">checking…</span>
              ) : authStatus?.connected ? (
                <span className="rounded bg-good/15 px-2 py-0.5 text-xs font-medium text-good">connected</span>
              ) : (
                <span className="rounded bg-sunken px-2 py-0.5 text-xs font-medium text-muted">not connected</span>
              )}
            </div>

            {authStatus?.connected && (
              <dl className="grid gap-1 text-sm text-muted">
                <div className="flex gap-2">
                  <dt>Scope:</dt>
                  <dd>{authStatus.scope ?? "not reported"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>Expires:</dt>
                  <dd>{authStatus.expires_at ? new Date(authStatus.expires_at).toLocaleString() : "no stated expiry"}</dd>
                </div>
              </dl>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => (window.location.href = `${API_URL}/auth/freelancer/login`)}>
                {authStatus?.connected ? "Reconnect" : "Connect account"}
              </Button>
              <Button variant="ghost" onClick={recheckAuth}>
                Re-check
              </Button>
            </div>

            <p className="text-xs text-muted">
              Read scope only. The <code>bid</code> scope is deliberately not requested, so this app
              cannot submit on your behalf even if asked to.
            </p>
          </DashCard>
        </StaggerIn>
      )}

      {tab === "billing" && (
        <StaggerIn index={0}>
          <DashCard className="p-10">
            <Empty>No billing information yet — this workspace isn&apos;t on a paid plan.</Empty>
          </DashCard>
        </StaggerIn>
      )}

      {tab === "security" && (
        <StaggerIn index={0}>
          <div className="grid gap-6 lg:grid-cols-2">
            <DashCard className="space-y-4 p-6">
              <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight">
                <ShieldCheck size={18} aria-hidden="true" className="text-accent" />
                Account security
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Signed in as</dt>
                  <dd className="font-medium">{account?.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Role</dt>
                  <dd className="font-medium capitalize">{account?.role ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Member since</dt>
                  <dd className="font-medium">
                    {account ? new Date(account.created_at).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Last sign-in</dt>
                  <dd className="font-medium">
                    {account?.last_login_at ? formatAge(account.last_login_at) : "unknown"}
                  </dd>
                </div>
              </dl>
              <Button variant="secondary" disabled title="Password changes aren't available yet">
                Change password
              </Button>
            </DashCard>

            <DashCard className="space-y-2 p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight">System</h2>
              <p className="text-sm text-muted">
                API: <code>{API_URL}</code>
              </p>
              <p className="text-sm text-muted">
                The poller runs inside the backend process and fetches every ~25 seconds. Use{" "}
                <strong>Fetch now</strong> on the queue to trigger a cycle by hand.
              </p>
            </DashCard>
          </div>
        </StaggerIn>
      )}
    </Page>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NotificationRow({
  icon: Icon,
  label,
  detail,
  on,
  onToggle,
}: {
  icon: typeof Mail;
  label: string;
  detail: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
        <Icon size={16} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
      <ToggleSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  );
}

function ComingSoonRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
      <span
        className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full bg-sunken opacity-60"
        title="Coming soon"
        aria-disabled="true"
      >
        <span className="ml-0.5 h-4 w-4 rounded-full bg-surface shadow-(--shadow-sm)" />
      </span>
    </div>
  );
}
