export function Header({ onDelete }: { onDelete: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-brand-700" aria-hidden="true">
            RD
          </span>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">RealDoor</h1>
            <p className="text-xs text-neutral-500">
              Application-Readiness Copilot
            </p>
          </div>
        </div>
        <nav aria-label="Session actions">
          <button
            onClick={onDelete}
            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            aria-label="Delete session and all data"
          >
            Delete my data
          </button>
        </nav>
      </div>
    </header>
  );
}
