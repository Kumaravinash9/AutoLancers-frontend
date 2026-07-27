import type { Profile, ScoreReason, Skill } from "@/lib/api";

/** All copy, links, and mock data for the marketing landing page, kept out of the
 *  components so the page can be scanned and edited without touching JSX. */

export const BADGE = "Early access is open";

export const HERO = {
  kicker: "For freelancers who bid to win work",
  headline: ["Two hundred listings.", "Four worth your time."],
  subhead:
    "AutoLancers reads the job boards so you don't. It scores every listing against your " +
    "actual skills and rates, sets the rest aside, and has the proposal drafted before you open it.",
  primaryCta: "Start free",
  secondaryCta: "Book a demo",
  fineprint: "Free while in early access · Connect in one click · Cancel any time",
};

/** Replaces a logo wall we have no honest right to show yet — real mechanics instead of
 *  borrowed trust. */
export const CREDIBILITY = [
  "Connects through Freelancer.com's official OAuth",
  "Read-only scope — the bid scope is never requested",
  "Disconnect any time from Settings",
];

/**
 * Honest roadmap, not a feature claim: only Freelancer.com is actually connected today. Grounded
 * in a real, researched pain point — a bad match doesn't just waste a bid, on most platforms it
 * also counts against how you rank afterward, which is exactly the kind of cost a transparent
 * score is supposed to prevent.
 */
export const PLATFORMS = {
  kicker: "Marketplaces",
  title: "Freelancer.com today. Built to add more.",
  body:
    "A bad match doesn't just cost a bid — on most platforms it also counts against your ranking " +
    "afterward. The scoring engine is built to read any job feed; Freelancer.com is connected now, " +
    "and the marketplaces freelancers ask for most are next.",
  items: [
    { name: "Freelancer.com", status: "live" },
    { name: "Upwork", status: "next" },
    { name: "Fiverr", status: "next" },
    { name: "Toptal", status: "next" },
    { name: "PeoplePerHour", status: "next" },
    { name: "Guru", status: "next" },
  ],
};

/** A tight at-a-glance strip right under Credibility — one line each, no prose. Kept distinct
 *  from Comparison below: this is "what you get," Comparison is "how it's different." */
export const GLANCE = [
  {
    title: "Skills-matched",
    body: "Scored against your own skills and rate floors, every fetch.",
  },
  {
    title: "Transparent scoring",
    body: "Every point is itemized. Rejections say why, matches say why not more.",
  },
  {
    title: "Human-approved",
    body: "Drafts wait for you. Bids need a second confirmation, every time.",
  },
];

/**
 * Positioning, not a new claim: contrasts keyword/save-search filtering (what most job-alert
 * tools and marketplace saved searches actually do) against itemized scoring. Every point on the
 * right is a real, already-shipped mechanic (reasons list, floors, keyword excludes, re-scoring),
 * not something invented for this section.
 */
export const COMPARISON = {
  kicker: "Why not just a saved search",
  title: "A keyword match isn't a reason",
  before: {
    label: "Keyword search",
    snippet: 'IF title CONTAINS "Next.js"\nTHEN show',
    points: [
      "Matches a word in the title, nothing else",
      "No sense of your rate floor or budget fit",
      "Can't tell you why a result showed up",
      "Same list whether 2 bids are in or 40",
    ],
  },
  after: {
    label: "AutoLancers",
    points: [
      "Scores skills, budget, competition, and recency separately",
      "Floors and excluded keywords filter before you ever see a job",
      "Every match — and every rejection — shows its itemized reasons",
      "Re-scores stored jobs the moment you change a setting",
    ],
  },
};

/**
 * Sample data for the LiveQueue signature — a coded replica of the actual queue + job-detail
 * screens, not a screenshot. Shapes mirror the real tabs (queue/page.tsx TABS), row layout
 * (JobRow), and reasons list (jobs/[id]/page.tsx) so the marketing page is built from the same
 * materials as the product, not illustrations of it.
 */
export const QUEUE_DEMO = {
  tabs: ["Needs review", "All matched", "Rejected"],
  selectedIndex: 0,
  rows: [
    {
      title: "Next.js dashboard for a logistics team",
      meta: "1200–2500 USD · 6 bids · 2h ago",
      score: 86,
      skills: ["Next.js", "TypeScript", "Postgres"],
    },
    {
      title: "Fix DeepStream counting pipeline",
      meta: "600–1500 USD · 8 bids · 9h ago",
      score: 69,
      skills: ["Python", "OpenCV"],
    },
    {
      title: "Python automation for booking flow",
      meta: "600–1500 USD · 13 bids · 10h ago",
      score: 62,
      skills: ["Python", "Selenium"],
    },
    {
      title: "Shopify theme tweak — small budget",
      meta: "80–150 USD · 22 bids · 40m ago",
      score: 31,
      skills: ["Shopify"],
    },
    {
      title: "Data entry from PDF to Excel — 200 pages",
      meta: "40–80 USD · 35 bids · 15m ago",
      score: 12,
      skills: ["Data entry"],
    },
  ],
  reasons: [
    { label: "Skill match", detail: "Next.js, TypeScript, and Postgres all listed", points: 42 },
    { label: "Budget", detail: "1200–2500 USD clears your 900 floor", points: 24 },
    { label: "Competition", detail: "Only 6 bids in — you are early to this one", points: 14 },
    { label: "Recency", detail: "Posted 2 hours ago", points: 6 },
  ] satisfies ScoreReason[],
  proposal:
    "Hi — the part of your brief that stood out was the real-time exception queue, since that's " +
    "the piece most logistics dashboards get wrong first. I've built a Next.js and Postgres app in " +
    "the same shape before (multi-warehouse status board, sub-second updates) and can share it as " +
    "a reference. Is the exception queue the main bottleneck today, or is reporting just as urgent?",
};

export const PROOF = {
  figure: 40,
  unit: "bids, inside two hours",
  context:
    "That's how fast a typical Freelancer.com listing fills up. Being early matters more than " +
    "being thorough — and you can't be early if you're reading everything yourself.",
  callout: "A quiet queue and a wrong setting look identical — unless something tells you which.",
};

/** The real double-confirmation bid flow from jobs/[id]/page.tsx's BidPanel, replayed as a
 *  dedicated section rather than a small widget — this friction is the whole "Control" pitch. */
export const BID_CONFIRM = {
  kicker: "Control",
  title: "Nothing is sent without you",
  body:
    "Read, edit, then decide. Bidding through the platform stays off unless you switch it on, " +
    "and even then every bid needs a second, explicit confirmation. No proposal goes out in your " +
    "name by accident.",
  jobTitle: "Next.js dashboard for a logistics team",
  currency: "USD",
  amount: 1800,
  days: 7,
};

/** A coded replica of the real scoring surface from profile/page.tsx — the point being that
 *  these are your numbers to set, not a black-box model. */
export const PROFILE_DEMO = {
  kicker: "Configuration",
  title: "You set the knobs, not a model",
  body:
    "Skills, floors, and what four things matter to your score are all plain numbers you own. " +
    "Change one, re-score, and every stored job updates to match.",
  skills: [
    { name: "next.js", weight: 5 },
    { name: "typescript", weight: 4 },
    { name: "postgres", weight: 3 },
  ] satisfies Skill[],
  weights: [
    { label: "Skills", key: "weight_skills", value: 5 },
    { label: "Budget", key: "weight_budget", value: 3 },
    { label: "Competition", key: "weight_competition", value: 2 },
    { label: "Recency", key: "weight_recency", value: 1 },
  ] satisfies { label: string; key: keyof Profile; value: number }[],
};

/**
 * There's no one-click "mode" in the product — these are illustrations of what the same four
 * sliders in PROFILE_DEMO.weights look like set differently, not a feature of their own. Said
 * explicitly in the section copy so this doesn't read as a claim. Its own section rather than a
 * decoration inside ProfileTuner, since it needs room for real body copy per example.
 */
export const PRESETS = {
  kicker: "Flexibility",
  title: "Your priorities change. The scoring can too.",
  subhead:
    "There's no built-in \"mode\" — just the same four sliders from your profile in Settings, set " +
    "three different ways for three different situations.",
  items: [
    {
      size: "large",
      label: "Fast turnaround",
      hook: "New to a marketplace, or just want the queue moving?",
      body:
        "Push competition and recency above budget, and jobs with only a couple of bids in the " +
        "last hour jump to the top — even at modest pay. Good for building reviews and a track " +
        "record before you start being picky.",
      weightedToward: ["Competition", "Recency"],
    },
    {
      size: "small",
      label: "High value",
      hook: "Already busy and only want it worth interrupting for?",
      body:
        "Push budget up and competition down, and only larger contracts clear the bar — no matter " +
        "how many other bids are already in.",
      weightedToward: ["Budget"],
    },
    {
      size: "small",
      label: "Skill-first",
      hook: "Only want to see your exact stack?",
      body:
        "Push skills above everything else, and the queue ranks by how closely a listing matches " +
        "what you've actually listed — budget and bid count barely move it.",
      weightedToward: ["Skills"],
    },
  ] as const,
};

/**
 * The genuine trust gap with any automated filter: a quiet queue could mean nothing good was
 * posted, or it could mean a setting is wrong — and you can't tell which unless the rejections
 * say why. Real feature (Job.rejected / Job.rejection_reason, the queue page's Rejected tab),
 * not a new one invented for the landing page.
 */
export const REJECTED = {
  kicker: "Filtering",
  title: "A quiet day looks different from a bad setting",
  body:
    "Every filtered-out job keeps its reason. If nothing's showing up, you can tell in seconds " +
    "whether the market was actually quiet or your floor is set too high — instead of wondering.",
  jobs: [
    {
      title: "Logo design for a bakery",
      reason: "Budget 40–60 USD — below your 900 floor",
    },
    {
      title: "WordPress plugin fix, urgent",
      reason: "Scored 46 — below your minimum of 55",
    },
    {
      title: "Full-stack app, no-code preferred",
      reason: "Excluded keyword matched: \"no-code\"",
    },
    {
      title: "Data annotation for ML training",
      reason: "No listed skill matched (need Next.js, Python, or TypeScript)",
    },
  ],
};

/**
 * A coded replica of the real Proposals page (src/app/proposals/page.tsx) — pairs every bid with
 * the score that recommended it, the same "Calibration" stat strip (Total/Submitted/
 * Selected/Avg score sent) from ProposalStats in lib/api.ts. The note below is that page's own
 * caveat, reworded: ProposalStats.outcome_tracking_enabled is false until award status syncs back
 * from the marketplace, so this isn't a live win-rate dashboard — it's honest about that, unlike
 * a dashboard that would just show a percentage with no such caveat.
 */
export const CALIBRATION = {
  kicker: "Track record",
  title: "See if the score is actually calling it",
  body:
    "Every proposal keeps the score that recommended it. If your accepted work and your rejected " +
    "work average about the same, the score isn't earning its place — and you'd see that here.",
  stats: [
    { label: "Total", value: "18", note: "6 still drafts" },
    { label: "Submitted", value: "12", note: "9 from our picks" },
    { label: "Selected", value: "4", note: "8 not selected" },
    { label: "Avg score sent", value: "71.4", note: "76.2 on won work" },
  ],
  rows: [
    {
      title: "Next.js dashboard for a logistics team",
      status: "ACCEPTED" as const,
      score: 86,
      recommended: true,
    },
    {
      title: "Fix DeepStream counting pipeline",
      status: "SUBMITTED" as const,
      score: 69,
      recommended: true,
    },
    {
      title: "Landing page copy edit",
      status: "REJECTED" as const,
      score: 58,
      recommended: false,
    },
  ],
  note:
    "Nothing syncs award status back from Freelancer.com automatically yet. A result here means " +
    "you told it, not that it watched — Selected and Not selected are only ever self-reported.",
};

/**
 * Freelancer.com's own bid-ranking system already weighs response time alongside rate and
 * rating (https://www.freelancer.com/community/articles/understanding-freelancer-com-bid-ranking)
 * — being early is a real ranking factor there, not a claim we invented. The ~25 second recheck
 * is the actual poller interval already stated on the Settings page.
 */
export const STEPS_INTRO = {
  kicker: "Getting set up",
  title: "Four steps to your first shortlist",
  subhead:
    "Freelancer.com's own bid ranking already rewards whoever responds first. This is what runs " +
    "before you ever open the tab, so you're early without watching the feed yourself.",
};

export const STEPS = [
  {
    title: "Create your account",
    body: "Email and password — no card, and no marketplace connection required yet.",
  },
  {
    title: "Connect a marketplace",
    body: "One OAuth approval on Freelancer.com. Read-only access; the bid scope is never requested.",
  },
  {
    title: "Describe your work",
    body: "Skills and their weights, rate floors, and any keywords to include or exclude — the same numbers behind every score.",
  },
  {
    title: "Review your shortlist",
    body: "The queue rechecks every 25 seconds. Open a match, read why it scored, edit the draft, and send it yourself.",
  },
];

export const FAQ_INTRO = {
  kicker: "Questions",
  title: "Straight answers",
  body:
    "Especially about your money and your account — the two things worth being direct about " +
    "before you connect anything.",
};

export const FAQ = [
  {
    question: "Does this submit bids automatically?",
    answer:
      "No. Copy proposal is the primary action — nothing is submitted to Freelancer.com from here " +
      "by default. You paste the draft in yourself, and Mark as sent only records that you did. " +
      "Placing a bid through the API is a separate, opt-in action that still needs your confirmation " +
      "every time.",
  },
  {
    question: "Does this violate Freelancer.com's terms?",
    answer:
      "Reading the job feed and drafting proposals doesn't touch anything Freelancer.com restricts. " +
      "We connect with a read-only OAuth scope, so the app can see listings but can't act on your " +
      "account unless you explicitly turn on bidding.",
  },
  {
    question: "What does it access on my account?",
    answer:
      "Only the read scope from Freelancer.com's own OAuth flow — your job feed and account basics. " +
      "The bid scope is deliberately not requested, so the connection itself cannot submit on your " +
      "behalf even if something asked it to.",
  },
  {
    question: "How is the score calculated?",
    answer:
      "Four weighted parts: skill match, budget fit against your floor, how many bids are already " +
      "in, and how fresh the post is. You set the weights and floors yourself in your profile, and " +
      "every job shows the same itemized breakdown shown above.",
  },
  {
    question: "What does it cost?",
    answer: "Free while in early access. No card required to start, and you can cancel any time.",
  },
];

export const CLOSE = {
  title: "Set it up once. Then read four things instead of two hundred.",
  fineprint: "No card required · Cancel any time",
  primaryCta: "Create your account",
  secondaryCta: "Sign in",
  tertiaryCta: "Book a demo",
};

export const FOOTER = {
  blurb: "Watches the job boards, scores what fits, drafts the proposal. You review and send.",
  disclaimer:
    "AutoLancers is not affiliated with Freelancer.com or Upwork. You connect your own account, " +
    "and you keep control of everything sent from it.",
  productLinks: [
    { href: "#how-it-works", label: "How it works" },
    { href: "#steps", label: "Getting set up" },
    { href: "#faq", label: "FAQ" },
  ],
  email: "support@autolancers.app",
};
