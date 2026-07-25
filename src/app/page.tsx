import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "automateLancers — bid on the jobs worth bidding on",
  description:
    "Watches freelance marketplaces for work that actually fits your skills, scores every listing "
    + "with its reasons shown, and drafts the proposal. You review and send.",
};

/** Live discovery + scoring; drafting runs on whichever LLM is configured. */
const PILLARS = [
  {
    kicker: "Discovery",
    title: "Finds the work that fits you",
    body:
      "Your skills are matched against the marketplace's own categories, so the queue is "
      + "developers' work if you're a developer — not whatever happened to be posted last. "
      + "Polls every 25 seconds, because bid counts climb fast.",
    status: "live",
  },
  {
    kicker: "Scoring",
    title: "Shows its working, every time",
    body:
      "Each listing gets a score out of 100 and the reasons behind it: which of your skills "
      + "matched, how the budget compares to your floor, how many bids are already in, how fresh "
      + "it is. Rejected listings say why they were rejected.",
    status: "live",
  },
  {
    kicker: "Drafting",
    title: "Writes the first draft for you",
    body:
      "An LLM drafts a proposal that opens on the client's actual problem, names something "
      + "specific from their post, and closes with a real question. It only uses facts from your "
      + "profile — it will not invent experience or numbers on your behalf.",
    status: "live",
  },
  {
    kicker: "Profile",
    title: "One profile drives all of it",
    body:
      "Your skills, weights, rate floors and positioning live in one place, and both the scoring "
      + "and the drafts read from it. Change a weight, re-score everything, see the queue reorder.",
    status: "live",
  },
  {
    kicker: "Notifications",
    title: "Tells you when something matters",
    body:
      "A strong match at 2am is worth knowing about before the bid count triples. Alerts to "
      + "WhatsApp, Slack or email when a listing clears your bar, so you don't sit watching a queue.",
    status: "planned",
  },
  {
    kicker: "Platforms",
    title: "More than one marketplace",
    body:
      "Freelancer.com connects directly. Upwork's terms prohibit automated discovery, so that "
      + "route is paste-a-job-in rather than polling — one queue either way.",
    status: "partial",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect your account",
    body: "One OAuth approval, read access only. Or skip it — public listings work without connecting.",
  },
  {
    n: "02",
    title: "Describe what you want",
    body: "Skills and weights, your rate floors, the words that should never appear in a job you see.",
  },
  {
    n: "03",
    title: "Review what comes back",
    body: "Open a match, read why it scored, edit the draft, copy it across. The queue keeps filling.",
  },
];

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  live: { text: "Available now", className: "text-good border-good/40 bg-good/10" },
  partial: { text: "Partly available", className: "text-warn border-warn/40 bg-warn/10" },
  planned: { text: "Planned", className: "text-muted border-border bg-surface" },
};

export default function ProductPage() {
  return (
    <div>
      <Hero />
      <Problem />
      <Pillars />
      <HowItWorks />
      <Guarantee />
      <Close />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-deep px-6 py-20 text-deep-fg sm:py-28">
      <div className="mx-auto grid max-w-5xl gap-12 [&>*]:min-w-0 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-deep-muted">
            Freelance bidding assistant
          </p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">
            Stop reading job boards.
            <br />
            Start reviewing a shortlist.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-deep-muted">
            It watches the marketplace for work that genuinely fits your skills, scores every
            listing and shows you why, then drafts the proposal. You read four good matches instead
            of two hundred listings.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/settings"
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Connect an account
            </Link>
            <Link
              href="/queue"
              className="rounded-md border border-deep-muted/40 px-5 py-2.5 text-sm font-medium transition-colors hover:border-deep-fg"
            >
              See the queue
            </Link>
          </div>
          <p className="font-mono text-xs text-deep-muted">
            Nothing is ever submitted for you. Every proposal waits for your review.
          </p>
        </div>

        <QueuePreview />
      </div>
    </section>
  );
}

/** A still of the real queue — same score badge, same reason lines the app renders. */
function QueuePreview() {
  return (
    <div className="rounded-lg border border-deep-muted/25 bg-black/20 p-4" aria-hidden="true">
      <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-deep-muted">
        Needs review
      </p>

      <div className="flex flex-col gap-2.5">
        <div className="rounded-md border border-deep-muted/25 p-3">
          <div className="flex items-start gap-3">
            <span className="rounded bg-good/20 px-1.5 py-0.5 font-mono text-sm font-semibold tabular-nums text-good">
              86
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Next.js dashboard for a logistics team</p>
              <p className="mt-1 font-mono text-[0.7rem] text-deep-muted">
                1200–2500 USD · 6 bids · 2h ago · draft ready
              </p>
            </div>
          </div>
          <dl className="mt-3 space-y-1 border-t border-deep-muted/20 pt-2 font-mono text-[0.7rem] text-deep-muted">
            {[
              ["+24.0", "Skills matched — next.js, react, node"],
              ["+20.0", "Budget fit — up to 2500 against your floor"],
              ["+7.6", "Competition — 6 bids so far"],
            ].map(([points, reason]) => (
              <div key={reason} className="flex gap-3">
                <dt className="w-12 shrink-0 tabular-nums">{points}</dt>
                {/* min-w-0 is load-bearing: without it a flex item won't shrink below its
                    text width, so `truncate` never engages and the column blows out. */}
                <dd className="min-w-0 truncate">{reason}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-md border border-deep-muted/20 p-3 opacity-60">
          <div className="flex items-center gap-3">
            <span className="rounded bg-deep-muted/20 px-1.5 py-0.5 font-mono text-sm font-semibold tabular-nums text-deep-muted">
              0
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm">Logo and brand palette for a bakery</p>
              <p className="mt-0.5 font-mono text-[0.7rem] text-deep-muted">
                Rejected — 42 bids already, cap is 25
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-[auto_1fr] sm:gap-12">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted sm:pt-1.5">
          The problem
        </p>
        <div className="flex flex-col gap-5">
          <p className="text-2xl leading-snug tracking-tight text-balance sm:text-[1.75rem]">
            Bidding rewards being early, and punishes reading everything.
          </p>
          <p className="max-w-2xl leading-relaxed text-muted">
            On Freelancer.com a listing routinely passes forty bids within a couple of hours. By the
            time you have read enough postings to find one worth answering, the ones worth answering
            are crowded. So the work becomes triage — and triage is the part a machine is good at.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted">What you get</h2>

        <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const status = STATUS_LABEL[p.status];
            return (
              <article key={p.title} className="flex flex-col gap-2.5 border-t border-border pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
                    {p.kicker}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[0.65rem] ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-balance">{p.title}</h3>
                <p className="leading-relaxed text-muted">{p.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          Getting started
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-2 border-t border-border pt-5">
              <span className="font-mono text-sm tabular-nums text-accent">{s.n}</span>
              <h3 className="font-semibold tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Guarantee() {
  return (
    <section className="bg-deep px-6 py-16 text-deep-fg">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-[auto_1fr] sm:gap-12">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-deep-muted sm:pt-1.5">
          The guarantee
        </p>
        <div className="flex flex-col gap-5">
          <p className="text-2xl leading-snug tracking-tight text-balance sm:text-[1.75rem]">
            It cannot bid for you. Not by policy — by construction.
          </p>
          <p className="max-w-2xl leading-relaxed text-deep-muted">
            When you connect an account, the permission that would allow placing bids is never
            requested. The connection grants read access to your basic profile and nothing else, so
            the ability to submit on your behalf does not exist to be misused.
          </p>
          <p className="max-w-2xl leading-relaxed text-deep-muted">
            An assistant that fires off proposals in your name is a good way to lose an account and
            a reputation. This drafts; you decide what gets sent.
          </p>
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-5">
        <h2 className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
          Set your skills once, then read only what clears the bar.
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Set up your profile
          </Link>
          <Link
            href="/queue"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent-soft"
          >
            Open the queue
          </Link>
        </div>
      </div>
    </section>
  );
}
