const DESIGN_PRINCIPLE =
  "The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides.";

export function Banner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-brand-700 px-4 py-2 text-center text-sm font-medium text-white"
    >
      <span className="sr-only">Design principle: </span>
      {DESIGN_PRINCIPLE}
    </div>
  );
}
