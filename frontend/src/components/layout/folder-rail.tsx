import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LedgerStamp } from "@/components/ui/ledger-stamp";

export type StageStatus = "not-started" | "in-progress" | "confirmed";

const stages = [
  { id: 1, path: "/profile", label: "Profile", number: "01", description: "Upload & confirm" },
  { id: 2, path: "/understand", label: "Understand", number: "02", description: "Rules & math" },
  { id: 3, path: "/prepare", label: "Prepare", number: "03", description: "Packet & export" },
  { id: 4, path: "/discover", label: "Discover", number: "04", description: "Properties" },
];

export function FolderRail({
  stageStatuses,
  canAccessStage,
  enabledStages = 3,
}: {
  stageStatuses: Record<number, StageStatus>;
  canAccessStage: (stageId: number) => boolean;
  enabledStages?: number;
}) {
  const visible = enabledStages >= 4 ? stages : stages.slice(0, 3);

  return (
    <nav aria-label="Application stages" className="hidden md:block">
      <ol className="flex flex-col gap-1" role="list">
        {visible.map((s) => {
          const status = stageStatuses[s.id];
          const accessible = canAccessStage(s.id);
          const disabled = !accessible;

          return (
            <li key={s.id}>
              <NavLink
                to={disabled ? "#" : s.path}
                onClick={(e) => {
                  if (disabled) e.preventDefault();
                }}
                aria-disabled={disabled}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 border-l-2 px-4 py-3 font-sans text-sm transition-colors",
                    isActive && !disabled
                      ? "border-l-brass bg-brass/5 text-ink"
                      : "border-l-transparent text-ink/50 hover:border-l-line hover:text-ink/70",
                    disabled && "pointer-events-none opacity-40"
                  )
                }
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center font-mono text-xs font-medium",
                    status === "confirmed"
                      ? "text-confirmed"
                      : status === "in-progress"
                      ? "text-brass"
                      : "text-ink/30"
                  )}
                  aria-hidden="true"
                >
                  {s.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-medium">{s.label}</p>
                  <p className="text-2xs text-ink/40">{s.description}</p>
                </div>
                {status === "confirmed" && (
                  <LedgerStamp variant="confirmed" className="scale-[0.7] origin-right">
                    Confirmed
                  </LedgerStamp>
                )}
                {status === "in-progress" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brass" aria-label="In progress" />
                )}
              </NavLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MobileStageIndicator({
  currentPath,
  stageStatuses,
}: {
  currentPath: string;
  stageStatuses: Record<number, StageStatus>;
}) {
  const stageMap: Record<string, { id: number; label: string }> = {
    "/profile": { id: 1, label: "Profile" },
    "/understand": { id: 2, label: "Understand" },
    "/prepare": { id: 3, label: "Prepare" },
    "/discover": { id: 4, label: "Discover" },
  };
  const current = stageMap[currentPath] || stageMap["/profile"];

  return (
    <div className="flex items-center gap-2 border-b border-line px-4 py-2 md:hidden" aria-label="Current stage">
      <span className="font-mono text-xs text-brass" aria-hidden="true">
        {String(current.id).padStart(2, "0")}
      </span>
      <span className="font-display text-sm font-medium text-ink">{current.label}</span>
      <span className="ml-auto flex gap-1">
          {[1, 2, 3].map((s) => {
            const status = stageStatuses[s];
            const label =
              s === 2 ? "Understand" :
              s === 3 ? "Prepare" :
              "Profile";
            return (
              <span
                key={s}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "confirmed"
                    ? "bg-confirmed"
                    : status === "in-progress"
                    ? "bg-brass"
                    : "bg-line"
                )}
                aria-label={`Stage ${label}: ${status === "confirmed" ? "confirmed" : status === "in-progress" ? "in progress" : "not started"}`}
              />
            );
          })}
      </span>
    </div>
  );
}
