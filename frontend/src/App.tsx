import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Banner } from "@/components/layout/banner";
import { StageNav } from "@/components/layout/stage-nav";
import { ProfileStage } from "@/components/profile/profile-stage";
import { UnderstandStage } from "@/components/understand/understand-stage";
import { PrepareStage } from "@/components/prepare/prepare-stage";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useExtraction } from "@/hooks/useExtraction";
import { useRules } from "@/hooks/useRules";
import { useCalculator } from "@/hooks/useCalculator";

export function App() {
  const { token, createSession, deleteSession, loading: sessionLoading } = useSession();
  const { fields, loading: extractLoading, error: extractError, uploadDocument, confirmField } =
    useExtraction(token);
  const { answer, askQuestion } = useRules();
  const { result: calcResult, loading: calcLoading, calculate } = useCalculator();
  const [stage, setStage] = useState(1);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 text-3xl font-bold text-brand-700">RealDoor</h1>
          <p className="mb-8 text-neutral-600">Application-Readiness Copilot</p>
          <Banner />
          <div className="mt-8">
            <Button size="lg" onClick={createSession} disabled={sessionLoading}>
              {sessionLoading ? "Starting..." : "Start Your Journey"}
            </Button>
          </div>
          <p className="mt-6 text-xs text-neutral-400">
            Your data is encrypted in memory and auto-deleted after your session ends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-brand-700"
      >
        Skip to main content
      </a>

      <Header onDelete={deleteSession} />
      <Banner />
      <StageNav currentStage={stage} onStageClick={setStage} />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">
        {stage === 1 && (
          <ProfileStage
            fields={fields}
            loading={extractLoading}
            error={extractError}
            onUpload={uploadDocument}
            onConfirm={confirmField}
          />
        )}
        {stage === 2 && (
          <UnderstandStage
            onAskQuestion={askQuestion}
            onCalculate={calculate}
            answer={answer}
            calcResult={calcResult}
            calcLoading={calcLoading}
          />
        )}
        {stage === 3 && <PrepareStage token={token} />}

        <nav aria-label="Stage navigation" className="mt-8 flex justify-between border-t border-neutral-200 pt-6">
          <Button
            variant="outline"
            onClick={() => setStage(Math.max(1, stage - 1))}
            disabled={stage === 1}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={() => setStage(Math.min(3, stage + 1))}
            disabled={stage === 3}
          >
            Next
          </Button>
        </nav>
      </main>
    </div>
  );
}
