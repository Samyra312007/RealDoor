import { useState } from "react";
import { useSessionContext } from "@/lib/session-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { AlertCircle } from "lucide-react";

export function UnderstandPage() {
  const {
    token, answer, askQuestion, calcResult, calcLoading,
    explaining, explanation, calculate, calculateFromProfile, explainCalculation,
    fields, allConfirmed,
  } = useSessionContext();

  const [question, setQuestion] = useState("");
  const [income, setIncome] = useState("");
  const [hhSize, setHhSize] = useState("");
  const [county, setCounty] = useState("12086");
  const [hasCalculated, setHasCalculated] = useState(false);

  const confirmedIncome = fields.find((f) => f.field_name === "annual_income" && !f.requires_confirmation)?.value;
  const confirmedHhSize = fields.find((f) => f.field_name === "household_size" && !f.requires_confirmation)?.value;

  return (
    <section aria-labelledby="understand-heading">
      <h2 id="understand-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 02 — Understand
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Ask questions about rental rules and calculate your income against program thresholds.
        All answers cite their sources. No eligibility decisions are made here.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Ask about the rules" className="self-start">
          <div className="space-y-4">
            <Input
              label='Your question (e.g., "What is the income limit for a family of 3?")'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
              onKeyDown={async (e) => {
                if (e.key === "Enter" && question.trim()) {
                  await askQuestion(question.trim(), token || undefined);
                }
              }}
            />
            <Button
              onClick={() => askQuestion(question.trim(), token || undefined)}
              disabled={!question.trim()}
            >
              Ask
            </Button>

            {answer && (
              <div role="region" aria-label="Answer" aria-live="polite" className="mt-4 space-y-3 border border-line bg-line/20 p-4">
                {answer.abstained ? (
                  <>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-review" aria-hidden="true" />
                      <LedgerStamp variant="review">Abstained</LedgerStamp>
                    </div>
                    <p className="font-sans text-sm text-ink/60">
                      I don&rsquo;t have enough information to answer that. Try rephrasing your question.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-sm text-ink">{answer.answer}</p>
                    {answer.citations?.length > 0 && (
                      <details>
                        <summary className="cursor-pointer font-mono text-2xs text-ink/40 hover:text-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded">
                          Sources ({answer.citations.length})
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {answer.citations.map((c: any, i: number) => (
                            <li key={i} className="font-mono text-2xs text-ink/60">
                              {c.snippet && <p className="italic">&ldquo;{c.snippet}&rdquo;</p>}
                              {c.effective_date && <p>Effective: {c.effective_date}</p>}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card title="Income calculator" className="self-start">
          <div className="space-y-4">
            {allConfirmed && confirmedIncome && confirmedHhSize && (
              <Button
                onClick={() => {
                  calculateFromProfile(token || "");
                  setHasCalculated(true);
                }}
                disabled={calcLoading}
                className="w-full"
                variant="primary"
                aria-busy={calcLoading}
              >
                {calcLoading ? "Calculating from profile..." : "Calculate from confirmed profile"}
              </Button>
            )}

            <div className="relative my-4" role="separator" aria-orientation="horizontal">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-paper px-2 font-sans text-2xs text-ink/40">or manual entry</span>
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
              onClick={() => {
                calculate(Number(income), Number(hhSize), county);
                setHasCalculated(true);
              }}
              disabled={!income || !hhSize || calcLoading}
              aria-busy={calcLoading}
            >
              {calcLoading ? "Calculating..." : "Calculate"}
            </Button>

            {calcResult && hasCalculated && (
              <div role="region" aria-label="Calculation result" aria-live="polite" className="mt-4 space-y-3 border border-line bg-line/20 p-4">
                <LedgerStamp variant="brass" className="mb-2">Calculation trace</LedgerStamp>

                <p className="font-mono text-sm leading-relaxed text-ink">
                  {calcResult.formula_trace || calcResult.formula_steps?.slice(0, 6).join(" ")}
                </p>

                {calcResult.ami_percentage !== undefined && (
                  <div className="border-t border-line pt-3">
                    <p className="font-sans text-xs text-ink/50">Your income as a percentage of AMI</p>
                    <p className="font-mono text-2xl font-semibold text-brass">
                      {typeof calcResult.ami_percentage === "number"
                        ? calcResult.ami_percentage.toFixed(1)
                        : calcResult.ami_percentage}%
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                  {calcResult.income_limit_30 && (
                    <div>
                      <p className="font-mono text-2xs text-ink/40">30% limit</p>
                      <p className="font-mono text-sm font-medium text-ink">${Number(calcResult.income_limit_30).toLocaleString()}</p>
                    </div>
                  )}
                  {calcResult.income_limit_50 && (
                    <div>
                      <p className="font-mono text-2xs text-ink/40">50% limit</p>
                      <p className="font-mono text-sm font-medium text-ink">${Number(calcResult.income_limit_50).toLocaleString()}</p>
                    </div>
                  )}
                  {calcResult.income_limit_60 && (
                    <div>
                      <p className="font-mono text-2xs text-ink/40">60% limit</p>
                      <p className="font-mono text-sm font-medium text-ink">${Number(calcResult.income_limit_60).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {calcResult.effective_date && (
                  <p className="font-mono text-2xs text-ink/30">
                    Source: HUD MTSP 2026 &mdash; effective {calcResult.effective_date}
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={explainCalculation}
                  disabled={explaining}
                  aria-busy={explaining}
                >
                  {explaining ? "Loading..." : "Explain this calculation"}
                </Button>

                {explanation && (
                  <div className="border border-line bg-paper p-3">
                    <pre className="font-mono text-2xs text-ink/60 whitespace-pre-wrap">{explanation}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
