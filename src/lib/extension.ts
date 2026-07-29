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
    message: { type: string },
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
