const stages = [
  { id: 1, label: "Profile", description: "Upload & confirm your documents" },
  { id: 2, label: "Understand", description: "Learn about rules & calculations" },
  { id: 3, label: "Prepare", description: "Review & export your packet" },
];

export function StageNav({
  currentStage,
  onStageClick,
}: {
  currentStage: number;
  onStageClick: (stage: number) => void;
}) {
  return (
    <nav aria-label="Application stages" className="border-b border-neutral-200">
      <ol className="mx-auto flex max-w-5xl items-center px-4" role="list">
        {stages.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button
              onClick={() => onStageClick(s.id)}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500
                ${
                  currentStage === s.id
                    ? "border-b-2 border-brand-600 bg-brand-50/50"
                    : "border-b-2 border-transparent hover:bg-neutral-50"
                }`}
              aria-current={currentStage === s.id ? "step" : undefined}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium
                  ${
                    currentStage >= s.id
                      ? "bg-brand-600 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                aria-hidden="true"
              >
                {s.id}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{s.label}</p>
                <p className="text-xs text-neutral-500">{s.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
