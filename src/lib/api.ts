/**
 * Backend client.
 *
 * The frontend and backend are separate repos and separate processes — everything crosses over
 * HTTP, with no shared types package. These interfaces mirror `app/api/schemas.py`; if you change
 * a field there, change it here too.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

export type JobStatus = "new" | "drafted" | "approved" | "dismissed" | "submitted";

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
  id: number;
  platform: string;
  external_id: string;
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
  hourly_min: number;
  currency: string;
  max_existing_bids: number;
  min_match_score: number;
  weight_skills: number;
  weight_budget: number;
  weight_competition: number;
  weight_recency: number;
  proposal_notes: string;
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

  getJob: (id: number) => request<Job>(`/jobs/${id}`),

  patchJob: (id: number, patch: { proposal_text?: string; status?: JobStatus }) =>
    request<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  rescore: () => request<{ rescored: number }>("/jobs/rescore", { method: "POST" }),

  getProfile: () => request<Profile>("/profile"),

  saveProfile: (profile: Profile) =>
    request<Profile>("/profile", { method: "PUT", body: JSON.stringify(profile) }),

  authStatus: () => request<AuthStatus>("/auth/status"),

  bidAvailability: () => request<BidAvailability>("/jobs/bid-availability"),

  /** Places a real bid. `confirm` is required by the backend — there is no implicit submit. */
  placeBid: (id: number, body: { amount: number; period_days: number; confirm: true }) =>
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
