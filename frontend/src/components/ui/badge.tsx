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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          default: "bg-neutral-100 text-neutral-800",
          success: "bg-green-100 text-green-800",
          warning: "bg-amber-100 text-amber-800",
          error: "bg-red-100 text-red-800",
          info: "bg-blue-100 text-blue-800",
        }[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
