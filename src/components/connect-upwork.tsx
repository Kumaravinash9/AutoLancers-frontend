"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { API_URL, tokens } from "@/lib/api";
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
export function ConnectUpwork() {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [run, setRun] = useState<ExtensionState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isInstalled().then((yes) => {
      if (!cancelled) setInstalled(yes);
    });
    // Follow whatever the extension is doing, including a run someone started from its own popup.
    const stop = watchExtension((state) => {
      if (!cancelled) setRun(state);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  async function connect() {
    setConnecting(true);
    setProblem(null);
    try {
      // Minted here rather than asked for: this page is signed in and the extension cannot be. The
      // tokens this replaces are revoked, so pressing Connect twice does not leave two live keys.
      const { token } = await tokens.issueForExtension();
      const ok = await connectExtension(API_URL, token, { pushToBackend: true, useLlm: true });
      if (!ok) throw new Error("The extension did not accept the handover.");
      setConnected(true);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

  async function sync() {
    setProblem(null);
    const result = await syncExtension("upwork");
    // A run already going is not a failure — it is the thing you asked for, already happening.
    if (result.ok) return;

    // Each refusal needs its own sentence. "Sync failed" would send someone to check the wrong thing.
    setProblem(REFUSALS[result.reason as SyncRefusal] ?? "The extension refused to start.");
    // A dead token is fixable right here, and saying so beats making someone hunt for Connect.
    if (result.reason === "needs_token" || result.reason === "revoked") setConnected(false);
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
};
