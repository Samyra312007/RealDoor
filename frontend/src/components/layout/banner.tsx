const DESIGN_PRINCIPLE =
  "The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides.";

export function Banner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-line bg-ink/5 px-4 py-2 text-center font-sans text-xs font-medium text-ink/60"
    >
      <span className="sr-only">Design principle: </span>
      {DESIGN_PRINCIPLE}
    </div>
  );
}
