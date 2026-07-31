"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { API_URL, accounts, session } from "@/lib/api";
import {
  EXTENSION_ID,
  ExtensionState,
  SyncRefusal,
  connectExtension,
  isInstalled,
  syncExtension,
  watchExtension,
} from "@/lib/extension";

/**
 * Connecting and syncing Upwork, which is not an OAuth flow and cannot be one.
 *
 * Every other marketplace here is a redirect: you sign in there and come back with a token. Upwork has
 * no usable public API for this, and its automation policy is aimed at tools that watch the board on
 * your behalf — so the account is read by the browser extension instead, which reads a page *you*
 * opened, when you click, and nothing else.
 *
 * Two buttons, because they do different things. **Connect** hands the extension a token: it runs on
 * Upwork's origin where this app's cookie is never sent, so it cannot mint one for itself. **Sync**
 * then asks it to read your profile and job feeds, and this page follows along — the extension streams
 * its progress over the same port, so "exporting" here is the run actually happening rather than a
 * spinner standing in for one.
 */
export function ConnectUpwork({ onFinished }: { onFinished?: () => void } = {}) {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [run, setRun] = useState<ExtensionState | null>(null);

  /**
   * The last completion we told the page about.
   *
   * The port keeps delivering state after a run ends, and `finishedAt` stays set — so without
   * remembering which one has been announced, every subsequent event would re-trigger a reload.
   * A ref rather than state because changing it must not itself cause a render.
   */
  const announced = useRef<number | null>(null);

  /**
   * The callback, held in a ref so the subscription below can stay mounted for the component's whole
   * life. Putting `onFinished` in the effect's dependencies would tear down and re-open the port on
   * every render where the parent passed a fresh closure — and a reopened port means a reconnect,
   * which means the extension replays its state, which means a finished run announces itself twice.
   *
   * Assigned in an effect rather than during render: a ref written while rendering is not guaranteed
   * to survive a discarded render pass.
   */
  const notify = useRef(onFinished);
  useEffect(() => {
    notify.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    let cancelled = false;
    void isInstalled().then((yes) => {
      if (!cancelled) setInstalled(yes);
    });
    // Follow whatever the extension is doing, including a run someone started from its own popup.
    const stop = watchExtension((state) => {
      if (cancelled) return;
      setRun(state);

      // A run has just ended. Everything this page shows was fetched before it started — the account
      // it may have created, the scores it filed — so the page is now describing a world one sync out
      // of date, and looks perfectly current while doing it.
      if (!state.running && state.finishedAt && state.finishedAt !== announced.current) {
        announced.current = state.finishedAt;
        notify.current?.();
      }
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  /**
   * Give the extension a token for whoever is signed in *now*.
   *
   * Minted here because this page is signed in and the extension cannot be. The user id goes with it,
   * so the extension knows whose credential it holds — a browser where a second person signed in
   * would otherwise keep the first one's and file their marketplace data into the wrong account.
   *
   * Returns the id so the caller can hand it to sync, which checks it again at the other end.
   */
  async function handOver(): Promise<string> {
    const issued = await session.extensionToken();
    const ok = await connectExtension(
      API_URL,
      issued.token,
      { pushToBackend: true, useLlm: true },
      issued.user_id
    );
    if (!ok) throw new Error("The extension did not accept the handover.");
    return issued.user_id;
  }

  async function connect() {
    setConnecting(true);
    setProblem(null);
    try {
      await handOver();
      setConnected(true);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

  async function sync() {
    setProblem(null);
    try {
      // Re-issued before every run rather than checked and reused. The token is short-lived by
      // design and this is one request, so the wrong-user and expired-token cases stop being
      // conditions to detect and become states that cannot arise.
      const userId = await handOver();
      setConnected(true);

      const result = await syncExtension("upwork", userId);
      // A run already going is not a failure — it is the thing you asked for, already happening.
      if (result.ok) return;

      // Each refusal gets its own sentence: "sync failed" sends people to check the wrong thing.
      setProblem(REFUSALS[result.reason as SyncRefusal] ?? "The extension refused to start.");
      if (result.reason === "needs_token" || result.reason === "revoked") setConnected(false);
    } catch (err) {
      // The handover failed, which usually means this app's own session has gone.
      const me = await accounts.me().catch(() => null);
      setProblem(
        me
          ? err instanceof Error
            ? err.message
            : String(err)
          : "You are signed out of AutoLancers. Sign in again, then sync."
      );
      setConnected(false);
    }
  }

  // Still asking. Rendering "not installed" first and correcting it a moment later is worse than
  // waiting, because the wrong answer is the one that sends someone off to install something.
  if (installed === null) {
    return <p className="text-xs text-muted">Looking for the extension…</p>;
  }

  if (!installed) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-muted">
          Upwork is read by the AutoLancers browser extension, which reads a page you have open when
          you click it. Install it, then come back and press <b>Sync</b>.
        </p>
        <ol className="ml-4 list-decimal space-y-0.5 text-xs text-muted">
          <li>
            Open <code>chrome://extensions</code> and turn on Developer mode
          </li>
          <li>
            <b>Load unpacked</b> → pick the <code>extension</code> folder
          </li>
        </ol>
        {!EXTENSION_ID && (
          // The id cannot be discovered by a page, and an unpacked build gets a different one per
          // machine — so "not installed" and "installed but I wasn't told its id" look identical from
          // here, and saying only the first would send someone to reinstall what they already have.
          <p className="text-xs text-amber-600">
            No <code>NEXT_PUBLIC_EXTENSION_ID</code> is set, so this page cannot tell an absent
            extension from an unnamed one. Copy the id from <code>chrome://extensions</code> into{" "}
            <code>.env.local</code> and reload.
          </p>
        )}
      </div>
    );
  }

  const running = Boolean(run?.running);

  return (
    <div className="space-y-2">
      {running && run ? (
        <Exporting run={run} />
      ) : (
        <p className="text-xs text-muted">
          {connected
            ? "Connected. Sync reads your profile first, then your job feeds."
            : "Reads pages you open, when you click. No polling, no crawling, nothing in the background."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={connect} disabled={connecting || running} variant="secondary">
          {connecting ? "Connecting…" : connected ? "Reconnect" : "Connect the extension"}
        </Button>
        <Button onClick={sync} disabled={running} variant="primary">
          {running ? "Exporting…" : "Sync Upwork profile"}
        </Button>
      </div>

      {run?.session && (
        // The extension's own view, which is newer than anything the backend could tell us here.
        <p className="text-xs text-amber-600">{run.note ?? run.session.detail}</p>
      )}
      {problem && <p className="text-xs text-red-600">{problem}</p>}
      {!running && run?.finishedAt && !problem && (
        <p className="text-xs text-accent">
          Read {run.pages.done} of {run.pages.total} pages
          {run.stored ? `, filed ${run.stored}` : ""}
          {run.failed ? ` · ${run.failed} failed` : ""}.
        </p>
      )}
    </div>
  );
}

/**
 * The run as it happens, streamed from the extension over the port.
 *
 * Worth showing rather than a bare spinner: a collection is a minute or so of one-page-at-a-time
 * reading, and a bar that moves is the difference between "it is working" and "it has hung".
 */
function Exporting({ run }: { run: ExtensionState }) {
  const pct = run.pages.total ? Math.round((run.pages.done / run.pages.total) * 100) : 0;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted">
        Exporting from Upwork… {run.pages.done} of {run.pages.total} pages
        {run.stored ? ` · ${run.stored} filed` : ""}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/**
 * Why a sync would not start, in words that name the fix.
 *
 * There is no "token expired" here because there is no expiry: an API token is live until it is
 * revoked. Saying "expired" would send someone looking for a renewal that does not exist.
 */
const REFUSALS: Record<SyncRefusal, string> = {
  needs_token: "The extension has no token yet — press Connect first.",
  revoked: "The extension's token was revoked. Press Connect to issue it another.",
  unreachable: "The extension could not reach the backend. Is it running?",
  unknown_platform: "The extension does not have Upwork enabled.",
  // Should be unreachable now that every sync re-issues first, but a stale extension build or a
  // handover that half-succeeded would land here — and silence would mean the wrong account.
  different_user: "The extension is connected as a different account. Press Connect to re-issue it.",
};
