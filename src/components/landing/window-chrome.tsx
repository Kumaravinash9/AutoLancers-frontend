/** The recognizable macOS window affordance — three colored traffic-light dots — used across
 *  every coded UI fragment on the page (LiveQueue, BidConfirm, ProfileTuner) so they read as one
 *  family of real app windows, not illustrations. */
export function WindowDots() {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ec6a5e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#f4bf4f]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#61c454]" />
    </div>
  );
}

export function WindowChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-border bg-sunken px-4 py-2.5">
      <WindowDots />
      <span className="truncate font-mono text-xs text-muted">{label}</span>
    </div>
  );
}
