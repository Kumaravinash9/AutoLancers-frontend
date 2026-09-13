import { ComponentType, SVGProps } from "react";
import {
  BarChart3,
  CircleHelp,
  CircleUserRound,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Link2,
  ListChecks,
  LucideIcon,
  Settings,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

import { NavIconKey } from "@/content/site";

type IconProps = SVGProps<SVGSVGElement>;

/** One stroke weight and size for every sidebar nav icon, so a real icon set (Lucide) reads
 *  as consistently as the hand-drawn set it replaced. */
function NavGlyph(Glyph: LucideIcon) {
  return function Wrapped(props: IconProps) {
    return <Glyph size={18} strokeWidth={1.75} {...props} />;
  };
}

/** Shared stroke defaults so every sidebar icon reads as one set. */
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// Sidebar nav icons — real Lucide glyphs (not hand-drawn) so "Account", "Connected Profiles"
// and "Settings" in particular read unambiguously: a person for your own account, a link icon
// for connected marketplace profiles, sliders for the tunable matching profile, a gear for
// settings — each distinct from the others.
const DashboardIcon = NavGlyph(LayoutDashboard);
const QueueIcon = NavGlyph(ListChecks);
const ProposalsIcon = NavGlyph(FileText);
const AccountIcon = NavGlyph(CircleUserRound);
const AccountsIcon = NavGlyph(Link2);
const MatchingIcon = NavGlyph(SlidersHorizontal);
const SettingsIcon = NavGlyph(Settings);

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 8a5 5 0 0 1 10 0c0 3.3 1.2 4.6 1.7 5H3.3c.5-.4 1.7-1.7 1.7-5z" />
      <path d="M8 15.5a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.8 7.8a2.2 2.2 0 1 1 3.1 2c-.7.5-1 .9-1 1.7" />
      <path d="M10 14.5h.01" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7.5 10 12.5 15 7.5" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="15" height="14" rx="1.5" />
      <path d="M2.5 8h15M7 2v3M13 2v3" />
    </Icon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2.5 17.5 7 10 11.5 2.5 7z" />
      <path d="M2.5 11 10 15.5 17.5 11" />
    </Icon>
  );
}

const ProjectsIcon = NavGlyph(FolderKanban);
const AnalyticsIcon = NavGlyph(BarChart3);
const FinanceIcon = NavGlyph(Wallet);
const HelpNavIcon = NavGlyph(CircleHelp);

export const NAV_ICONS: Record<NavIconKey, ComponentType<IconProps>> = {
  dashboard: DashboardIcon,
  queue: QueueIcon,
  proposals: ProposalsIcon,
  account: AccountIcon,
  accounts: AccountsIcon,
  matching: MatchingIcon,
  settings: SettingsIcon,
  projects: ProjectsIcon,
  analytics: AnalyticsIcon,
  finance: FinanceIcon,
  help: HelpNavIcon,
};
