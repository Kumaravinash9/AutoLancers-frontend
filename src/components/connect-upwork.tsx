"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { API_URL, tokens } from "@/lib/api";
import { EXTENSION_ID, connectExtension, isInstalled } from "@/lib/extension";

/**
 * Connecting Upwork, which is not an OAuth flow and cannot be one.
 *
 * Every other marketplace here is a redirect: you sign in there and come back with a token. Upwork
 * has no usable public API for this, and its automation policy is aimed at tools that watch the board
 * on your behalf — so the account is connected by the browser extension instead, which reads a page
 * *you* opened, when you click, and nothing else.
 *
 * What this button does is hand the extension its credentials. The extension runs on Upwork's origin
 * where this app's session cookie is never sent, so it cannot mint a token for itself; this page can,
 * and the two share a browser. After that the extension needs no settings and no pasting.
 *
 * The connection row itself appears once you capture your profile — that is what creates it, since
 * until then there is no account handle to attach anything to.
 */
export function ConnectUpwork() {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [state, setState] = useState<"idle" | "working" | "done" | "failed">("idle");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isInstalled().then((yes) => {
      if (!cancelled) setInstalled(yes);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function connect() {
    setState("working");
    setDetail(null);
    try {
      // Minted here rather than asked for: this page is signed in and the extension cannot be. The
      // tokens this replaces are revoked, so pressing Connect twice does not leave two live keys.
      const { token } = await tokens.issueForExtension();
      // useLlm on, because the extension's settings are hidden and a per-browser default would leave
      // it off for everyone — see ExtensionSettings.
      const ok = await connectExtension(API_URL, token, { pushToBackend: true, useLlm: true });
      if (!ok) throw new Error("The extension did not accept the handover.");
      setState("done");
    } catch (err) {
      setState("failed");
      setDetail(err instanceof Error ? err.message : String(err));
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
          Upwork connects through the AutoLancers browser extension, which reads a page you have open
          when you click it. Load it at <code>chrome://extensions</code> with Developer mode on.
        </p>
        {!EXTENSION_ID && (
          // The id cannot be discovered by a page, and an unpacked build gets a different one per
          // machine — so "not installed" and "installed but I wasn't told its id" look identical.
          <p className="text-xs text-amber-600">
            No <code>NEXT_PUBLIC_EXTENSION_ID</code> set. Copy the id from{" "}
            <code>chrome://extensions</code> into <code>.env.local</code> — without it this page
            cannot tell an absent extension from an unnamed one.
          </p>
        )}
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-accent">
          Extension connected — it just opened its own page to confirm.
        </p>
        <p className="text-xs text-muted">
          Now open your Upwork profile and click the AutoLancers icon to capture it. That is what
          creates the account here: until a profile is read there is no Upwork handle to attach it to.
          Then <b>Collect my pages…</b> gathers your feeds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted">
        Reads pages you open, when you click. No polling, no crawling, nothing in the background.
      </p>
      <Button onClick={connect} disabled={state === "working"}>
        {state === "working" ? "Connecting…" : "Connect the extension"}
      </Button>
      {state === "failed" && detail && <p className="text-xs text-red-600">{detail}</p>}
    </div>
  );
}
