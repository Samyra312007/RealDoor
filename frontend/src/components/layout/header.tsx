export function Header({ onDelete }: { onDelete: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink" aria-hidden="true">
            RealDoor
          </span>
          <span className="hidden self-end pb-[3px] font-sans text-2xs text-ink/40 sm:inline">
            Application-Readiness Copilot
          </span>
        </div>
        <nav aria-label="Session actions">
          <button
            onClick={onDelete}
            className="rounded-sm border border-expired/30 px-3 py-1 font-sans text-xs text-expired hover:bg-expired/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expired"
            aria-label="Delete my data and end session"
          >
            Delete my data
          </button>
        </nav>
      </div>
    </header>
  );
}
