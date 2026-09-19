import type { ProposalRow } from "@/lib/api";

/** Shared money/date/pagination formatting — used by any page that lists proposals or the
 *  won-projects view derived from them, so the same bid amount never prints two different ways. */

export function money(amount: number, currency: string | null): string {
  const symbol = !currency || currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

/** "Today, 9:41 AM" / "Yesterday, 2:20 PM" / "Oct 12, 2023" — legible at a glance without
 *  making someone do the "how long ago was Tuesday" math a relative "3d ago" forces on them. */
export function formatDateSent(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function jobLinkLabel(row: Pick<ProposalRow, "platform" | "external_id">): string {
  const platform = row.platform.toUpperCase();
  return row.external_id ? `${platform} #${row.external_id}` : platform;
}

/** Compact ellipsis pagination — full run for small sets, `1 2 … 41 42` once there are enough
 *  pages that listing every one would just be noise. */
export function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

/** "in 3 days" / "in 2 weeks" / "Overdue by 2 days" — deadline framing for the Projects page's
 *  demo-only delivery tracking. `soon` marks anything close enough (or already overdue) to earn
 *  the at-risk red styling. */
export function relativeDeadline(iso: string): { text: string; soon: boolean } {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `Overdue by ${-days} day${-days === 1 ? "" : "s"}`, soon: true };
  if (days === 0) return { text: "Due today", soon: true };
  if (days < 14) return { text: `in ${days} day${days === 1 ? "" : "s"}`, soon: days <= 3 };
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return { text: `in ${weeks} week${weeks === 1 ? "" : "s"}`, soon: false };
  }
  const months = Math.round(days / 30);
  return { text: `in ${months} month${months === 1 ? "" : "s"}`, soon: false };
}
