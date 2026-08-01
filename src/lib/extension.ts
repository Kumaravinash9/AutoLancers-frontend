/**
 * The browser extension, talked to directly.
 *
 * The extension and this app run in the same browser, so the interesting moment — you pressed Collect
 * and the marketplace asked you to sign in — can reach this tab without a backend round trip. The
 * extension declares this origin in its `externally_connectable` list; the page opens the port and the
 * extension answers. Nothing is injected into these pages.
 *
 * Two channels, because they answer different questions. `ping` and a one-shot state request answer
 * "is it installed, and what does it know?" — which is what a freshly loaded page needs, since it has
 * missed every event that happened before it existed. A long-lived port carries what happens next.
 *
 * This is a supplement, not a source of truth. A port only reaches a tab that is open at the time, and
 * during a collection you are looking at the marketplace rather than at this app — so the usual case
 * is that nobody was listening. `GET /ingest/status` on the backend is what covers opening the app an
 * hour later, and it is the one to trust when the two disagree, because the extension's view is
 * whatever happened since this tab loaded.
 */

/**
 * The extension's id, which a web page cannot discover on its own.
 *
 * Chrome derives it from the install, so a "Load unpacked" build gets a different one per machine —
 * find it at chrome://extensions and set NEXT_PUBLIC_EXTENSION_ID. Unset, everything here reports
 * "not installed", which is also the honest answer when it genuinely is not.
 */
export const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID ?? "";

export type SessionStatus = "signed_out" | "blocked";

/**
 * Collection settings pushed to the extension, so nobody has to open its options page.
 *
 * `useLlm` is the one that matters most here. It decides whether the backend shapes a capture into the
 * schema it stores, so leaving it to a per-browser default means the feature is silently off for anyone
 * who never opens those settings — and its absence looks like the model not helping rather than like a
 * switch nobody could reach. Sent from here, an admin sets it once and every browser inherits it.
 */
export interface ExtensionSettings {
  /** File each collected page with the backend as it finishes. */
  pushToBackend?: boolean;
  /** Let the backend use the LLM to fill what the selectors could not read. */
  useLlm?: boolean;
  /** Pages read at once. 1 is the safe default; 0 means all of them and has tripped bot detection. */
  concurrency?: number;
}

export interface ExtensionState {
  running: boolean;
  platform: string | null;
  /** Set only while reading is broken. Null means the last thing it tried worked. */
  session: { status: SessionStatus; detail: string; at: number } | null;
  note: string | null;
  pages: { done: number; total: number };
  failed: number;
  stored: number;
  finishedAt: number | null;
}

/** Minimal shape of the one Chrome API a web page can reach. Typed here so no `any` leaks outward. */
type ExternalRuntime = {
  sendMessage: (
    id: string,
    message: { type: string; [key: string]: unknown },
    callback: (response?: unknown) => void
  ) => void;
  connect: (id: string, info: { name: string }) => {
    onMessage: { addListener: (fn: (message: unknown) => void) => void };
    onDisconnect: { addListener: (fn: () => void) => void };
    disconnect: () => void;
  };
  lastError?: { message?: string };
};

function runtime(): ExternalRuntime | null {
  if (!EXTENSION_ID) return null;
  const chrome = (globalThis as { chrome?: { runtime?: ExternalRuntime } }).chrome;
  return chrome?.runtime ?? null;
}

/**
 * Hand the extension its backend address and a freshly minted token.
 *
 * The reason the extension needs no settings page. It runs on Upwork's origin, where this app's session
 * cookie is never sent, so it cannot mint a token for itself — but this page can, and the two share a
 * browser. The manifest's `externally_connectable` list decides who may do this, so no other site can.
 *
 * Safe to call on every sign-in: a token is cheap, and the alternative is asking whether the stored one
 * still works, which needs the extension to hand it back. It never does — a token that leaves here is
 * write-only from this side.
 */
export async function connectExtension(
  apiUrl: string,
  token: string,
  settings: ExtensionSettings = {},
  userId?: string
): Promise<{ ok: boolean; error?: string }> {
  const api = runtime();
  if (!api) {
    return {
      ok: false,
      error: EXTENSION_ID
        ? "No extension reachable from this page."
        : "NEXT_PUBLIC_EXTENSION_ID is not set, so this page cannot address the extension.",
    };
  }
  return new Promise((resolve) => {
    try {
      api.sendMessage(
        EXTENSION_ID,
        {
          type: "connect",
          apiUrl,
          token,
          settings,
          userId,
          // The extension learns the backend's address from the handover but has no way to learn
          // this app's — different origins, and only the app knows its own.
          appUrl: globalThis.location?.origin,
        },
        (response) => {
          // The extension's own reason, when it gave one. Reducing this to a boolean is why a failed
          // connect said only "the extension did not accept the handover" — true of every failure
          // here, and no help at all in telling a wrong id from a stale build from a bad token.
          const reply = response as { ok?: boolean; error?: string } | undefined;
          const lastError = api.lastError?.message;
          resolve({
            ok: Boolean(reply?.ok),
            error:
              reply?.error ??
              (lastError
                ? `${lastError} — check the id at chrome://extensions matches ` +
                  `NEXT_PUBLIC_EXTENSION_ID, then reload the extension there.`
                : reply
                  ? undefined
                  : "The extension did not reply."),
          });
        }
      );
    } catch (err) {
      resolve({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });
}

/** Why a sync could not start. Each needs a different sentence, not one "sync failed". */
export type SyncRefusal =
  | "needs_token"
  | "revoked"
  | "unreachable"
  | "unknown_platform"
  | "different_user";

export interface SyncResult {
  ok: boolean;
  started?: boolean;
  pages?: number;
  reason?: SyncRefusal | "already_running";
}

/**
 * Ask the extension to read your profile and job feeds.
 *
 * It checks its credential first and refuses with a reason rather than starting a run that would fail
 * page by page. There is nothing to *refresh*: an API token has no expiry, only a revocation, so the
 * question is whether it still works — and when it does not, the fix is here rather than there. The
 * extension has no login of its own on purpose; this app mints the token, so this app re-mints it.
 */
export async function syncExtension(platform = "upwork", userId?: string): Promise<SyncResult> {
  const api = runtime();
  if (!api) return { ok: false, reason: "unreachable" };
  return new Promise((resolve) => {
    try {
      api.sendMessage(EXTENSION_ID, { type: "sync", platform, userId }, (response) => {
        void api.lastError;
        resolve((response as SyncResult | undefined) ?? { ok: false, reason: "unreachable" });
      });
    } catch {
      resolve({ ok: false, reason: "unreachable" });
    }
  });
}

/** Whether the extension is installed and reachable from this page. */
export async function isInstalled(): Promise<boolean> {
  const api = runtime();
  if (!api) return false;
  return new Promise((resolve) => {
    // A wrong id, an uninstalled extension and a disabled one are indistinguishable from here: all
    // three set lastError and call back with nothing. "Not reachable" is the only honest reading.
    try {
      api.sendMessage(EXTENSION_ID, { type: "ping" }, (response) => {
        void api.lastError;
        resolve(Boolean((response as { ok?: boolean } | undefined)?.ok));
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Subscribe to what the extension is doing. Returns an unsubscribe.
 *
 * The port delivers the current state on connect, so there is no separate first fetch — and a
 * reconnect after the service worker was torn down for being idle looks the same as a first connect,
 * which is why that teardown is survivable.
 */
export function watchExtension(onState: (state: ExtensionState) => void): () => void {
  const api = runtime();
  if (!api) return () => {};

  let port: ReturnType<ExternalRuntime["connect"]> | null = null;
  try {
    port = api.connect(EXTENSION_ID, { name: "autolancers" });
  } catch {
    return () => {};
  }

  port.onMessage.addListener((message) => {
    const event = message as { type?: string } & Partial<ExtensionState>;
    if (event?.type !== "state") return;
    onState({
      running: Boolean(event.running),
      platform: event.platform ?? null,
      session: event.session ?? null,
      note: event.note ?? null,
      pages: event.pages ?? { done: 0, total: 0 },
      failed: event.failed ?? 0,
      stored: event.stored ?? 0,
      finishedAt: event.finishedAt ?? null,
    });
  });

  // Chrome drops the port when the extension is disabled or updated. Nothing to do but stop
  // listening: the alternative is a reconnect loop against something that isn't there.
  port.onDisconnect.addListener(() => {
    port = null;
  });

  return () => {
    try {
      port?.disconnect();
    } catch {
      // Already gone. Not a failure — this only ever runs on unmount.
    }
  };
}
