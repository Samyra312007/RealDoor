import { useState, useEffect } from "react";
import { ScrollText, Trash2, AlertCircle } from "lucide-react";

export function Header({ onDelete, hasFields }: { onDelete: () => void; hasFields: boolean }) {
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDelete = async () => {
    if (!hasFields) {
      setNotification("Nothing is available to delete");
      return;
    }
    await onDelete();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
      {notification && (
        <div
          role="alert"
          className="flex items-center justify-center gap-2 border-b border-review/20 bg-review/10 px-4 py-2 font-sans text-xs text-review fade-slide-in"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{notification}</span>
        </div>
      )}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brass shadow-sm">
            <ScrollText className="h-4 w-4 text-paper" aria-hidden="true" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-ink">
            RealDoor
          </span>
          <span className="hidden self-center font-sans text-2xs text-ink/30 sm:inline">
            Application-Readiness Copilot
          </span>
        </div>
        <nav aria-label="Session actions">
          <button
            onClick={handleDelete}
            className="group inline-flex items-center gap-1.5 rounded-sm border border-expired/20 px-2.5 py-1.5 font-sans text-xs text-expired/70 transition-all hover:border-expired/40 hover:bg-expired/5 hover:text-expired focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expired"
            aria-label="Delete my data and end session"
          >
            <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-105" aria-hidden="true" />
            <span className="hidden sm:inline">Delete my data</span>
          </button>
        </nav>
      </div>
    </header>
  );
}