"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button, Card, Empty, ErrorNote } from "@/components/ui";
import { API_URL, api, AuthStatus } from "@/lib/api";

export default function SettingsPage() {
  // useSearchParams needs a Suspense boundary — the OAuth callback returns here with ?connected=.
  return (
    <Suspense fallback={<Empty>Loading…</Empty>}>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connected = searchParams.get("connected");
  const callbackError = searchParams.get("error");

  // State is only set after an await, so this never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await api.authStatus();
        if (!cancelled) setStatus(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to read auth status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Called from event handlers only, where setting state synchronously is fine.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await api.authStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read auth status");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Connection to Freelancer.com.</p>
      </div>

      {connected === "1" && <ErrorNote>Account connected.</ErrorNote>}
      {callbackError && <ErrorNote>Authorization failed: {callbackError}</ErrorNote>}
      {error && <ErrorNote>{error}</ErrorNote>}

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-medium">Freelancer.com</h2>
          {loading ? (
            <span className="text-sm text-muted">checking…</span>
          ) : status?.connected ? (
            <span className="rounded bg-good/15 px-2 py-0.5 text-xs font-medium text-good">
              connected
            </span>
          ) : (
            <span className="rounded bg-muted/15 px-2 py-0.5 text-xs font-medium text-muted">
              not connected
            </span>
          )}
        </div>

        {status?.connected && (
          <dl className="grid gap-1 text-sm text-muted">
            <div className="flex gap-2">
              <dt>Scope:</dt>
              <dd>{status.scope ?? "not reported"}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Expires:</dt>
              <dd>
                {status.expires_at ? new Date(status.expires_at).toLocaleString() : "no stated expiry"}
              </dd>
            </div>
          </dl>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => (window.location.href = `${API_URL}/auth/freelancer/login`)}>
            {status?.connected ? "Reconnect" : "Connect account"}
          </Button>
          <Button variant="ghost" onClick={load}>
            Re-check
          </Button>
        </div>

        <p className="text-xs text-muted">
          Read scope only. The <code>bid</code> scope is deliberately not requested, so this app
          cannot submit on your behalf even if asked to.
        </p>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-medium">Backend</h2>
        <p className="text-sm text-muted">
          API: <code>{API_URL}</code>
        </p>
        <p className="text-sm text-muted">
          The poller runs inside the backend process and fetches every ~25 seconds. Use{" "}
          <strong>Fetch now</strong> on the queue to trigger a cycle by hand.
        </p>
      </Card>
    </div>
  );
}
