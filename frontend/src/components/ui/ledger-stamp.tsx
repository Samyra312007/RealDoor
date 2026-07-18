import { cn } from "@/lib/utils";

const stampVariants = {
  confirmed: "border-confirmed text-confirmed",
  review: "border-review text-review",
  expired: "border-expired text-expired",
  skipped: "border-dashed border-line text-ink/40",
  brass: "border-brass text-brass",
  default: "border-brass text-brass",
} as const;

export function LedgerStamp({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof stampVariants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
        "rotate-stamp select-none",
        "shadow-[1px_1px_0_rgba(0,0,0,0.06)]",
        stampVariants[variant],
        className
      )}
      aria-label={`${variant === "confirmed" ? "Confirmed" : variant === "skipped" ? "Skipped" : variant === "review" ? "Review" : variant === "expired" ? "Expired" : variant === "brass" ? "Stamped" : "Stamped"}: ${typeof children === "string" ? children : ""}`}
    >
      {children}
    </span>
  );
}
