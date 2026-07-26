"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, ErrorNote, Field, inputClass, Page } from "@/components/ui";
import { demo } from "@/lib/api";

const MARKETPLACES = [
  { value: "freelancer", label: "Freelancer.com" },
  { value: "upwork", label: "Upwork" },
  { value: "other", label: "Somewhere else" },
  { value: "", label: "Not bidding anywhere yet" },
];

/**
 * Book a walkthrough.
 *
 * A form rather than a calendar link, because there is no scheduling account behind this yet and
 * a dead booking page is worse than an honest one. The request is stored, so one that arrives at
 * 2am is still waiting in the morning — a mailto to an unwatched inbox would lose it with nobody
 * the wiser.
 */
export default function DemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketplace, setMarketplace] = useState("freelancer");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await demo.request({
        name,
        email,
        note: note.trim() || undefined,
        marketplace: marketplace || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <Page className="max-w-xl space-y-4 py-20">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Booked — we&apos;ll be in touch.
        </h1>
        <p className="text-muted">
          We&apos;ll email {email} to find a time. Walkthroughs run about 20 minutes: we connect a
          marketplace account of yours, let it score a real board, and you read the drafts.
        </p>
        <p className="text-muted">
          You don&apos;t have to wait for us — the product is free during early access.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/login?mode=signup"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
          >
            Start free now
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-5 py-2.5 font-medium transition-colors hover:bg-accent-soft"
          >
            Back to the site
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page className="max-w-xl space-y-6 py-16">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Book a demo</h1>
        {/* Say what the call is, so nobody books expecting a sales deck. */}
        <p className="mt-2 text-muted">
          Twenty minutes, screen shared. We connect one of your marketplace accounts, let it score
          a live board, and you judge the drafts it writes. No slides.
        </p>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </Field>

        <Field label="Email" hint="Where we send the invite. Nothing else.">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>

        <Field label="Where do you bid today?">
          <select
            className={inputClass}
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
          >
            {MARKETPLACES.map((m) => (
              <option key={m.label} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="What do you want to see?"
          hint="Optional. Tell us your line of work and we'll point it at a real board in that field."
        >
          <textarea
            className={`${inputClass} min-h-24`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" variant="primary" disabled={sending}>
            {sending ? "Sending…" : "Request a time"}
          </Button>
          <Link href="/login?mode=signup" className="text-sm text-muted hover:text-foreground">
            or just start free
          </Link>
        </div>
      </form>
    </Page>
  );
}
