import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function UnderstandStage({
  onAskQuestion,
  onCalculate,
  answer,
  calcResult,
  calcLoading,
}: {
  onAskQuestion: (q: string) => Promise<void>;
  onCalculate: (income: number, hhSize: number, county: string) => Promise<void>;
  answer: any;
  calcResult: any;
  calcLoading: boolean;
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
              <div role="region" aria-label="Answer" className="mt-4 space-y-3 rounded-lg border bg-neutral-50 p-4">
                <p className="text-sm text-neutral-800">{answer.answer}</p>
                {answer.abstained && (
                  <Badge variant="warning">Abstained — no decision made</Badge>
                )}
                {answer.citations?.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-xs text-neutral-500">
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
            >
              {calcLoading ? "Calculating..." : "Calculate"}
            </Button>

            {calcResult && (
              <div role="region" aria-label="Calculation result" className="mt-4 space-y-3 rounded-lg border bg-neutral-50 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Calculation Trace</p>
                  {calcResult.formula_steps?.map((step: string, i: number) => (
                    <p key={i} className="text-xs text-neutral-700">
                      {step}
                    </p>
                  ))}
                </div>
                {calcResult.income_limit_50 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-2xs text-neutral-500">30% Limit</p>
                      <p className="text-sm font-medium">${calcResult.income_limit_30?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-neutral-500">50% Limit</p>
                      <p className="text-sm font-medium">${calcResult.income_limit_50?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-neutral-500">60% Limit</p>
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
