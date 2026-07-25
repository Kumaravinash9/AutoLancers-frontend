import Link from "next/link";

/** Real listing titles from a live fetch, so the visual shows the actual mix of a feed. */
const NOISE = [
  "High-Quality SEO Backlink Creation",
  "Logo Brand Pakaian & Aksesoris",
  "Comprehensive Children's Apparel Market Research",
  "Data entry from PDF to Excel — 200 pages",
  "Trial Off-Page SEO Backlink Strategy",
  "Virtual assistant for cold calling",
  "Rewrite 30 product descriptions",
  "Facebook ads manager needed",
  "Translate documents to Portuguese",
  "Unreal Engine Realistic Game Development",
  "Shopify theme tweak — small budget",
  "Social media posts, 20 per month",
];

const SHORTLIST = [
  {
    score: 86,
    title: "Next.js dashboard for a logistics team",
    meta: "1200–2500 USD · 6 bids · 2h ago",
  },
  { score: 69, title: "Fix DeepStream counting pipeline", meta: "600–1500 USD · 8 bids · 9h ago" },
  {
    score: 62,
    title: "Python automation for booking flow",
    meta: "600–1500 USD · 13 bids · 10h ago",
  },
];

const PILLARS = [
  {
    kicker: "Discovery",
    title: "Only work that matches your skills",
    body:
      "Your skills are matched against the marketplace's own categories, so a developer sees "
      + "development work — not whatever was posted most recently. It checks every 25 seconds, "
      + "because bid counts climb fast.",
  },
  {
    kicker: "Scoring",
    title: "Every score shows its working",
    body:
      "You see which of your skills matched, how the budget compares to your floor, how many bids "
      + "are already in, and how fresh the post is. Filtered-out jobs say why, so you can tell a "
      + "quiet day from a bad setting.",
  },
  {
    kicker: "Proposals",
    title: "The first draft is already written",
    body:
      "Each match arrives with a proposal that opens on the client's actual problem, names "
      + "something specific from their post, and ends with a real question. It uses only what's in "
      + "your profile — it will not invent experience on your behalf.",
  },
  {
    kicker: "Control",
    title: "Nothing is sent without you",
    body:
      "Read, edit, then decide. Bidding through the platform stays off unless you switch it on, "
      + "and even then every bid needs your confirmation. No proposal goes out in your name by "
      + "accident.",
  },
];

const STEPS = [
  { title: "Create your account", body: "Email and password. No card." },
  { title: "Connect a marketplace", body: "One approval on Freelancer.com. Read access." },
  { title: "Describe your work", body: "Skills, rate floors, and what you never want to see." },
  { title: "Review your shortlist", body: "Open a match, read why it scored, edit, send." },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Proof />
      <Pillars />
      <Steps />
      <Close />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-border px-6 py-16 sm:py-24">
      {/* Top-aligned, not centred: the funnel is taller than the copy, and centring it opens a
          void above the headline. */}
      <div className="mx-auto grid max-w-6xl items-start gap-12 [&>*]:min-w-0 lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            For freelancers who bid to win work
          </p>

          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-[3.4rem]">
            Two hundred listings.
            <br />
            <span className="text-accent">Four worth your time.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted">
            automateLancers reads the job boards so you don&apos;t. It scores every listing against
            your actual skills and rates, sets the rest aside, and has the proposal drafted before
            you open it.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/login?mode=signup"
              className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-border px-5 py-2.5 font-medium transition-colors hover:bg-accent-soft"
            >
              Sign in
            </Link>
          </div>

          <p className="font-mono text-xs text-muted">
            Free while in early access · Connect in one click · Cancel any time
          </p>
        </div>

        <Funnel />
      </div>
    </section>
  );
}

/**
 * The signature: a feed collapsing into a shortlist.
 *
 * The dimmed rows are real titles from a live fetch. Showing the discarded ones is the point —
 * the product's job is subtraction, and a screenshot of a tidy list wouldn't convey that.
 */
function Funnel() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="flex items-baseline justify-between font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted">
        <span>Today&apos;s feed</span>
        <span className="tabular-nums">204 listings</span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-3">
        <ul className="flex flex-col gap-1.5">
          {NOISE.map((title, i) => (
            <li
              key={title}
              className="truncate rounded bg-sunken px-2.5 py-1.5 text-xs text-muted"
              style={{ opacity: Math.max(0.14, 0.62 - i * 0.05) }}
            >
              {title}
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-surface" />
      </div>

      <div className="flex items-baseline justify-between font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
        <span>Cleared your bar</span>
        <span className="tabular-nums">3</span>
      </div>

      <ul className="flex flex-col gap-2">
        {SHORTLIST.map((job) => (
          <li
            key={job.title}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-sm font-medium tabular-nums text-figure">
              {job.score}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{job.title}</p>
              <p className="mt-0.5 truncate font-mono text-[0.7rem] text-muted">{job.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Proof() {
  return (
    <section className="border-b border-border bg-deep px-6 py-14 text-deep-fg">
      <div className="mx-auto max-w-6xl">
        <p className="max-w-3xl font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
          On Freelancer.com a listing routinely passes forty bids within two hours. Being early
          matters more than being thorough — and you can&apos;t be early if you&apos;re reading
          everything.
        </p>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          What it does for you
        </h2>
        <div className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <article key={p.title} className="flex flex-col gap-2.5 border-t border-border pt-5">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
                {p.kicker}
              </span>
              <h3 className="font-display text-xl font-semibold tracking-tight text-balance">
                {p.title}
              </h3>
              <p className="leading-relaxed text-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Getting set up</h2>
        {/* Numbered because the order is real: you can't connect before you have an account. */}
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2 border-t border-border pt-5">
              <span className="font-mono text-sm tabular-nums text-figure">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display font-semibold tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6">
        <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
          Set it up once. Then read four things instead of two hundred.
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?mode=signup"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
          >
            Create your account
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border px-5 py-2.5 font-medium transition-colors hover:bg-accent-soft"
          >
            Sign in
          </Link>
        </div>
        <p className="max-w-2xl text-sm text-muted">
          automateLancers is not affiliated with Freelancer.com or Upwork. You connect your own
          account, and you keep control of everything sent from it.
        </p>
      </div>
    </section>
  );
}
