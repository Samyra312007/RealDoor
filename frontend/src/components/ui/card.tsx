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
        "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm",
        className
      )}
      role="region"
      aria-label={title}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h3>
      )}
      {children}
    </div>
  );
}
