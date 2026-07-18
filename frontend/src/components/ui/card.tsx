import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "border border-line bg-paper/50 p-5",
        className
      )}
      role="region"
      aria-label={title}
    >
      {title && (
        <h3 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h3>
      )}
      {children}
    </div>
  );
}
