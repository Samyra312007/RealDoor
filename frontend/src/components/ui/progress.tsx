export function Progress({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="h-2 w-full overflow-hidden bg-line/50">
        <div
          className="h-full bg-brass transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="sr-only">{label || `${pct}% complete`}</span>
    </div>
  );
}
