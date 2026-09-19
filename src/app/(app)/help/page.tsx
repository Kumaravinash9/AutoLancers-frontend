"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  FileText,
  Layers,
  LayoutDashboard,
  Link2,
  Mail,
  Search,
  Sparkles,
  Target,
  UserRound,
  Wallet,
} from "lucide-react";

import { DashCard, StaggerIn } from "@/components/app-ui";
import { Empty, Page } from "@/components/ui";
import { SUPPORT_EMAIL } from "@/content/site";

type Category = {
  id: string;
  label: string;
  icon: typeof Sparkles;
  questions: { q: string; a: string }[];
};

/**
 * Every answer here describes something this app actually does — the demo-data fallback, the
 * read-only OAuth scope, the four-part scoring formula, the account/profile split — not
 * generic SaaS help-center filler. If a feature described here ever changes, this is the file
 * to update; there's no CMS or backend content source behind it.
 */
const CATEGORIES: Category[] = [
  {
    id: "getting-started",
    label: "Getting started",
    icon: Sparkles,
    questions: [
      {
        q: "How do I connect a marketplace account?",
        a: "Go to Connected Profiles → Discovery → Connect a New Platform. Freelancer.com connects directly through its own sign-in page. Upwork and Fiverr are listed too, so you can see why they're not connectable yet rather than wondering if you missed a step.",
      },
      {
        q: "Why can't I connect Upwork?",
        a: "That's a policy restriction, not a missing feature: Upwork's automation rules prohibit tools that watch the job feed, even with approved API access. Freelancer.com has no such restriction, which is why it's the one fully-connectable platform today.",
      },
      {
        q: "What can Autolancer actually do with my connected account?",
        a: "Only what a read-only OAuth scope allows — reading your job feed and account basics. The bid scope is deliberately never requested, so nothing here can submit a proposal on your behalf, no matter what it drafts.",
      },
    ],
  },
  {
    id: "matching",
    label: "Job matching & scoring",
    icon: Target,
    questions: [
      {
        q: "How is a job's match score calculated?",
        a: "Four weighted parts, tuned on your matching profile: skill match, budget fit against your floor, competition (how many bids are already in), and recency. Each weight is relative, not a percentage — only the ratio between them matters, which is why raising one and watching the others' share shrink is the fastest way to see the effect.",
      },
      {
        q: "Why did a job score low or get filtered out?",
        a: "Usually one of: it fell below your minimum match score, it's crowded enough that the competition weight cut its score in half, its budget is under your floor, or it contains a keyword you've excluded.",
      },
      {
        q: "How often does the job queue refresh?",
        a: "The backend poller fetches automatically roughly every 25 seconds. If you don't want to wait, Fetch now on the Job Queue triggers a cycle immediately.",
      },
    ],
  },
  {
    id: "proposals",
    label: "Proposals & bids",
    icon: FileText,
    questions: [
      {
        q: "Does Autolancer submit bids automatically?",
        a: "No. A proposal is drafted for you, but sending it is always a separate, explicit action you take yourself — nothing here submits to a marketplace on its own.",
      },
      {
        q: "What's the difference between a score and an outcome?",
        a: "A score is a prediction made before you bid; an outcome (selected or not selected) is what actually happened. The Proposals page pairs them deliberately — if your accepted work averages a lower score than your rejected work, that's a sign the weights need retuning, not a bug.",
      },
      {
        q: "Why does a sent proposal show no outcome?",
        a: "Nothing currently syncs award status back from Freelancer.com automatically. A result appears once you tell Autolancer what happened; until then, \"no recorded outcome\" means exactly that — not a loss.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & connected profiles",
    icon: UserRound,
    questions: [
      {
        q: "What's the difference between my Account and a Connected Profile?",
        a: "Your Account is your one Autolancer identity — the rollup of everything across every marketplace. A Connected Profile is a single marketplace connection, like a specific Upwork or Freelancer.com account. Profiles feed into your one Account; they're not the same thing.",
      },
      {
        q: "What does \"Select\" do on a connected profile?",
        a: "It scopes the rest of the app — Proposals, Analytics, the queue — to that one profile, so numbers reflect just that platform instead of everything combined. Selecting it again (or choosing \"Show all\") returns to the combined view.",
      },
      {
        q: "Why am I seeing sample data instead of my own?",
        a: "That means this app couldn't reach its backend just now. Every page falls back to clearly-illustrative sample data in that case, rather than showing an empty screen or a broken one — it never silently mixes sample and real data together.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: Wallet,
    questions: [
      {
        q: "What does Autolancer cost?",
        a: "It's free during early access — no card required to start, and nothing to cancel if you stop using it.",
      },
      {
        q: "Where do I manage billing?",
        a: "Settings → Billing. There's nothing to configure yet since there's no paid plan running, but that's where it'll live once one exists.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium">{q}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-muted">{a}</p>}
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/profile", label: "Connected Profiles", icon: Link2, detail: "Connect or manage a marketplace account" },
  { href: "/queue", label: "Job Queue", icon: LayoutDashboard, detail: "See what's matched and fetch now" },
  { href: "/proposals", label: "Proposals", icon: FileText, detail: "Review drafts and sent bids" },
  { href: "/account", label: "Account", icon: Layers, detail: "View your account score and diagnosis" },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [query]);

  return (
    <Page className="space-y-8">
      <StaggerIn index={0}>
        <DashCard tint className="p-8 text-center sm:p-10">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Help center</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
            Answers to how matching, proposals, and connected profiles actually work — not generic
            SaaS boilerplate.
          </p>
          <div className="relative mx-auto mt-6 max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an answer…"
              className="w-full rounded-full border border-border bg-surface py-2.5 pr-4 pl-10 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </div>
        </DashCard>
      </StaggerIn>

      <StaggerIn index={1}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-border/60 transition-colors hover:bg-accent-soft"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent group-hover:bg-surface">
                <link.icon size={16} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{link.label}</p>
                <p className="mt-0.5 text-xs text-muted">{link.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </StaggerIn>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <StaggerIn index={2}>
              <DashCard className="p-8">
                <Empty>
                  Nothing matches &ldquo;{query}&rdquo;. Try a different word, or{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
                    email support
                  </a>{" "}
                  directly.
                </Empty>
              </DashCard>
            </StaggerIn>
          ) : (
            filtered.map((cat, i) => (
              <StaggerIn key={cat.id} index={i + 2}>
                <DashCard className="p-6">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <cat.icon size={16} aria-hidden="true" />
                    </span>
                    {cat.label}
                  </h2>
                  <div className="mt-2">
                    {cat.questions.map((item) => (
                      <AccordionItem key={item.q} q={item.q} a={item.a} />
                    ))}
                  </div>
                </DashCard>
              </StaggerIn>
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-6">
          <StaggerIn index={2}>
            <DashCard className="space-y-4 p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Mail size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight">Still stuck?</h2>
                <p className="mt-1 text-sm text-muted">
                  Email us directly and we&apos;ll get back to you.
                </p>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {SUPPORT_EMAIL}
              </a>
            </DashCard>
          </StaggerIn>
        </div>
      </div>
    </Page>
  );
}
