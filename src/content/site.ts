/** Sitewide strings shared by the marketing header and the in-app nav. */

export const BRAND = { prefix: "Auto", suffix: "Lancers" };

export const AUTH_LINKS = {
  signIn: "/login",
  signUp: "/login?mode=signup",
  demo: "/demo",
};

export const APP_NAV = [
  { href: "/queue", label: "Queue" },
  { href: "/proposals", label: "Proposals" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

/** Marketing nav is anchors on the one page it has, not a set of separate marketing routes
 *  that don't exist — real in-page links only. */
export const MARKETING_NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#platforms", label: "Marketplaces" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export const MARKETING_ROUTES = new Set(["/", "/login", "/demo"]);
