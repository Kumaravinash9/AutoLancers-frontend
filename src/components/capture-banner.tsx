"use client";

import { useEffect, useState } from "react";

import { CaptureStatus, captures } from "@/lib/api";
import { ExtensionState, watchExtension } from "@/lib/extension";

/**
 * Says when the extension can no longer read a marketplace.
 *
 * This exists because the failure has no other symptom. Signed out of Upwork, the extension reads a
 * login page that loads perfectly, finds no jobs, and reports zero — so the board below keeps showing
 * yesterday's scores with every appearance of being current. Nothing errors, nothing is empty, and the
 * only wrong thing is that it stopped being true.
 *
 * Two sources, deliberately. The extension is in the same browser and tells this tab the moment it
 * happens, which is the case where you are watching. The backend's record covers the far more common
 * one: the collection ran while you were looking at Upwork, and you open this app an hour later. The
 * live view wins when present, because it is newer by definition.
 */
export function CaptureBanner() {
  const [stored, setStored] = useState<CaptureStatus[]>([]);
  const [live, setLive] = useState<ExtensionState | null>(null);

  useEffect(() => {
    const state = { cancelled: false };

    // Signed out of *this app* is the normal case on the marketing pages, so a failure here is not
    // worth showing — there is nothing to warn about when there is no board.
    void (async () => {
      try {
        const rows = await captures.status();
        if (!state.cancelled) setStored(rows);
      } catch {
        if (!state.cancelled) setStored([]);
      }
    })();

    const stop = watchExtension((next) => {
      if (!state.cancelled) setLive(next);
    });

    return () => {
      state.cancelled = true;
      stop();
    };
  }, []);

  // The extension's word is newer than the backend's for the platform it just tried, so it replaces
  // that row rather than adding a second banner about the same thing.
  const rows = live?.session
    ? [
        {
          platform: live.platform ?? "that marketplace",
          status: live.session.status === "blocked" ? ("BLOCKED" as const) : ("SIGNED_OUT" as const),
          detail: live.note ?? live.session.detail,
          page_key: null,
          since: new Date(live.session.at).toISOString(),
          last_checked_at: new Date(live.session.at).toISOString(),
          last_ok_at: null,
        },
        ...stored.filter((row) => row.platform !== live.platform),
      ]
    : stored;

  const problems = rows.filter((row) => row.status !== "OK");
  if (problems.length === 0) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto w-full max-w-6xl space-y-1 px-6 py-3">
        {problems.map((row) => (
          <p key={row.platform} className="text-sm">
            <span className="font-medium capitalize">{row.platform}</span>{" "}
            {row.status === "SIGNED_OUT" ? (
              <>
                — you&rsquo;re signed out, so nothing new is being collected. Sign in{" "}
                {age(row.since) && <>({age(row.since)}) </>}and run Collect again.
              </>
            ) : (
              <>
                — the marketplace served a challenge page instead of the content{" "}
                {age(row.since) && <>({age(row.since)}) </>}. Leave it a while before collecting
                again.
              </>
            )}
            {/* Said out loud, because the scores on screen look no different when they are stale. */}
            <span className="text-muted">
              {" "}
              Scores here reflect the last successful read
              {row.last_ok_at ? `, ${age(row.last_ok_at)}` : " — there has not been one yet"}.
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * "3 hours ago", from a timestamp.
 *
 * Only ever coarse. "Signed out for three days" and "signed out just now" are different problems, and
 * the difference that matters is the order of magnitude, not the minutes.
 */
function age(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}
