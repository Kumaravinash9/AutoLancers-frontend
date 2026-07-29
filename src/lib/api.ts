/**
 * Backend client.
 *
 * The frontend and backend are separate repos and separate processes — everything crosses over
 * HTTP, with no shared types package. These interfaces mirror `app/api/schemas.py`; if you change
 * a field there, change it here too.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

// Mirrors RecommendationStatus in the backend. A job is DISMISSED when you pass on it;
// APPLIED once a proposal has gone out.
export type JobStatus = "NEW" | "VIEWED" | "APPLIED" | "DISMISSED";

export interface BidAvailability {
  available: boolean;
  reason: string;
}

export interface BidResult {
  bid_id: string;
  amount: number;
  period_days: number;
}

export interface ScoreReason {
  label: string;
  detail: string;
  points: number;
}

export interface Job {
  /** The recommendation's UUID. */
  id: string;
  platform: string;
  external_id: string | null;
  title: string;
  description: string;
  url: string;
  skills_listed: string[];
  budget_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  bid_count: number | null;
  posted_at: string | null;
  score: number;
  reasons: ScoreReason[];
  rejected: boolean;
  rejection_reason: string | null;
  proposal_text: string | null;
  status: JobStatus;
  first_seen_at: string;
  bid_amount: number | null;
  bid_period_days: number | null;
  bid_submitted_at: string | null;
  external_bid_id: string | null;
}

export interface Skill {
  name: string;
  weight: number;
}

export interface Profile {
  display_name: string;
  headline: string;
  skills: Skill[];
  keywords_include: string[];
  keywords_exclude: string[];
  fixed_project_min: number;
  rate_min: number;
  currency: string;
  /** Bid count at which competition scores half marks. Not a cap — nothing is hidden for being busy. */
  crowded_at_bids: number;
  min_match_score: number;
  weight_skills: number;
  weight_budget: number;
  weight_competition: number;
  weight_recency: number;
  proposal_notes: string;
  /** When the board was last recalculated against the marketplace. */
  last_synced_at: string | null;
  /** When the profile itself was last edited. */
  updated_at: string;
  /** Computed server-side — a wrong client clock shouldn't decide this. */
  sync_is_stale: boolean;
}

export interface AuthStatus {
  connected: boolean;
  platform: string;
  scope: string | null;
  expires_at: string | null;
  detail: string | null;
}

export interface CycleReport {
  fetched: number;
  new: number;
  updated: number;
  rejected: number;
  drafted: number;
  draft_failures: number;
  error: string | null;
}

/** Thrown for any non-2xx response, carrying the backend's `detail` where there is one. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      // The session lives in an httpOnly cookie, so every request has to carry credentials.
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    // A dead backend is the single most likely failure in local dev — say so plainly rather than
    // surfacing "Failed to fetch".
    throw new ApiError(`Cannot reach the backend at ${API_URL}. Is it running?`, 0);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // non-JSON error body; statusText is the best we have
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  listJobs(params: { status?: JobStatus; rejected?: boolean; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.rejected !== undefined) query.set("rejected", String(params.rejected));
    query.set("limit", String(params.limit ?? 100));
    return request<Job[]>(`/jobs?${query}`);
  },

  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  patchJob: (id: string, patch: { proposal_text?: string; status?: JobStatus }) =>
    request<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  /** Generate a proposal now instead of waiting for the poller to reach this job. */
  draft: (id: string) => request<Job>(`/jobs/${id}/draft`, { method: "POST" }),

  rescore: () => request<{ rescored: number }>("/jobs/rescore", { method: "POST" }),

  getProfile: () => request<Profile>("/profile"),

  saveProfile: (profile: Profile) =>
    request<Profile>("/profile", { method: "PUT", body: JSON.stringify(profile) }),

  authStatus: () => request<AuthStatus>("/auth/status"),

  bidAvailability: () => request<BidAvailability>("/jobs/bid-availability"),

  /** Places a real bid. `confirm` is required by the backend — there is no implicit submit. */
  placeBid: (id: string, body: { amount: number; period_days: number; confirm: true }) =>
    request<BidResult>(`/jobs/${id}/bid`, { method: "POST", body: JSON.stringify(body) }),

  runPipeline: () => request<CycleReport>("/pipeline/run", { method: "POST" }),
};

export function formatBudget(job: Job): string {
  if (job.budget_min === null && job.budget_max === null) return "Budget not stated";
  const currency = job.currency ?? "";
  const kind = job.budget_type ? ` ${job.budget_type}` : "";
  if (job.budget_min !== null && job.budget_max !== null) {
    return `${job.budget_min.toFixed(0)}–${job.budget_max.toFixed(0)} ${currency}${kind}`.trim();
  }
  const stated = job.budget_max ?? job.budget_min;
  return `${stated!.toFixed(0)} ${currency}${kind}`.trim();
}

export function formatAge(iso: string | null): string {
  if (!iso) return "unknown";
  const minutes = (Date.now() - new Date(iso).getTime()) / 60000;
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))}m ago`;
  if (minutes < 60 * 48) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}


// --- accounts and admin ---

export interface Account {
  id: number;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminOverview {
  total_users: number;
  active_users: number;
  connected_accounts: number;
  total_jobs: number;
  matched_jobs: number;
  drafted_jobs: number;
  bids_placed: number;
  proposal_input_tokens: number;
  proposal_output_tokens: number;
  cycles_24h: number;
  failed_cycles_24h: number;
  draft_failures_24h: number;
  last_cycle_at: string | null;
}

export interface CycleRun {
  id: number;
  started_at: string;
  duration_ms: number;
  fetched: number;
  created: number;
  updated: number;
  rejected: number;
  drafted: number;
  draft_failures: number;
  authenticated: boolean;
  trigger: string;
  error: string | null;
}

export interface AdminUser extends Account {
  job_count: number;
  connected: boolean;
  connection_scope: string | null;
}

export const accounts = {
  register: (email: string, password: string) =>
    request<Account>("/accounts/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<Account>("/accounts/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>("/accounts/logout", { method: "POST" }),
  me: () => request<Account>("/accounts/me"),
};

export const admin = {
  overview: () => request<AdminOverview>("/admin/overview"),
  cycles: (limit = 25) => request<CycleRun[]>(`/admin/cycles?limit=${limit}`),
  users: () => request<AdminUser[]>("/admin/users"),
  setRole: (id: number, role: "user" | "admin") =>
    request<Account>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};


export interface ProposalRow {
  id: string;
  recommendation_id: string | null;
  user_id: string;
  user_email: string;
  freelancer_name: string;
  /** True when we recommended it; false when the bid was placed independently. */
  was_recommended: boolean;
  project_title: string;
  project_url: string;
  platform: string;
  external_id: string | null;
  score: number | null;
  reasons: ScoreReason[];
  proposal_text: string | null;
  bid_amount: number | null;
  estimated_days: number | null;
  currency: string | null;
  status: "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submitted_via: string | null;
  external_bid_id: string | null;
  submitted_at: string | null;
  drafted_at: string | null;
  created_at: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export interface ProposalStats {
  total: number;
  drafted: number;
  submitted: number;
  accepted: number;
  rejected: number;
  avg_score_submitted: number | null;
  avg_score_accepted: number | null;
  total_output_tokens: number;
  from_recommendation: number;
  self_directed: number;
  /** False until award status is synced back from the marketplace. */
  outcome_tracking_enabled: boolean;
  awaiting_outcome: number;
}

export interface SyncReport {
  fetched: number;
  linked: number;
  imported: number;
  projects_added: number;
  outcomes_updated: number;
  error: string | null;
}

export const proposals = {
  sync: () => request<SyncReport>("/proposals/sync", { method: "POST" }),
  list: (connectionId?: string | null) =>
    request<ProposalRow[]>(`/proposals${connectionId ? `?connection_id=${connectionId}` : ""}`),
  stats: (connectionId?: string | null) =>
    request<ProposalStats>(
      `/proposals/stats${connectionId ? `?connection_id=${connectionId}` : ""}`,
    ),
};


export interface Connection {
  id: string;
  platform: string;
  proposals: number;
  wins: number;
  platform_username: string | null;
  scope: string | null;
  rating: number | null;
  total_reviews: number | null;
  avatar_url: string | null;
  status: string;
  /** True for the account the app is scoped to; all false means every account. */
  is_selected: boolean;
  /** The account's own public profile on the marketplace, refreshed on every sync. */
  display_name: string | null;
  tagline: string | null;
  summary: string | null;
  account_skills: string[];
  hourly_rate: number | null;
  currency: string | null;
  country: string | null;
  portfolio_count: number | null;
  member_since: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
}

export interface ProfileCard {
  id: string;
  display_name: string;
  headline: string;
  profile_image: string | null;
  initials: string;
  skills: string[];
  skill_count: number;
  rate_min: number;
  rate_max: number;
  currency: string;
  availability: string;
  status: string;
  platforms: string[];
  /** True for the profile (account) the app is scoped to; at most one per user. */
  is_selected: boolean;
  last_synced_at: string | null;
  bids_synced_at: string | null;
  recommendations: number;
  proposals: number;
  wins: number;
}

/** One portfolio item mirrored from the marketplace (see connector `normalize_portfolio_entry`). */
export interface PortfolioItem {
  title: string;
  description: string;
  content_type: string | null;
  featured: boolean;
  image: string | null;
}

export interface ProfileDetail extends ProfileCard {
  bio: string;
  weighted_skills: { name: string; weight: number }[];
  portfolio: PortfolioItem[];
  experience: Record<string, unknown>[];
  education: Record<string, unknown>[];
  keywords_include: string[];
  keywords_exclude: string[];
  fixed_project_min: number;
  /** Bid count at which competition scores half marks. Not a cap — nothing is hidden for being busy. */
  crowded_at_bids: number;
  min_match_score: number;
  weight_skills: number;
  weight_budget: number;
  weight_competition: number;
  weight_recency: number;
  proposal_notes: string;
  connections: Connection[];
  avg_score: number | null;
  bids_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FullSync {
  board_fetched: number;
  board_new: number;
  board_changed: number;
  board_drafted: number;
  board_error: string | null;
  bids_fetched: number;
  bids_imported: number;
  outcomes_updated: number;
  bids_error: string | null;
  last_synced_at: string | null;
  bids_synced_at: string | null;
}

export const connections = {
  list: () => request<Connection[]>("/connections"),
  remove: (id: string) => request<void>(`/connections/${id}`, { method: "DELETE" }),
  /** Scope the app to one account, or to all of them with null. Returns the updated list. */
  select: (id: string | null) =>
    request<Connection[]>("/connections/selected", {
      method: "PUT",
      body: JSON.stringify({ connection_id: id }),
    }),
};

export const profiles = {
  sync: (id: string) => request<FullSync>(`/profiles/${id}/sync`, { method: "POST" }),
  list: () => request<ProfileCard[]>("/profiles"),
  get: (id: string) => request<ProfileDetail>(`/profiles/${id}`),
};


export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  note: string | null;
  marketplace: string | null;
  handled: boolean;
  created_at: string;
}

export const demo = {
  /** Public — no account needed, which is the whole point of the marketing page. */
  request: (body: { name: string; email: string; note?: string; marketplace?: string }) =>
    request<DemoRequest>("/demo-requests", { method: "POST", body: JSON.stringify(body) }),
  list: () => request<DemoRequest[]>("/admin/demo-requests"),
};


/**
 * Whether the browser extension can still read a marketplace.
 *
 * Mirrors `capture_statuses`. The failure this reports has no other symptom: signed out of Upwork, the
 * extension reads a login page that loads perfectly, finds no jobs, and files an honest-looking zero —
 * so the board keeps serving yesterday's scores as though they were current, and nothing errors.
 */
export interface CaptureStatus {
  platform: string;
  /** OK once reading works again; the row is cleared rather than appended to. */
  status: "OK" | "SIGNED_OUT" | "BLOCKED";
  detail: string | null;
  page_key: string | null;
  /** When it first went wrong, so "for three days" is sayable. Null while OK. */
  since: string | null;
  last_checked_at: string;
  /** Null means the extension has never read this marketplace — not that anything expired. */
  last_ok_at: string | null;
}

export const captures = {
  /**
   * Problems first, then most recently checked. An empty list means the extension has never
   * reported in, which is not the same as "everything is fine" — nobody has looked.
   */
  status: () => request<CaptureStatus[]>("/ingest/status"),
};
