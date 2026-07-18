import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Banner } from "@/components/layout/banner";
import { StageNav } from "@/components/layout/stage-nav";
import { ProfileStage } from "@/components/profile/profile-stage";
import { UnderstandStage } from "@/components/understand/understand-stage";
import { PrepareStage } from "@/components/prepare/prepare-stage";
import { DiscoverStage } from "@/components/discover/discover-stage";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useExtraction } from "@/hooks/useExtraction";
import { useRules } from "@/hooks/useRules";
import { useCalculator } from "@/hooks/useCalculator";

export function App() {
  const { token, createSession, deleteSession, loading: sessionLoading } = useSession();
  const {
    fields,
    loading: extractLoading,
    error: extractError,
    uploads,
    uploadDocument,
    confirmField,
    skipField,
    allConfirmed,
    needsReviewRef,
  } = useExtraction(token);
  const { answer, askQuestion } = useRules();
  const {
    result: calcResult,
    loading: calcLoading,
    explaining,
    explanation,
    calculate,
    calculateFromProfile,
    explainCalculation,
  } = useCalculator();
  const [stage, setStage] = useState(1);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 text-3xl font-bold text-brand-700">RealDoor</h1>
          <p className="mb-8 text-neutral-600">Application-Readiness Copilot</p>
          <Banner />
          <div className="mt-8">
            <Button size="lg" onClick={createSession} disabled={sessionLoading} aria-busy={sessionLoading}>
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

  const canAdvance = stage !== 1 || allConfirmed || fields.length === 0;

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
            uploads={uploads}
            onUpload={uploadDocument}
            onConfirm={confirmField}
            onSkip={skipField}
            needsReviewRef={needsReviewRef}
          />
        )}
        {stage === 2 && (
          <UnderstandStage
            sessionToken={token}
            onAskQuestion={(q) => askQuestion(q, token)}
            onCalculate={calculate}
            onCalculateFromProfile={calculateFromProfile}
            onExplainCalculation={explainCalculation}
            answer={answer}
            calcResult={calcResult}
            calcLoading={calcLoading}
            explaining={explaining}
            explanation={explanation}
          />
        )}
        {stage === 3 && <PrepareStage token={token} />}
        {stage === 4 && <DiscoverStage sessionToken={token} />}

        <nav aria-label="Stage navigation" className="mt-8 flex justify-between border-t border-neutral-200 pt-6">
          <Button
            variant="outline"
            onClick={() => setStage(Math.max(1, stage - 1))}
            disabled={stage === 1}
          >
            Previous
          </Button>
          {stage === 1 && fields.length > 0 && !allConfirmed && (
            <p className="flex items-center gap-1 self-center text-xs text-amber-600" role="status">
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Confirm or skip all fields to proceed</span>
            </p>
          )}
          <Button
            variant="primary"
            onClick={() => setStage(Math.min(4, stage + 1))}
            disabled={stage === 4 || !canAdvance}
          >
            Next
          </Button>
        </nav>
      </main>
    </div>
  );
}
