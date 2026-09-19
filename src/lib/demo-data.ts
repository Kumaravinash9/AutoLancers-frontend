/**
 * Fallback content shown when a card can't reach the backend (`ApiError.status === 0` from
 * `request()` in `./api`) — never shown just because a real list happens to be empty. Every
 * shape here matches the real API types exactly, so a card renders identically whether the
 * data came from the network or from here.
 */

import {
  Account,
  AuthStatus,
  Connection,
  Job,
  Profile,
  ProfileCard,
  ProfileDetail,
  ProposalRow,
  ProposalStats,
} from "./api";

/** Only used when the backend is unreachable — never as a stand-in for a failed login. A real
 *  401 (genuinely signed out) still falls through to null, same as before. */
export const DEMO_ACCOUNT: Account = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "jane.doe@example.com",
  role: "admin",
  is_active: true,
  created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  last_login_at: new Date().toISOString(),
};

export const DEMO_CONNECTIONS: Connection[] = [
  {
    id: "demo-acc1",
    platform: "freelancer",
    proposals: 12,
    wins: 4,
    platform_username: "janedoe92",
    scope: "bid",
    rating: 4.9,
    total_reviews: 128,
    avatar_url: null,
    status: "ACTIVE",
    is_selected: true,
    display_name: "Jane Doe",
    tagline: "Full-Stack Developer · React, Next.js, Python",
    summary:
      "Full-stack engineer specializing in React/Next.js frontends and FastAPI/Python backends. " +
      "8 years building internal tools and customer-facing dashboards for logistics and fintech clients.",
    account_skills: ["React", "Next.js", "Python", "FastAPI", "PostgreSQL"],
    hourly_rate: 55,
    currency: "USD",
    country: "Canada",
    portfolio_count: 9,
    member_since: new Date(Date.now() - 4 * 365 * 86_400_000).toISOString(),
    connected_at: new Date(Date.now() - 200 * 86_400_000).toISOString(),
    last_synced_at: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "demo-acc2",
    platform: "upwork",
    proposals: 6,
    wins: 1,
    platform_username: "jane.codes",
    scope: "readonly",
    rating: 4.8,
    total_reviews: 54,
    avatar_url: null,
    status: "ACTIVE",
    is_selected: false,
    display_name: "Jane Doe",
    tagline: "Mirrored via browser extension — no bidding",
    summary: null,
    account_skills: ["React", "TypeScript"],
    hourly_rate: 50,
    currency: "USD",
    country: "Canada",
    portfolio_count: 3,
    member_since: new Date(Date.now() - 2 * 365 * 86_400_000).toISOString(),
    connected_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    last_synced_at: new Date(Date.now() - 3600_000).toISOString(),
  },
];

type JobInput = Omit<Job, "local_currency" | "budget_min_local" | "budget_max_local" | "has_changes" | "changed_at"> &
  Partial<Pick<Job, "has_changes" | "changed_at">>;

function job(partial: JobInput): Job {
  return {
    ...partial,
    local_currency: null,
    budget_min_local: null,
    budget_max_local: null,
    has_changes: partial.has_changes ?? false,
    changed_at: partial.changed_at ?? null,
  };
}

export const DEMO_JOBS: Job[] = [
  job({
    id: "demo-1",
    platform: "freelancer",
    external_id: null,
    title: "React Native app: offline-first grocery list sync",
    description:
      "We need an offline-first mobile app that syncs a shared grocery list across household members. " +
      "Must work fully offline and reconcile conflicts when connectivity returns. Existing Figma designs provided.",
    url: "",
    skills_listed: ["React Native", "SQLite", "Offline sync"],
    budget_type: "FIXED",
    budget_min: 1200,
    budget_max: 1800,
    currency: "USD",
    bid_count: 14,
    posted_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    score: 91,
    reasons: [
      { label: "Skill match", detail: "React Native, SQLite, and offline sync all listed", points: 45 },
      { label: "Budget", detail: "1200–1800 USD clears your floor", points: 20 },
      { label: "Competition", detail: "14 bids in, but few with your offline-sync history", points: 16 },
      { label: "Recency", detail: "Posted 2 hours ago", points: 10 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: "Hi — I've built...",
    status: "VIEWED",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
    client_country: "United States",
    client_payment_verified: true,
    client_rating: 4.9,
    client_reviews_count: 62,
    client_total_spend: 84_000,
    client_hire_rate: 87,
  }),
  job({
    id: "demo-2",
    platform: "freelancer",
    external_id: null,
    title: "FastAPI backend for internal inventory tool",
    description:
      "Internal tool for tracking warehouse inventory across 3 sites. Need a FastAPI + PostgreSQL backend " +
      "with role-based access and a CSV import/export endpoint.",
    url: "",
    skills_listed: ["FastAPI", "PostgreSQL", "Docker"],
    budget_type: "HOURLY",
    budget_min: 45,
    budget_max: 60,
    currency: "USD",
    bid_count: 6,
    posted_at: new Date(Date.now() - 40 * 60_000).toISOString(),
    score: 88,
    reasons: [
      { label: "Skill match", detail: "FastAPI, PostgreSQL, and Docker all listed", points: 42 },
      { label: "Budget", detail: "45–60 USD/hr clears your rate floor", points: 22 },
      { label: "Competition", detail: "Only 6 bids in — you are early to this one", points: 18 },
      { label: "Recency", detail: "Posted 40 minutes ago", points: 6 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: "Hi — I've built...",
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  job({
    id: "demo-3",
    platform: "freelancer",
    external_id: null,
    title: "Fix flaky Playwright test suite (CI timeouts)",
    description:
      "Our Playwright suite fails intermittently in CI (GitHub Actions) with timeout errors. Need someone " +
      "to diagnose and stabilize it — likely race conditions around auth setup.",
    url: "",
    skills_listed: ["Playwright", "CI/CD", "TypeScript"],
    budget_type: "FIXED",
    budget_min: 300,
    budget_max: 500,
    currency: "USD",
    bid_count: 9,
    posted_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    score: 84,
    reasons: [
      { label: "Skill match", detail: "Playwright and TypeScript listed", points: 34 },
      { label: "Budget", detail: "300–500 USD clears your floor", points: 20 },
      { label: "Competition", detail: "9 bids in — moderately crowded", points: 20 },
      { label: "Recency", detail: "Posted 3 hours ago", points: 10 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  job({
    id: "demo-4",
    platform: "freelancer",
    external_id: null,
    title: "Next.js dashboard for a logistics team",
    description:
      "Real-time exception queue for a multi-warehouse logistics operation. Sub-second updates, role-based " +
      "views for dispatchers vs. managers. Postgres already provisioned.",
    url: "",
    skills_listed: ["Next.js", "TypeScript", "Postgres"],
    budget_type: "FIXED",
    budget_min: 1200,
    budget_max: 2500,
    currency: "USD",
    bid_count: 6,
    posted_at: new Date(Date.now() - 15 * 60_000).toISOString(),
    score: 95,
    reasons: [
      { label: "Skill match", detail: "Next.js, TypeScript, and Postgres all listed", points: 46 },
      { label: "Budget", detail: "1200–2500 USD clears your floor comfortably", points: 24 },
      { label: "Competition", detail: "Only 6 bids in — you are early to this one", points: 18 },
      { label: "Recency", detail: "Posted 15 minutes ago", points: 7 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
    has_changes: true,
    changed_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    client_country: "Canada",
    client_payment_verified: true,
    client_rating: 4.7,
    client_reviews_count: 21,
    client_total_spend: 26_500,
    client_hire_rate: 74,
  }),
  job({
    id: "demo-5",
    platform: "freelancer",
    external_id: null,
    title: "Node.js webhook relay service",
    description: "Relay and retry webhooks between two SaaS platforms with dead-letter handling.",
    url: "",
    skills_listed: ["Node.js", "Redis", "Webhooks"],
    budget_type: "FIXED",
    budget_min: 500,
    budget_max: 800,
    currency: "USD",
    bid_count: 11,
    posted_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
    score: 76,
    reasons: [
      { label: "Skill match", detail: "Node.js listed; Redis and webhooks inferred from your history", points: 30 },
      { label: "Budget", detail: "500–800 USD clears your floor", points: 18 },
      { label: "Competition", detail: "11 bids in — moderately crowded", points: 18 },
      { label: "Recency", detail: "Posted over a day ago", points: 10 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: "Hi — I've built a similar relay service before...",
    status: "APPLIED",
    first_seen_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    bid_amount: 610,
    bid_period_days: 5,
    bid_submitted_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    external_bid_id: "demo-bid-1",
  }),
  job({
    id: "demo-6",
    platform: "upwork",
    external_id: null,
    title: "Django REST API for a fintech onboarding flow",
    description: "KYC document upload + verification status API, integrating with a third-party identity vendor.",
    url: "",
    skills_listed: ["Django", "DRF", "PostgreSQL"],
    budget_type: "HOURLY",
    budget_min: 50,
    budget_max: 70,
    currency: "USD",
    bid_count: 8,
    posted_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
    score: 89,
    reasons: [
      { label: "Skill match", detail: "Django/DRF close match to your FastAPI experience", points: 40 },
      { label: "Budget", detail: "50–70 USD/hr clears your rate floor", points: 24 },
      { label: "Competition", detail: "8 bids in — moderately crowded", points: 17 },
      { label: "Recency", detail: "Posted 5 hours ago", points: 8 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
    client_country: "United Kingdom",
    client_payment_verified: false,
    client_rating: null,
    client_reviews_count: 0,
    client_total_spend: 0,
    client_hire_rate: null,
  }),
  job({
    id: "demo-7",
    platform: "freelancer",
    external_id: null,
    title: "Cross-platform Flutter app for field technicians",
    description: "Offline work-order app for field techs — photo upload, signature capture, GPS check-in.",
    url: "",
    skills_listed: ["Flutter", "Dart", "Firebase"],
    budget_type: "FIXED",
    budget_min: 2200,
    budget_max: 3500,
    currency: "USD",
    bid_count: 19,
    posted_at: new Date(Date.now() - 8 * 3600_000).toISOString(),
    score: 67,
    reasons: [
      { label: "Skill match", detail: "No Flutter/Dart history on file — inferred only from React Native", points: 20 },
      { label: "Budget", detail: "2200–3500 USD clears your floor", points: 24 },
      { label: "Competition", detail: "19 bids in — a crowded listing", points: 13 },
      { label: "Recency", detail: "Posted 8 hours ago", points: 10 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "VIEWED",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  job({
    id: "demo-8",
    platform: "freelancer",
    external_id: null,
    title: "Chrome extension for competitor price scraping",
    description: "Extension that scrapes product prices from 4 competitor sites and reports to a Sheet.",
    url: "",
    skills_listed: ["Chrome extension", "JavaScript", "Web scraping"],
    budget_type: "FIXED",
    budget_min: 400,
    budget_max: 600,
    currency: "USD",
    bid_count: 22,
    posted_at: new Date(Date.now() - 12 * 3600_000).toISOString(),
    score: 58,
    reasons: [
      { label: "Skill match", detail: "JavaScript listed; scraping and extensions not in your skill list", points: 18 },
      { label: "Budget", detail: "400–600 USD clears your floor", points: 18 },
      { label: "Competition", detail: "22 bids in — a very crowded listing", points: 12 },
      { label: "Recency", detail: "Posted 12 hours ago", points: 10 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "VIEWED",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  job({
    id: "demo-9",
    platform: "freelancer",
    external_id: null,
    title: "AWS infrastructure migration for a media startup",
    description: "Migrate a monolith off a single EC2 box onto ECS + RDS with a proper CI/CD pipeline.",
    url: "",
    skills_listed: ["AWS", "ECS", "Terraform"],
    budget_type: "HOURLY",
    budget_min: 60,
    budget_max: 90,
    currency: "USD",
    bid_count: 5,
    posted_at: new Date(Date.now() - 90 * 60_000).toISOString(),
    score: 93,
    reasons: [
      { label: "Skill match", detail: "AWS and Docker history is a strong proxy for ECS/Terraform", points: 41 },
      { label: "Budget", detail: "60–90 USD/hr well above your rate floor", points: 26 },
      { label: "Competition", detail: "Only 5 bids in — you are early to this one", points: 19 },
      { label: "Recency", detail: "Posted 90 minutes ago", points: 7 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  job({
    id: "demo-10",
    platform: "freelancer",
    external_id: null,
    title: "Shopify theme tweak — small budget",
    description: "Adjust checkout page layout on an existing Shopify theme, no app development needed.",
    url: "",
    skills_listed: ["Shopify", "Liquid", "CSS"],
    budget_type: "FIXED",
    budget_min: 80,
    budget_max: 150,
    currency: "USD",
    bid_count: 27,
    posted_at: new Date(Date.now() - 40 * 60_000).toISOString(),
    score: 31,
    reasons: [
      { label: "Skill match", detail: "Shopify/Liquid not in your skill list", points: 8 },
      { label: "Budget", detail: "80–150 USD is below your 300 floor", points: 4 },
      { label: "Competition", detail: "27 bids in — a very crowded listing", points: 9 },
      { label: "Recency", detail: "Posted 40 minutes ago", points: 10 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  job({
    id: "demo-11",
    platform: "freelancer",
    external_id: null,
    title: "Data entry from PDF to Excel — 200 pages",
    description: "Transcribe 200 pages of scanned invoices into a structured Excel workbook.",
    url: "",
    skills_listed: ["Data entry"],
    budget_type: "FIXED",
    budget_min: 40,
    budget_max: 80,
    currency: "USD",
    bid_count: 35,
    posted_at: new Date(Date.now() - 15 * 60_000).toISOString(),
    score: 12,
    reasons: [
      { label: "Skill match", detail: "No overlap with your listed skills", points: 2 },
      { label: "Budget", detail: "40–80 USD is well below your 300 floor", points: 0 },
      { label: "Competition", detail: "35 bids in — an extremely crowded listing", points: 4 },
      { label: "Recency", detail: "Posted 15 minutes ago", points: 6 },
    ],
    rejected: true,
    rejection_reason: "Scored 12, below your minimum of 55",
    proposal_text: null,
    status: "DISMISSED",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
    client_country: "India",
    client_payment_verified: false,
    client_rating: 3.1,
    client_reviews_count: 4,
    client_total_spend: 210,
    client_hire_rate: 20,
  }),
  job({
    id: "demo-12",
    platform: "freelancer",
    external_id: null,
    title: "WordPress plugin: custom booking calendar",
    description: "Build a booking calendar plugin for a WordPress site with Stripe deposits.",
    url: "",
    skills_listed: ["WordPress", "PHP", "Stripe"],
    budget_type: "FIXED",
    budget_min: 600,
    budget_max: 1000,
    currency: "USD",
    bid_count: 13,
    posted_at: new Date(Date.now() - 6 * 3600_000).toISOString(),
    score: 25,
    reasons: [
      { label: "Skill match", detail: "WordPress/PHP not in your skill list", points: 6 },
      { label: "Budget", detail: "600–1000 USD clears your floor", points: 20 },
      { label: "Competition", detail: "13 bids in — moderately crowded", points: 14 },
      { label: "Recency", detail: "Posted 6 hours ago", points: 9 },
    ],
    rejected: true,
    rejection_reason: "Excluded keyword: 'wordpress'",
    proposal_text: null,
    status: "DISMISSED",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
  }),
  // These last two exist to show two states no earlier demo job covers: a job the scoring
  // engine auto-rejected that you haven't looked at yet (still NEW — auto-reject and "dismissed
  // by you" are independent flags, not the same event), and a job you dismissed yourself despite
  // a perfectly good score (rejected: false — the queue can't guess "not interested in this
  // domain" the way it can guess "below your floor").
  job({
    id: "demo-13",
    platform: "upwork",
    external_id: null,
    title: "Migrate legacy jQuery admin panel to Vue 2",
    description: "Port a ~15-year-old jQuery admin panel to Vue 2 (not Vue 3 — client's other tools pin to 2.x).",
    url: "",
    skills_listed: ["jQuery", "Vue"],
    budget_type: "FIXED",
    budget_min: 900,
    budget_max: 1400,
    currency: "USD",
    bid_count: 19,
    posted_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
    score: 31,
    reasons: [
      { label: "Skill match", detail: "Neither jQuery nor Vue is in your skill list", points: 8 },
      { label: "Budget", detail: "900–1400 USD clears your floor", points: 20 },
      { label: "Competition", detail: "19 bids in — heavily crowded", points: 10 },
      { label: "Recency", detail: "Posted 4 hours ago", points: 9 },
    ],
    rejected: true,
    rejection_reason: "Scored 31, below your minimum of 55",
    proposal_text: null,
    status: "NEW",
    first_seen_at: new Date().toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
    client_country: "Australia",
    client_payment_verified: true,
    client_rating: 4.2,
    client_reviews_count: 9,
    client_total_spend: 5_400,
    client_hire_rate: 55,
  }),
  job({
    id: "demo-14",
    platform: "freelancer",
    external_id: null,
    title: "Shopify theme customization for a supplement brand",
    description: "Customize an existing Shopify theme: subscription upsell widget, bundle pricing, and a rewards-points display.",
    url: "",
    skills_listed: ["Shopify", "Liquid", "JavaScript"],
    budget_type: "FIXED",
    budget_min: 700,
    budget_max: 1100,
    currency: "USD",
    bid_count: 10,
    posted_at: new Date(Date.now() - 8 * 3600_000).toISOString(),
    score: 68,
    reasons: [
      { label: "Skill match", detail: "JavaScript listed; Shopify/Liquid inferred from your portfolio", points: 28 },
      { label: "Budget", detail: "700–1100 USD clears your floor", points: 20 },
      { label: "Competition", detail: "10 bids in — moderately crowded", points: 12 },
      { label: "Recency", detail: "Posted 8 hours ago", points: 8 },
    ],
    rejected: false,
    rejection_reason: null,
    proposal_text: null,
    status: "DISMISSED",
    first_seen_at: new Date(Date.now() - 8 * 3600_000).toISOString(),
    bid_amount: null,
    bid_period_days: null,
    bid_submitted_at: null,
    external_bid_id: null,
    client_country: "United States",
    client_payment_verified: true,
    client_rating: 4.5,
    client_reviews_count: 33,
    client_total_spend: 19_200,
    client_hire_rate: 68,
  }),
];

export const DEMO_PROPOSALS: ProposalRow[] = [
  {
    id: "demo-p1",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: true,
    project_title: "Node.js webhook relay service",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 82,
    reasons: [],
    proposal_text: null,
    bid_amount: 610,
    estimated_days: 5,
    currency: "USD",
    status: "ACCEPTED",
    submitted_via: "API",
    external_bid_id: "demo-bid-1",
    submitted_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 1200,
    output_tokens: 340,
  },
  {
    id: "demo-p2",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: true,
    project_title: "FastAPI backend for booking platform",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 85,
    reasons: [],
    proposal_text: null,
    bid_amount: 3800,
    estimated_days: 10,
    currency: "USD",
    status: "SUBMITTED",
    submitted_via: "API",
    external_bid_id: null,
    submitted_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 1400,
    output_tokens: 410,
  },
  {
    id: "demo-p3",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: false,
    project_title: "Postgres query performance audit",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 79,
    reasons: [],
    proposal_text: null,
    bid_amount: 750,
    estimated_days: 3,
    currency: "USD",
    status: "REJECTED",
    submitted_via: "API",
    external_bid_id: null,
    submitted_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    model: "gemini-2.5",
    input_tokens: 1100,
    output_tokens: 300,
  },
  {
    id: "demo-p4",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: true,
    project_title: "Next.js dashboard for a logistics team",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 95,
    reasons: [],
    proposal_text: "Drafted, not yet sent.",
    bid_amount: 2100,
    estimated_days: 12,
    currency: "USD",
    status: "DRAFT",
    submitted_via: null,
    external_bid_id: null,
    submitted_at: null,
    drafted_at: new Date(Date.now() - 15 * 60_000).toISOString(),
    created_at: new Date(Date.now() - 15 * 60_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 980,
    output_tokens: 260,
  },
  {
    id: "demo-p5",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: true,
    project_title: "AWS infrastructure migration for a media startup",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 93,
    reasons: [],
    proposal_text: null,
    bid_amount: 4200,
    estimated_days: 20,
    currency: "USD",
    status: "SUBMITTED",
    submitted_via: "API",
    external_bid_id: null,
    submitted_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 1600,
    output_tokens: 450,
  },
  {
    id: "demo-p6",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: false,
    project_title: "Django REST API for a fintech onboarding flow",
    project_url: "",
    platform: "upwork",
    external_id: null,
    score: 89,
    reasons: [],
    proposal_text: null,
    bid_amount: 5200,
    estimated_days: 15,
    currency: "USD",
    status: "WITHDRAWN",
    submitted_via: "API",
    external_bid_id: null,
    submitted_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 1350,
    output_tokens: 300,
  },
  {
    id: "demo-p7",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: true,
    project_title: "Internal analytics dashboard for a SaaS team",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 90,
    reasons: [],
    proposal_text: null,
    bid_amount: 2900,
    estimated_days: 14,
    currency: "USD",
    status: "ACCEPTED",
    submitted_via: "API",
    external_bid_id: "demo-bid-2",
    submitted_at: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 1500,
    output_tokens: 380,
  },
  {
    id: "demo-p8",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: false,
    project_title: "Zapier-style automation builder MVP",
    project_url: "",
    platform: "freelancer",
    external_id: null,
    score: 71,
    reasons: [],
    proposal_text: null,
    bid_amount: 3400,
    estimated_days: 18,
    currency: "USD",
    status: "REJECTED",
    submitted_via: "API",
    external_bid_id: null,
    submitted_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    model: "gemini-2.5",
    input_tokens: 1250,
    output_tokens: 320,
  },
  {
    id: "demo-p9",
    recommendation_id: null,
    user_id: "demo",
    user_email: "demo@example.com",
    freelancer_name: "You",
    was_recommended: true,
    project_title: "E-commerce Redesign & Next.js Migration",
    project_url: "",
    platform: "upwork",
    external_id: null,
    score: 88,
    reasons: [],
    proposal_text: null,
    bid_amount: 8500,
    estimated_days: 30,
    currency: "USD",
    status: "ACCEPTED",
    submitted_via: "API",
    external_bid_id: "demo-bid-3",
    submitted_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    drafted_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 1700,
    output_tokens: 470,
  },
];

export const DEMO_STATS: ProposalStats = {
  total: 18,
  drafted: 6,
  submitted: 12,
  accepted: 4,
  rejected: 8,
  avg_score_submitted: 71.4,
  avg_score_accepted: 76.2,
  total_output_tokens: 4820,
  from_recommendation: 9,
  self_directed: 3,
  outcome_tracking_enabled: true,
  awaiting_outcome: 0,
};

/** Illustrative only — there's no endpoint for historical volume yet. Always shown labeled
 *  "Sample", never swapped in for a failed real call. */
export const DEMO_PIPELINE_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
export const DEMO_PIPELINE_SCORED = [22, 28, 26, 34, 31, 38, 41];
export const DEMO_PIPELINE_DRAFTED = [6, 8, 7, 11, 10, 13, 15];

/** There's no per-user earnings/spend endpoint yet (that data is admin-only and
 *  platform-wide) — static until a real one exists. `trend` is illustrative only, same as
 *  DEMO_PIPELINE_* above: a shape for the sparkline, never a claim about actual history. */
export const DEMO_HIGHLIGHTS = [
  {
    label: "Revenue (30 days)",
    value: "$14,860",
    deltaLabel: "12%",
    deltaUp: true,
    trend: [9200, 9800, 10400, 11100, 12300, 13200, 14860],
  },
];

/** The signed-in user's own editable matching profile — same shape `PUT /profile` expects
 *  back, so the edit form round-trips identically whether it loaded from the network or here. */
export const DEMO_PROFILE: Profile = {
  display_name: "Jane Doe",
  headline: "Full-Stack Developer — React, Next.js, Python",
  // Skill weights are on a 0–10 scale (a rating, not a raw scoring multiplier) — legible at a
  // glance ("React: 9/10") rather than an internal coefficient like "1.4".
  skills: [
    { name: "React", weight: 9 },
    { name: "Next.js", weight: 9 },
    { name: "TypeScript", weight: 8 },
    { name: "Python", weight: 7 },
    { name: "FastAPI", weight: 7 },
    { name: "PostgreSQL", weight: 6 },
    { name: "Docker", weight: 5 },
  ],
  suggested_skills: [
    {
      name: "AWS",
      weight: 7,
      reason: "You've mentioned deploying to ECS and Docker in 3 recent proposals, but AWS isn't in your skill list.",
      source: "proposals",
    },
    {
      name: "Terraform",
      weight: 6,
      reason: "Your portfolio includes an infrastructure-as-code case study, but the skill itself is missing.",
      source: "portfolio",
    },
    {
      name: "GraphQL",
      weight: 5,
      reason: "Your headline mentions \"API design\" broadly — GraphQL shows up in your experience section twice.",
      source: "experience",
    },
  ],
  keywords_include: [],
  keywords_exclude: ["wordpress", "shopify", "data entry"],
  fixed_project_min: 300,
  rate_min: 45,
  currency: "USD",
  country: "Canada",
  crowded_at_bids: 15,
  min_match_score: 55,
  weight_skills: 6,
  weight_budget: 5,
  weight_competition: 4,
  weight_recency: 3,
  proposal_notes: "Keep the opening line specific to the client's actual problem, never a generic greeting.",
  last_synced_at: new Date(Date.now() - 12 * 60_000).toISOString(),
  updated_at: new Date(Date.now() - 6 * 86_400_000).toISOString(),
  sync_is_stale: false,
};

const DEMO_WEIGHTED_SKILLS = DEMO_PROFILE.skills.map((s) => ({ name: s.name, weight: s.weight }));

export const DEMO_PROFILE_CARDS: ProfileCard[] = [
  {
    id: "demo-profile-1",
    display_name: DEMO_PROFILE.display_name,
    headline: DEMO_PROFILE.headline,
    profile_image: null,
    initials: "JD",
    skills: DEMO_PROFILE.skills.map((s) => s.name),
    skill_count: DEMO_PROFILE.skills.length,
    rate_min: 45,
    rate_max: 65,
    currency: "USD",
    availability: "Available",
    status: "ACTIVE",
    platforms: DEMO_CONNECTIONS.map((c) => c.platform),
    last_synced_at: DEMO_CONNECTIONS[0].last_synced_at,
    bids_synced_at: DEMO_CONNECTIONS[0].last_synced_at,
    recommendations: DEMO_JOBS.length,
    proposals: DEMO_CONNECTIONS.reduce((sum, c) => sum + c.proposals, 0),
    wins: DEMO_CONNECTIONS.reduce((sum, c) => sum + c.wins, 0),
  },
];

export const DEMO_PROFILE_DETAIL: ProfileDetail = {
  ...DEMO_PROFILE_CARDS[0],
  bio: DEMO_CONNECTIONS[0].summary ?? "",
  weighted_skills: DEMO_WEIGHTED_SKILLS,
  portfolio: [
    { title: "Multi-warehouse logistics dashboard", url: "" },
    { title: "Fintech onboarding API", url: "" },
  ],
  experience: [
    { title: "Senior Full-Stack Engineer", company: "Freelance", years: "2021–present" },
    { title: "Backend Engineer", company: "Logistics SaaS Co.", years: "2018–2021" },
  ],
  education: [{ school: "University of Toronto", degree: "B.Sc. Computer Science" }],
  keywords_include: DEMO_PROFILE.keywords_include,
  keywords_exclude: DEMO_PROFILE.keywords_exclude,
  fixed_project_min: DEMO_PROFILE.fixed_project_min,
  crowded_at_bids: DEMO_PROFILE.crowded_at_bids,
  min_match_score: DEMO_PROFILE.min_match_score,
  weight_skills: DEMO_PROFILE.weight_skills,
  weight_budget: DEMO_PROFILE.weight_budget,
  weight_competition: DEMO_PROFILE.weight_competition,
  weight_recency: DEMO_PROFILE.weight_recency,
  proposal_notes: DEMO_PROFILE.proposal_notes,
  connections: DEMO_CONNECTIONS,
  avg_score: 79.6,
  bids_synced_at: DEMO_CONNECTIONS[0].last_synced_at,
  created_at: new Date(Date.now() - 200 * 86_400_000).toISOString(),
  updated_at: DEMO_PROFILE.updated_at,
};

export const DEMO_AUTH_STATUS: AuthStatus = {
  connected: true,
  platform: "freelancer",
  scope: "bid",
  expires_at: new Date(Date.now() + 25 * 86_400_000).toISOString(),
  detail: null,
};

/** Illustrative only, same convention as DEMO_PIPELINE_* — there's no aggregate
 *  "why jobs get filtered out" endpoint. Built from the shape of rejection reasons the
 *  scoring engine actually produces (see DEMO_JOBS' rejected entries above), just counted
 *  up across a wider illustrative window than the handful of jobs shown elsewhere. */
export const DEMO_SCORE_DRAG_REASONS = [
  { label: "Budget below your floor", value: 9 },
  { label: "Excluded keyword present", value: 7 },
  { label: "Crowded listing (20+ bids)", value: 6 },
  { label: "Skill not in your list", value: 5 },
  { label: "Below your minimum match score", value: 4 },
];

/** Illustrative only — there's no profile-completeness endpoint yet. Intended real formula:
 *  weighted completeness of headline/bio/portfolio + ratio of confirmed vs. suggested skills.
 *  Shown in both the navbar profile menu and the dashboard stat row, so both read from this one
 *  constant rather than drifting apart. */
export const DEMO_PROFILE_SCORE = 80;

/** Illustrative only — there's no timing endpoint for draft latency yet. Intended real source:
 *  median time between a job first appearing and its proposal being auto-drafted. */
export const DEMO_TIME_TO_DRAFT = "~4 min";

/** Illustrative only, same trend-shape convention as DEMO_PIPELINE_* — a shape for the
 *  sparkline, never a claim about actual history. */
export const DEMO_WIN_RATE_TREND = [24, 27, 26, 29, 31, 30, 33];

/**
 * "Projects" (won jobs tracked through delivery) has no backend concept at all yet — no
 * endpoint, no DB table. Rather than invent unrelated demo rows, this is built directly from
 * the ACCEPTED entries in DEMO_PROPOSALS above, so the Projects page's numbers can never
 * disagree with the Proposals page's. `client`, `delivery_status`, and `deadline` are the only
 * genuinely illustrative additions, layered on top of real proposal data — a real ACCEPTED
 * proposal has none of these, and the Projects page shows "Not tracked yet" for it instead of
 * guessing.
 */
export interface DemoProject {
  id: string;
  title: string;
  client: string;
  platform: string;
  amount: number;
  currency: string;
  won_at: string;
  deadline: string;
  delivery_status: "Kickoff" | "In progress" | "At risk" | "On hold" | "Delivered";
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "demo-proj-1",
    title: "Node.js webhook relay service",
    client: "Nova Freight",
    platform: "freelancer",
    amount: 610,
    currency: "USD",
    won_at: DEMO_PROPOSALS[0].submitted_at!,
    deadline: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    delivery_status: "In progress",
  },
  {
    id: "demo-proj-2",
    title: "Internal analytics dashboard for a SaaS team",
    client: "Pixel Metrics",
    platform: "freelancer",
    amount: 2900,
    currency: "USD",
    won_at: DEMO_PROPOSALS[6].submitted_at!,
    deadline: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    delivery_status: "At risk",
  },
  {
    id: "demo-proj-3",
    title: "E-commerce Redesign & Next.js Migration",
    client: "Acme Corp",
    platform: "upwork",
    amount: 8500,
    currency: "USD",
    won_at: DEMO_PROPOSALS[8].submitted_at!,
    deadline: new Date(Date.now() + 21 * 86_400_000).toISOString(),
    delivery_status: "Kickoff",
  },
];

/**
 * Payout/transaction history for the Finance page's platform breakdown, upcoming-payouts list,
 * top-clients ranking, and recent-transactions table — no billing or payments integration exists
 * yet (see Settings → Billing's own "not on a paid plan" notice), so this is illustrative,
 * exactly like the projects above. `date` in the past reads as a completed/in-flight
 * transaction; `date` in the future is an upcoming payout — one dataset drives both sections
 * rather than two lists that could quietly disagree. Reuses Nova Freight/Pixel Metrics/Acme Corp
 * from DEMO_PROJECTS above so the same client isn't invented twice with different numbers.
 */
export interface FinanceTransaction {
  id: string;
  client: string;
  project: string;
  platform: "upwork" | "freelancer" | "direct";
  amount: number;
  currency: string;
  status: "Paid" | "Processing" | "Pending";
  date: string;
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export const DEMO_TRANSACTIONS: FinanceTransaction[] = [
  { id: "txn-1", client: "Nova Freight", project: "Node.js webhook relay service", platform: "freelancer", amount: 610, currency: "USD", status: "Paid", date: daysFromNow(-13) },
  { id: "txn-2", client: "Pixel Metrics", project: "Internal analytics dashboard", platform: "freelancer", amount: 2900, currency: "USD", status: "Paid", date: daysFromNow(-9) },
  { id: "txn-3", client: "Acme Corp", project: "E-commerce Redesign & Next.js Migration", platform: "upwork", amount: 8500, currency: "USD", status: "Processing", date: daysFromNow(-6) },
  { id: "txn-4", client: "Vertex Data", project: "Next.js Dashboard Integration", platform: "upwork", amount: 1450, currency: "USD", status: "Paid", date: daysFromNow(-8) },
  { id: "txn-5", client: "Global Logic", project: "Rust Backend Optimization", platform: "freelancer", amount: 2800, currency: "USD", status: "Processing", date: daysFromNow(-10) },
  { id: "txn-6", client: "Aether Systems", project: "Consulting Retainer", platform: "upwork", amount: 5000, currency: "USD", status: "Pending", date: daysFromNow(-11) },
  { id: "txn-7", client: "CloudScale Inc", project: "AWS Lambda Migration", platform: "upwork", amount: 940, currency: "USD", status: "Paid", date: daysFromNow(-15) },
  { id: "txn-8", client: "Bright Analytics", project: "Data pipeline audit", platform: "direct", amount: 1200, currency: "USD", status: "Paid", date: daysFromNow(-17) },
  { id: "txn-9", client: "Aether Systems", project: "Milestone: API auth layer", platform: "upwork", amount: 4250, currency: "USD", status: "Pending", date: daysFromNow(16) },
  { id: "txn-10", client: "Global Logic", project: "Hourly: DevSecOps", platform: "freelancer", amount: 1890, currency: "USD", status: "Pending", date: daysFromNow(21) },
  { id: "txn-11", client: "Direct Client", project: "Monthly maintenance", platform: "direct", amount: 2500, currency: "USD", status: "Pending", date: daysFromNow(30) },
];

/** Illustrative only, same DEMO_PIPELINE_* convention — a plausible monthly shape for the
 *  Earnings by Platform chart, not a claim about actual months or that these two platforms sum
 *  to the page's real "Total earned" figure (that still comes from real won proposals). */
export const DEMO_EARNINGS_BY_PLATFORM = [
  { month: "Jan", upwork: 2100, freelancer: 1400 },
  { month: "Feb", upwork: 2600, freelancer: 1600 },
  { month: "Mar", upwork: 2300, freelancer: 1500 },
  { month: "Apr", upwork: 2900, freelancer: 1800 },
  { month: "May", upwork: 3400, freelancer: 1900 },
  { month: "Jun", upwork: 3900, freelancer: 2100 },
];

/** Illustrative only — there's no prior-year figure to compare against. */
export const DEMO_EARNINGS_YOY_CHANGE = 18.3;

/** Illustrative only, same DEMO_PIPELINE_* convention — there's no historical-trend endpoint,
 *  so this is a plausible shape for the Analytics page's longer-range chart, not a claim about
 *  actual months. */
export const DEMO_ANALYTICS_MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
export const DEMO_WIN_RATE_BY_MONTH = [18, 22, 26, 24, 29, 33];

/**
 * The AI Profile Diagnosis / Strength Breakdown / Suggestions Workbench shown on a connected
 * profile's page — no scoring or suggestion endpoint exists yet, so the score, the AI summary
 * paragraph, the strength metrics, and every suggestion's issue/rewrite/reasoning text are
 * entirely illustrative, keyed by platform (not connection id) the same way the AI suggestions
 * this supersedes were.
 *
 * The eight categories are every field a real Upwork or Freelancer.com profile has that's worth
 * coaching (tagline/title, overview/about, skills, portfolio/projects, hourly rate, work
 * history, education, certifications — confirmed against Upwork's and Freelancer.com's own
 * profile-writing guides). Four of them (tagline, overview, skill, portfolio, rate) map to real
 * per-connection fields this app already stores (`Connection.tagline`, `.summary`,
 * `.account_skills`, `.portfolio_count`, `.hourly_rate`), so "current" is read live off the
 * connection for those. The other three (experience, education, certifications) have no
 * per-connection field yet — there's nothing real to critique, so their "current" state is
 * shown as "not tracked yet" rather than a guess.
 *
 * `impact` is an estimated profile-score boost, shown as "+X%". `addSkill`/`applyRate` are the
 * two suggestion fields that make Apply do something real: for "skill" it's the exact name added
 * to the connection's live skill list, for "rate" it's the number written into `hourly_rate` —
 * both optimistic, local-only mutations, same as the AI-suggestions flow this replaces.
 */
export type ProfileSuggestionCategory =
  | "tagline"
  | "overview"
  | "skill"
  | "portfolio"
  | "rate"
  | "experience"
  | "education"
  | "certifications";

export interface ProfileSuggestion {
  id: string;
  category: ProfileSuggestionCategory;
  title: string;
  detail: string;
  impact: number;
  issue: string;
  suggested: string;
  reason: string;
  addSkill?: string;
  applyRate?: number;
}

export interface ProfileDiagnosis {
  score: number;
  summary: string;
  metrics: { label: string; value: number }[];
  suggestions: ProfileSuggestion[];
}

export const DEMO_PROFILE_DIAGNOSIS: Record<string, ProfileDiagnosis> = {
  freelancer: {
    score: 72,
    summary:
      "Your skills and portfolio are solid, but your overview reads like a checklist rather than a pitch. Naming the kind of client problem you solve, not just the stack you use, would turn more profile views into invites.",
    metrics: [
      { label: "Portfolio completeness", value: 78 },
      { label: "Tagline & overview", value: 45 },
      { label: "Skill accuracy", value: 90 },
      { label: "Rate positioning", value: 65 },
      { label: "Reviews & history", value: 70 },
    ],
    suggestions: [
      {
        id: "fl-tagline-1",
        category: "tagline",
        title: "Rewrite your tagline",
        detail: "Your tagline lists tools, not the outcome you deliver.",
        impact: 8,
        issue:
          "Leads with a tech stack instead of a client outcome — clients skim taglines and move on if they don't see their problem reflected in the first few words.",
        suggested: "React & Node.js developer helping SaaS teams ship faster, more reliable releases",
        reason:
          "Naming the audience (SaaS teams) and the outcome (ship faster) gives a skimming client a reason to click through.",
      },
      {
        id: "fl-tagline-2",
        category: "tagline",
        title: "Name your specialization",
        detail: "\"Full-stack\" alone doesn't say which industries you fit.",
        impact: 4,
        issue: "A generalist tagline competes with every other full-stack developer instead of standing out to your best-fit clients.",
        suggested: "Full-stack developer specializing in logistics and fintech dashboards",
        reason: "Naming the industries you've actually shipped for lets those exact clients recognize themselves immediately.",
      },
      {
        id: "fl-overview-1",
        category: "overview",
        title: "Lead your overview with a result",
        detail: "Your overview opens with your background, not a client outcome.",
        impact: 15,
        issue:
          "The opening lines are about you, not the client's problem — most clients decide whether to keep reading within the first sentence.",
        suggested:
          "I help SaaS and fintech teams cut delivery time by replacing brittle scripts with tested, event-driven services — then hand off code your own engineers can maintain.",
        reason: "Opening with a concrete result gives a skimming client an immediate reason to keep reading.",
      },
      {
        id: "fl-overview-2",
        category: "overview",
        title: "Close with a call to action",
        detail: "Your overview doesn't tell a reader what to do next.",
        impact: 5,
        issue: "Ending on a description rather than an invitation leaves an interested client unsure whether to message you.",
        suggested: "Add a closing line: \"Message me with your stack and timeline — I'll reply with a scoped estimate within a day.\"",
        reason: "A direct, low-friction next step converts more profile views into the first message.",
      },
      {
        id: "fl-skill-1",
        category: "skill",
        title: "Add a missing high-demand skill",
        detail: "Your recent bids mention AWS, but it isn't on your skill list.",
        impact: 8,
        issue: "Skills you don't list can't be matched against client searches, even if you use them daily.",
        suggested: "AWS",
        reason: "Adding it makes this profile discoverable for the cloud-deployment jobs you're already bidding on.",
        addSkill: "AWS",
      },
      {
        id: "fl-skill-2",
        category: "skill",
        title: "Add Terraform",
        detail: "Your portfolio includes an infrastructure-as-code project not reflected in your skills.",
        impact: 5,
        issue: "A shipped project that used a skill you don't list is invisible to clients searching for that exact skill.",
        suggested: "Terraform",
        reason: "Matching your listed skills to your actual project history closes an easy, low-effort discoverability gap.",
        addSkill: "Terraform",
      },
      {
        id: "fl-portfolio-1",
        category: "portfolio",
        title: "Add your most recent project",
        detail: "Your portfolio's most recent entry is several months old.",
        impact: 6,
        issue: "A portfolio that stalls a few months back reads as inactivity, even on an account bidding regularly.",
        suggested: "Add your most recently shipped project, with a one-line result.",
        reason: "Recent, outcome-labeled samples are what clients scan for first when comparing similar bids.",
      },
      {
        id: "fl-portfolio-2",
        category: "portfolio",
        title: "Add outcome metrics to each project",
        detail: "Your project entries describe the build, not its impact.",
        impact: 4,
        issue: "A project titled only by tech stack gives a client nothing to compare against a competing bid's results.",
        suggested: "Add one metric per project — e.g. \"cut page load time from 4s to 900ms.\"",
        reason: "A concrete before/after number is what separates a portfolio item from a resume line.",
      },
      {
        id: "fl-rate-1",
        category: "rate",
        title: "Raise your hourly rate",
        detail: "Full-stack developers with a 4.9★ rating on Freelancer.com average $62/hr; you're listed lower.",
        impact: 4,
        issue: "A rate noticeably below the going rate for your rating tier can read as inexperience rather than as a deal.",
        suggested: "$62/hr",
        reason: "Matching the market rate for your rating tier stops underpricing your own track record.",
        applyRate: 62,
      },
      {
        id: "fl-rate-2",
        category: "rate",
        title: "Offer a fixed-price starter package",
        detail: "You only list an hourly rate, with no fixed-scope entry point.",
        impact: 3,
        issue: "Clients comparing bids for a well-defined small job often filter out hourly-only profiles that feel open-ended.",
        suggested: "Add a fixed-price \"starter\" tier for a clearly scoped small project.",
        reason: "A bounded price for a bounded job removes the client's biggest hesitation on a first-time hire.",
      },
      {
        id: "fl-experience-1",
        category: "experience",
        title: "Lead with your most relevant role",
        detail: "Your work history isn't ordered by relevance to the jobs you bid on.",
        impact: 5,
        issue: "A client skimming your history reads top-to-bottom — burying the most relevant role costs you their attention.",
        suggested: "Reorder your listed roles so the one closest to your target jobs appears first.",
        reason: "Relevance-first ordering means a skimming client sees the fit immediately, not three roles in.",
      },
      {
        id: "fl-experience-2",
        category: "experience",
        title: "Quantify the impact of each role",
        detail: "Your experience entries describe responsibilities, not results.",
        impact: 4,
        issue: "\"Built internal tools\" tells a client what you did, not whether it worked.",
        suggested: "Add one measurable outcome per role — team size, users served, or time saved.",
        reason: "A number anchors your experience the same way a portfolio metric anchors a project.",
      },
      {
        id: "fl-education-1",
        category: "education",
        title: "Connect your degree to your specialty",
        detail: "Your education entry doesn't mention how it applies to your current work.",
        impact: 3,
        issue: "A bare degree title gives a client no reason to weigh it in their hiring decision.",
        suggested: "Add a one-line note on how your coursework or research applies to your current specialty.",
        reason: "Tying formal education to your actual work makes it a credibility signal instead of a line item.",
      },
      {
        id: "fl-education-2",
        category: "education",
        title: "Add relevant recent coursework",
        detail: "You've completed training that isn't reflected on this profile.",
        impact: 2,
        issue: "Clients evaluating currency of skill can't credit training they don't know about.",
        suggested: "Add any recent courses or workshops relevant to your listed skills.",
        reason: "Recent coursework signals you're keeping pace with the stack you're bidding to work in.",
      },
      {
        id: "fl-certifications-1",
        category: "certifications",
        title: "Pursue a certification in your core stack",
        detail: "You have no certifications backing your top listed skills.",
        impact: 4,
        issue: "Two otherwise-similar bids often get decided by which profile has a verifying credential.",
        suggested: "An AWS or cloud-platform certification aligned with your most-bid-on skill.",
        reason: "A recognized certification is a fast, third-party-verified trust signal for clients who don't know your work yet.",
      },
      {
        id: "fl-certifications-2",
        category: "certifications",
        title: "Surface certifications in your overview",
        detail: "Any credentials you do have aren't mentioned in your overview text.",
        impact: 2,
        issue: "A credential listed only in a separate section is easy for a skimming client to miss entirely.",
        suggested: "Name your key certification in the first two lines of your overview, not just in a credentials list.",
        reason: "Repeating a trust signal where clients are actually reading raises the odds it registers.",
      },
    ],
  },
  upwork: {
    score: 50,
    summary:
      "Your technical skills are well-defined, but your overview lacks focus on client outcomes. The current tagline is too generic and doesn't stand out in search results. Improving your portfolio density and rewriting the overview to address common pain points in SaaS development will significantly boost your visibility.",
    metrics: [
      { label: "Portfolio completeness", value: 80 },
      { label: "Tagline & overview", value: 35 },
      { label: "Skill accuracy", value: 95 },
      { label: "Rate positioning", value: 58 },
      { label: "Testimonials & history", value: 60 },
    ],
    suggestions: [
      {
        id: "up-overview-1",
        category: "overview",
        title: "Rewrite Professional Overview",
        detail: "Your overview is missing targeted keywords.",
        impact: 15,
        issue:
          "Clients search Upwork by keyword before they ever open a profile — an overview without your niche terms won't surface for the searches you'd actually win.",
        suggested:
          "I build scalable SaaS infrastructure for B2B teams — from event-driven microservices to CI/CD pipelines that cut deploy time in half.",
        reason: "Naming the niche (B2B SaaS) and a concrete result (cut deploy time in half) targets the searches enterprise clients actually run.",
      },
      {
        id: "up-overview-2",
        category: "overview",
        title: "Address a specific client pain point",
        detail: "Your overview reads as a skill list, not a solution to a problem.",
        impact: 6,
        issue: "Clients searching Upwork are looking for someone who's solved their specific problem before, not a generic stack match.",
        suggested: "Name a recurring pain point you solve (e.g. \"slow, flaky CI pipelines\") before listing how you solve it.",
        reason: "Naming the problem first lets a client self-identify \"that's my issue\" before they've even read your solution.",
      },
      {
        id: "up-portfolio-1",
        category: "portfolio",
        title: "Add 3 Portfolio Items",
        detail: "Visual proof increases engagement by 40%.",
        impact: 8,
        issue: "A thin portfolio gives a client nothing concrete to compare against a competing bid.",
        suggested: "Add 3 recent projects, each with a screenshot and a one-line result.",
        reason: "Visual, outcome-labeled samples are the fastest way a client confirms you can do the job.",
      },
      {
        id: "up-portfolio-2",
        category: "portfolio",
        title: "Diversify your portfolio's project types",
        detail: "Your current portfolio items look similar to each other.",
        impact: 4,
        issue: "A portfolio that shows one kind of project only proves range for that one kind of job.",
        suggested: "Add at least one item outside your main project type — a different industry or a smaller scoped job.",
        reason: "Range in your portfolio widens the set of job posts where a client sees a clear match.",
      },
      {
        id: "up-tagline-1",
        category: "tagline",
        title: "Optimize Tagline",
        detail: "Make it more specific to your niche.",
        impact: 5,
        issue:
          "Too broad. \"Specialist\" doesn't convey specific value to potential clients searching for exact solutions.",
        suggested: "B2B SaaS Architect | React & Node.js | Scalable Cloud Infrastructure",
        reason:
          "Adding \"B2B SaaS\" targets high-value clients. \"Scalable Cloud Infrastructure\" hits key search terms used by enterprise technical recruiters.",
      },
      {
        id: "up-tagline-2",
        category: "tagline",
        title: "Lead your tagline with your strongest result",
        detail: "Your tagline doesn't reference a measurable outcome.",
        impact: 3,
        issue: "A tagline with no number in it reads the same as every other profile in your category.",
        suggested: "Open with your strongest verifiable number, e.g. \"Cut cloud spend 40% for 6 SaaS teams.\"",
        reason: "A specific number is the fastest way to stand out while a client is scrolling search results.",
      },
      {
        id: "up-skill-1",
        category: "skill",
        title: "Add a missing high-demand skill",
        detail: "Listed on your Freelancer.com profile but missing here.",
        impact: 6,
        issue: "A skill gap between your connected profiles means this one won't surface for searches the other already wins.",
        suggested: "TypeScript",
        reason: "Matching your skill list across platforms means neither profile misses a search the other would catch.",
        addSkill: "TypeScript",
      },
      {
        id: "up-skill-2",
        category: "skill",
        title: "Reorder skills by client demand",
        detail: "Upwork weights your first few listed skills more heavily in search.",
        impact: 3,
        issue: "Your highest-demand skill isn't first in the list, so it's not what search ranks you for most.",
        suggested: "Move your most client-requested skill to the top of the list.",
        reason: "Skill order affects which searches you rank highest in, independent of which skills you have.",
      },
      {
        id: "up-rate-1",
        category: "rate",
        title: "Raise your hourly rate",
        detail: "Your rate sits below the median for your rating tier on Upwork.",
        impact: 4,
        issue: "A below-market rate for a 4.8★ profile can read as a red flag rather than a bargain.",
        suggested: "$58/hr",
        reason: "Pricing in line with comparable, similarly-rated profiles keeps client expectations aligned with your track record.",
        applyRate: 58,
      },
      {
        id: "up-rate-2",
        category: "rate",
        title: "Set milestone pricing on fixed-price jobs",
        detail: "Your fixed-price bids quote one lump sum with no milestones.",
        impact: 2,
        issue: "A single large milestone is a bigger commitment ask than most clients want on a first project together.",
        suggested: "Split fixed-price bids into 2–3 milestones tied to concrete deliverables.",
        reason: "Smaller milestones lower the client's perceived risk on hiring you for the first time.",
      },
      {
        id: "up-experience-1",
        category: "experience",
        title: "Lead with your most relevant role",
        detail: "Your work history isn't ordered by relevance to the jobs you bid on.",
        impact: 5,
        issue: "A client skimming your history reads top-to-bottom — burying the most relevant role costs you their attention.",
        suggested: "Reorder your listed roles so the one closest to your target jobs appears first.",
        reason: "Relevance-first ordering means a skimming client sees the fit immediately, not three roles in.",
      },
      {
        id: "up-experience-2",
        category: "experience",
        title: "Quantify the impact of each role",
        detail: "Your experience entries describe responsibilities, not results.",
        impact: 4,
        issue: "\"Built internal tools\" tells a client what you did, not whether it worked.",
        suggested: "Add one measurable outcome per role — team size, users served, or time saved.",
        reason: "A number anchors your experience the same way a portfolio metric anchors a project.",
      },
      {
        id: "up-education-1",
        category: "education",
        title: "Connect your degree to your specialty",
        detail: "Your education entry doesn't mention how it applies to your current work.",
        impact: 3,
        issue: "A bare degree title gives a client no reason to weigh it in their hiring decision.",
        suggested: "Add a one-line note on how your coursework or research applies to your current specialty.",
        reason: "Tying formal education to your actual work makes it a credibility signal instead of a line item.",
      },
      {
        id: "up-education-2",
        category: "education",
        title: "Add relevant recent coursework",
        detail: "You've completed training that isn't reflected on this profile.",
        impact: 2,
        issue: "Clients evaluating currency of skill can't credit training they don't know about.",
        suggested: "Add any recent courses or workshops relevant to your listed skills.",
        reason: "Recent coursework signals you're keeping pace with the stack you're bidding to work in.",
      },
      {
        id: "up-certifications-1",
        category: "certifications",
        title: "Add a Rising Talent or skill certification",
        detail: "You have no certifications backing your top listed skills.",
        impact: 4,
        issue: "Two otherwise-similar bids often get decided by which profile has a verifying credential.",
        suggested: "A cloud-platform certification aligned with your most-bid-on skill, or Upwork's own skill assessment.",
        reason: "A recognized certification is a fast, third-party-verified trust signal for clients who don't know your work yet.",
      },
      {
        id: "up-certifications-2",
        category: "certifications",
        title: "Surface certifications in your overview",
        detail: "Any credentials you do have aren't mentioned in your overview text.",
        impact: 2,
        issue: "A credential listed only in a separate section is easy for a skimming client to miss entirely.",
        suggested: "Name your key certification in the first two lines of your overview, not just in a credentials list.",
        reason: "Repeating a trust signal where clients are actually reading raises the odds it registers.",
      },
    ],
  },
};

/** Generic fallback for any platform without its own written diagnosis above. */
export const DEMO_PROFILE_DIAGNOSIS_FALLBACK: ProfileDiagnosis = {
  score: 60,
  summary:
    "This profile has the basics in place. Tightening the tagline and overview around a specific client outcome, and keeping the skill list matched to your other connected profiles, is the fastest way to raise it further.",
  metrics: [
    { label: "Portfolio completeness", value: 60 },
    { label: "Tagline & overview", value: 55 },
    { label: "Skill accuracy", value: 70 },
    { label: "Rate positioning", value: 55 },
    { label: "Reviews & history", value: 55 },
  ],
  suggestions: [
    {
      id: "fallback-tagline",
      category: "tagline",
      title: "Sharpen your tagline",
      detail: "Name the outcome you deliver, not just your tools.",
      impact: 6,
      issue: "A tools-only tagline blends in with every other profile listing the same stack.",
      suggested: "Lead with the client outcome your work produces, then name your core stack.",
      reason: "Outcome-first taglines give a skimming client an immediate reason to open the full profile.",
    },
    {
      id: "fallback-overview",
      category: "overview",
      title: "Open your overview with a result",
      detail: "Lead with what a client gets, not your background.",
      impact: 6,
      issue: "Clients decide whether to keep reading within the first sentence — background-first overviews lose that moment.",
      suggested: "Open with the outcome you deliver, then support it with your background.",
      reason: "An outcome-first opener gives a skimming client an immediate reason to keep reading.",
    },
    {
      id: "fallback-portfolio",
      category: "portfolio",
      title: "Add a recent project",
      detail: "A portfolio that hasn't grown recently reads as inactive.",
      impact: 4,
      issue: "Clients weigh recency almost as heavily as raw portfolio count.",
      suggested: "Add your most recently completed project with a one-line result.",
      reason: "A recent, outcome-labeled sample is what a client scans for first.",
    },
  ],
};

/**
 * The profile page's public-facing polish — client testimonials, aggregate earnings, and
 * per-skill endorsement counts — has no backend concept yet at all: no testimonials table, no
 * earnings ledger, no endorsement counter. These are frontend-only placeholders so the page can
 * be built and reviewed ahead of that backend work; every number here is illustrative, not a
 * claim about real client feedback or income, and should be replaced wholesale once the
 * corresponding endpoints exist rather than blended with real data.
 */
export interface DemoTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export const DEMO_TESTIMONIALS: DemoTestimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "Dives into complex legacy code and finds the actual architecture problem, not just the symptom. Shipped our migration two weeks ahead of plan.",
    author: "Sarah Jenkins",
    role: "CTO, sample client",
  },
  {
    id: "testimonial-2",
    quote:
      "Clear communicator, realistic estimates, and the code review comments alone taught our junior devs more than a week of onboarding docs.",
    author: "Marcus Webb",
    role: "Engineering lead, sample client",
  },
];

/** Illustrative only — there's no earnings ledger yet. The dollar figure is a placeholder; the
 *  "platforms" count it's shown against should always come from the real profile instead. */
export const DEMO_AGGREGATED_EARNINGS = 240_000;

/** Illustrative only — there's no endorsement feature yet (no client can currently endorse a
 *  skill). Deterministic from the skill's real match-weight so higher-weighted skills still show
 *  higher counts, rather than random noise that would reshuffle on every reload. */
export function placeholderEndorsements(weight: number): number {
  return Math.max(1, Math.round(weight * 12));
}
