/** Sitewide strings shared by the marketing header and the in-app nav. */

export const BRAND = { prefix: "Auto", suffix: "Lancers" };

export const SUPPORT_EMAIL = "support@autolancers.app";

export const AUTH_LINKS = {
  signIn: "/login",
  signUp: "/login?mode=signup",
  demo: "/demo",
};

export type NavIconKey =
  | "dashboard"
  | "queue"
  | "proposals"
  | "account"
  | "accounts"
  | "matching"
  | "settings"
  | "projects"
  | "analytics"
  | "finance"
  | "help";
export type NavGroupKey = "workspace" | "account";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  group: NavGroupKey;
}

export const APP_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "workspace" },
  { href: "/queue", label: "Job Queue", icon: "queue", group: "workspace" },
  { href: "/proposals", label: "Proposals", icon: "proposals", group: "workspace" },
  { href: "/projects", label: "Projects", icon: "projects", group: "workspace" },
  { href: "/analytics", label: "Analytics", icon: "analytics", group: "workspace" },
  { href: "/finance", label: "Finance", icon: "finance", group: "workspace" },
  { href: "/account", label: "Account", icon: "account", group: "account" },
  { href: "/profile", label: "Connected Profiles", icon: "accounts", group: "account" },
  { href: "/settings", label: "Settings", icon: "settings", group: "account" },
  { href: "/help", label: "Help & Support", icon: "help", group: "account" },
];

/** Longest-matching href wins, so a more specific route (e.g. /profile/[id]) doesn't also
 *  light up a shorter one it happens to start with (e.g. /profile). */
export function matchNavItem(pathname: string): NavItem | undefined {
  return APP_NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Marketing nav is anchors on the one page it has, not a set of separate marketing routes
 *  that don't exist — real in-page links only. */
export const MARKETING_NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#platforms", label: "Marketplaces" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export const MARKETING_ROUTES = new Set(["/", "/login", "/demo"]);
