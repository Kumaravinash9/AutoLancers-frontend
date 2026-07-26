import { CREDIBILITY } from "@/content/landing";

/** Stands in for the logo wall/user-count these pages usually run — we don't have real numbers
 *  yet, so this is the honest version: what actually happens when you connect, not who else did. */
export function Credibility() {
  return (
    <section className="border-b border-border px-6 py-6">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-xs text-muted">
        {CREDIBILITY.map((line) => (
          <li key={line} className="flex items-center gap-2">
            <span className="text-accent">✓</span>
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
