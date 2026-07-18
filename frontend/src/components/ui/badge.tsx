import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-sans text-2xs font-medium",
        {
          default: "bg-line/50 text-ink",
          success: "bg-confirmed/10 text-confirmed",
          warning: "bg-review/10 text-review",
          error: "bg-expired/10 text-expired",
          info: "bg-brass/10 text-brass",
        }[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
