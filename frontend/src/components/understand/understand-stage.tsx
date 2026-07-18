import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export function UnderstandStage({
  sessionToken,
  onAskQuestion,
  onCalculate,
  onCalculateFromProfile,
  onExplainCalculation,
  answer,
  calcResult,
  calcLoading,
  explaining,
  explanation,
}: {
  sessionToken: string;
  onAskQuestion: (q: string) => Promise<void>;
  onCalculate: (income: number, hhSize: number, county: string) => Promise<void>;
  onCalculateFromProfile: (token: string) => Promise<void>;
  onExplainCalculation: () => Promise<void>;
  answer: any;
  calcResult: any;
  calcLoading: boolean;
  explaining: boolean;
  explanation: string | null;
}) {
  const [question, setQuestion] = useState("");
  const [income, setIncome] = useState("");
  const [hhSize, setHhSize] = useState("");
  const [county, setCounty] = useState("12086");

  return (
    <section aria-labelledby="understand-heading">
      <h2 id="understand-heading" className="mb-6 text-2xl font-bold text-neutral-900">
        Stage 2: Understand
      </h2>
      <p className="mb-6 text-neutral-600">
        Ask questions about rental rules and calculate your income against program thresholds.
        All answers cite their sources. No eligibility decisions are made here.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Ask a Rule Question">
          <div className="space-y-4">
            <Input
              label='Your question (e.g., "What is the income limit for a family of 3?")'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
              onKeyDown={async (e) => {
                if (e.key === "Enter" && question.trim()) {
                  await onAskQuestion(question.trim());
                }
              }}
            />
            <Button
              onClick={() => onAskQuestion(question.trim())}
              disabled={!question.trim()}
            >
              Ask
            </Button>

            {answer && (
              <div role="region" aria-label="Answer" aria-live="polite" className="mt-4 space-y-3 rounded-lg border bg-neutral-50 p-4">
                <p className="text-sm text-neutral-800">{answer.answer}</p>
                {answer.abstained && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    <Badge variant="warning">Abstained — no decision made</Badge>
                  </span>
                )}
                {answer.citations?.length > 0 && (
                  <details>
                    <summary className="cursor-pointer rounded text-xs text-neutral-500 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
                      Sources ({answer.citations.length})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {answer.citations.map((c: any, i: number) => (
                        <li key={i} className="text-xs text-neutral-600">
                          <span className="font-medium">Source:</span> {c.source_url}
                          <br />
                          <span className="font-medium">Effective:</span> {c.effective_date}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card title="Income Calculator">
          <div className="space-y-4">
            <Button
              onClick={() => onCalculateFromProfile(sessionToken)}
              disabled={calcLoading}
              className="w-full"
              variant="primary"
              aria-busy={calcLoading}
            >
              {calcLoading ? "Calculating from profile..." : "Calculate from Confirmed Profile"}
            </Button>

            <div className="relative my-4" role="separator" aria-orientation="horizontal">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-neutral-400">or manual entry</span>
              </div>
            </div>

            <Input
              label="Annual income ($)"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="45000"
            />
            <Input
              label="Household size"
              type="number"
              value={hhSize}
              onChange={(e) => setHhSize(e.target.value)}
              placeholder="3"
            />
            <Input
              label="County or CBSA code"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="12086"
            />
            <Button
              onClick={() => onCalculate(Number(income), Number(hhSize), county)}
              disabled={!income || !hhSize || calcLoading}
              aria-busy={calcLoading}
            >
              {calcLoading ? "Calculating..." : "Calculate"}
            </Button>

            {calcResult && (
              <div role="region" aria-label="Calculation result" aria-live="polite" className="mt-4 space-y-3 rounded-lg border bg-neutral-50 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Calculation Trace</p>
                  {calcResult.formula_steps?.slice(0, 6).map((step: string, i: number) => (
                    <p key={i} className="text-xs text-neutral-700">
                      {step}
                    </p>
                  ))}
                  {calcResult.formula_steps?.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onExplainCalculation}
                      disabled={explaining}
                      aria-busy={explaining}
                    >
                      {explaining ? "Loading explanation..." : "Explain this calculation"}
                    </Button>
                  )}
                </div>
                {explanation && (
                  <div className="mt-2 rounded bg-neutral-100 p-3">
                    <pre className="whitespace-pre-wrap text-xs text-neutral-700">{explanation}</pre>
                  </div>
                )}
                {calcResult.income_limit_50 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-neutral-500">30% Limit</p>
                      <p className="text-sm font-medium">${calcResult.income_limit_30?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">50% Limit</p>
                      <p className="text-sm font-medium">${calcResult.income_limit_50?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">60% Limit</p>
                      <p className="text-sm font-medium">${calcResult.income_limit_60?.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-neutral-500">
                  Source: HUD MTSP 2026, effective {calcResult.effective_date}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
