import { useSessionContext } from "@/lib/session-context";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/layout/banner";

export function StartPage() {
  const { createSession, sessionLoading } = useSessionContext();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line px-4 py-3">
        <span className="font-display text-xl font-semibold tracking-tight text-ink">
          RealDoor
        </span>
      </header>
      <Banner />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 border border-line p-6">
          <p className="mb-2 font-mono text-xs text-brass">01 — START</p>
          <h1 className="mb-3 font-display text-2xl font-semibold text-ink">
            Application-Readiness Copilot
          </h1>
          <p className="mb-6 font-sans text-sm leading-relaxed text-ink/60">
            This tool extracts information from your documents, explains income
            limits, runs the math, and prepares your paperwork packet. It never
            decides eligibility — that&rsquo;s for a qualified human to determine.
          </p>
          <div className="mb-6 space-y-2 text-left">
            <div className="border border-line bg-line/20 p-3">
              <p className="font-mono text-xs text-brass">STAGE 1 &mdash; Profile</p>
              <p className="font-sans text-xs text-ink/60">Upload documents, review extracted fields, confirm your information.</p>
            </div>
            <div className="border border-line bg-line/20 p-3">
              <p className="font-mono text-xs text-brass">STAGE 2 &mdash; Understand</p>
              <p className="font-sans text-xs text-ink/60">Ask about rules, view the formula trace, understand the math.</p>
            </div>
            <div className="border border-line bg-line/20 p-3">
              <p className="font-mono text-xs text-brass">STAGE 3 &mdash; Prepare</p>
              <p className="font-sans text-xs text-ink/60">Review your checklist, assemble your packet, export to PDF.</p>
            </div>
          </div>
          <Button size="lg" onClick={createSession} disabled={sessionLoading} aria-busy={sessionLoading}>
            {sessionLoading ? "Starting..." : "Start your session"}
          </Button>
        </div>
        <p className="mt-4 font-mono text-2xs text-ink/30">
          Your data is encrypted in memory and auto-deleted after your session ends.
        </p>
      </main>
    </div>
  );
}
