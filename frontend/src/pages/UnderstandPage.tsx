import { useState, useRef, useCallback } from "react";
import { useSessionContext } from "@/lib/session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const EXAMPLE_QUESTIONS = [
  "What\u2019s the income limit for a 3-person household?",
  "How is AMI calculated?",
  "What does 60% of AMI mean?",
  "What documents do I need for LIHTC?",
];

const REFUSAL_MESSAGE =
  "I can calculate your AMI% and show you the rule \u2014 but I can\u2019t tell you if you qualify. That\u2019s for a qualified human to confirm.";

const EXAMPLE_CBSA = "12086";

function ReceiptTear({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className || ""}`} aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => (
        <span key={i} className="h-px w-1 bg-line/60" />
      ))}
    </div>
  );
}

function QAPanel({
  answer,
  refusalError,
  loading,
  onAsk,
  onClear,
}: {
  answer: any;
  refusalError: string | null;
  loading: boolean;
  onAsk: (q: string) => void;
  onClear: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [showWhy, setShowWhy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!question.trim() || loading) return;
    onAsk(question.trim());
  };

  const handleChip = (q: string) => {
    setQuestion(q);
    onAsk(q);
  };

  const isRefusal = refusalError !== null;
  const isAbstention = answer?.abstained && !isRefusal;
  const hasAnswer = answer && !isAbstention && !isRefusal;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label htmlFor="qa-input" className="block font-display text-base font-semibold text-ink">
          Ask about the rules
        </label>
        <p className="font-sans text-xs text-ink/50">for your area</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              id="qa-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Type your question here\u2026"
              className="w-full rounded-sm border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              aria-label="Ask a question about rental rules"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!question.trim() || loading} aria-busy={loading}>
            {loading ? "Asking\u2026" : "Ask"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Example questions">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleChip(q)}
              disabled={loading}
              className="rounded-sm border border-line px-2.5 py-1 font-sans text-2xs text-ink/50 transition-colors hover:border-brass/50 hover:text-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* REFUSAL CARD — ochre left border, not red */}
      {isRefusal && (
        <div className="border-l-2 border-review bg-review/5 p-4" role="alert">
          <p className="font-sans text-sm leading-relaxed text-ink">
            {REFUSAL_MESSAGE}
          </p>
          <button
            onClick={() => setShowWhy(!showWhy)}
            className="mt-2 inline-flex items-center gap-1 font-mono text-2xs text-ink/40 hover:text-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded"
            aria-expanded={showWhy}
          >
            {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{showWhy ? "Hide" : "Why?"}</span>
          </button>
          {showWhy && (
            <p className="mt-2 font-mono text-2xs leading-relaxed text-ink/50">
              RealDoor extracts, explains, calculates, and prepares \u2014 it never decides.
              Deterministic math and rule retrieval help you understand your situation,
              but only a housing program official can determine eligibility.
            </p>
          )}
        </div>
      )}

      {/* ABSTRACTION — same weight as a real answer, not an error */}
      {isAbstention && (
        <div className="border border-line p-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-ink/40" aria-hidden="true" />
            <LedgerStamp variant="default">Abstained</LedgerStamp>
          </div>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink/60">
            I don\u2019t have enough information to answer that. Try rephrasing your question.
          </p>
          {answer.citations?.length > 0 && (
            <div className="mt-3 border-t border-dotted border-line pt-2">
              {answer.citations.map((c: any, i: number) => (
                <p key={i} className="font-mono text-2xs text-ink/40">
                  {c.effective_date && <>Effective: {c.effective_date}</>}
                  {c.source_url && <> &mdash; {c.source_url.split("/").slice(0, 3).join("/")}</>}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NORMAL ANSWER with receipt-tape citation strip */}
      {hasAnswer && !loading && (
        <div role="status" aria-live="polite" className="border border-line p-4">
          <p className="font-sans text-sm leading-relaxed text-ink">{answer.answer}</p>
          {answer.citations?.length > 0 && (
            <div className="mt-4">
              <ReceiptTear className="mb-2" />
              <div className="space-y-1">
                {answer.citations.map((c: any, i: number) => (
                  <p key={i} className="font-mono text-2xs text-ink/40">
                    {c.snippet && <span className="italic">&ldquo;{c.snippet}&rdquo; </span>}
                    {c.effective_date && <>effective {c.effective_date}</>}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="border border-line bg-line/20 p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-brass" />
            <p className="font-sans text-sm text-ink/50">Looking that up\u2026</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CalculatorPanel({
  calcResult,
  calcLoading,
  explaining,
  explanation,
  onCalculate,
  onCalculateFromProfile,
  onExplain,
}: {
  calcResult: any;
  calcLoading: boolean;
  explaining: boolean;
  explanation: string | null;
  onCalculate: (income: number, hhSize: number, county: string) => void;
  onCalculateFromProfile: () => void;
  onExplain: () => void;
}) {
  const { fields, allConfirmed } = useSessionContext();
  const [income, setIncome] = useState("");
  const [hhSize, setHhSize] = useState("");
  const [county, setCounty] = useState(EXAMPLE_CBSA);
  const [explainOpen, setExplainOpen] = useState(false);

  const confirmedIncome = fields.find(
    (f) => f.field_name === "annual_income" && !f.requires_confirmation
  )?.value;
  const confirmedHhSize = fields.find(
    (f) => f.field_name === "household_size" && !f.requires_confirmation
  )?.value;
  const hasProfileData = allConfirmed && confirmedIncome && confirmedHhSize;

  const handleCalc = () => {
    if (!income || !hhSize) return;
    onCalculate(Number(income), Number(hhSize), county);
  };

  const handleProfileCalc = () => {
    onCalculateFromProfile();
  };

  const handleExplain = () => {
    setExplainOpen(!explainOpen);
    if (!explanation) {
      onExplain();
    }
  };

  // Parse formula steps into structured display
  const steps = calcResult?.formula_steps || [];
  const incomeLine = steps.find((s: string) => s.startsWith("Confirmed annual income:"));
  const hhLine = steps.find((s: string) => s.startsWith("Household size:"));
  const regionLine = steps.find((s: string) => s.startsWith("Metro area:"));
  const amiLine = steps.find((s: string) => s.startsWith("Area Median Income (AMI):"));
  const pctLine = steps.find((s: string) => s.includes("÷") && s.includes("× 100"));
  const limit30 = steps.find((s: string) => s.startsWith("30% AMI"));
  const limit50 = steps.find((s: string) => s.startsWith("50% AMI"));
  const limit60 = steps.find((s: string) => s.startsWith("60% AMI"));

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-semibold text-ink">Income calculator</h3>

      {hasProfileData && (
        <Button
          onClick={handleProfileCalc}
          disabled={calcLoading}
          className="w-full"
          variant="primary"
          aria-busy={calcLoading}
        >
          {calcLoading ? "Calculating\u2026" : "Calculate from confirmed profile"}
        </Button>
      )}

      <div className="relative" role="separator" aria-orientation="horizontal">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-paper px-2 font-sans text-2xs text-ink/40">or manual entry</span>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          label="Annual income ($)"
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="e.g. 50000"
        />
        <Input
          label="Household size"
          type="number"
          value={hhSize}
          onChange={(e) => setHhSize(e.target.value)}
          placeholder="e.g. 3"
        />
        <Input
          label="County or CBSA code"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          placeholder={EXAMPLE_CBSA}
        />
        <Button
          onClick={handleCalc}
          disabled={!income || !hhSize || calcLoading}
          className="w-full"
          aria-busy={calcLoading}
        >
          {calcLoading ? "Calculating\u2026" : "Calculate"}
        </Button>
      </div>

      {/* FORMULA TRACE — receipt-style */}
      {calcResult && !calcLoading && (
        <div role="status" aria-live="polite" className="sr-only">
          Calculation complete. AMI percentage: {typeof calcResult.ami_percentage === "number" ? calcResult.ami_percentage.toFixed(1) : calcResult.ami_percentage}%.
        </div>
      )}
      {calcResult && !calcLoading && (
        <div className="border border-line bg-paper">
          <div className="p-4 pb-3">
            <LedgerStamp variant="brass" className="mb-3">
              Formula trace
            </LedgerStamp>

            <div className="space-y-1.5 font-mono text-sm text-ink">
              {/* Income line */}
              {incomeLine && (
                <div className="flex justify-between">
                  <span className="text-ink/50">Your income</span>
                  <span className="font-medium">
                    {incomeLine.replace("Confirmed annual income: ", "").replace(/,/g, "")}
                  </span>
                </div>
              )}

              {/* Household size */}
              {hhLine && (
                <div className="flex justify-between text-ink/50">
                  <span>Household size</span>
                  <span>{hhLine.replace("Household size: ", "").replace(" persons", "")}</span>
                </div>
              )}

              {/* AMI threshold (from the percentage line or AMI line) */}
              {amiLine && (
                <div className="flex justify-between pt-2 border-t border-line/50">
                  <span className="text-ink/50">AMI 60% threshold</span>
                  <span className="font-medium">
                    {limit60
                      ? limit60.replace("60% AMI income limit: ", "").replace("/year", "")
                      : amiLine
                          .replace("Area Median Income (AMI): ", "")
                          .replace(/,/g, "")}
                  </span>
                </div>
              )}

              {/* Region */}
              {regionLine && (
                <p className="text-2xs text-ink/40">
                  {regionLine.replace("Metro area: ", "")}
                </p>
              )}

              {/* Percentage result — prominent */}
              {calcResult.ami_percentage !== undefined && (
                <div className="flex justify-between items-baseline pt-2 border-t border-line/50">
                  <span className="font-mono text-xs text-ink/50">AMI percentage</span>
                  <span className="font-mono text-xl font-semibold text-brass">
                    {typeof calcResult.ami_percentage === "number"
                      ? calcResult.ami_percentage.toFixed(1)
                      : calcResult.ami_percentage}%
                  </span>
                </div>
              )}

              {/* Full formula derivation */}
              {pctLine && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-mono text-2xs text-ink/30 hover:text-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded">
                    Show derivation
                  </summary>
                  <p className="mt-1 font-mono text-2xs text-ink/40 whitespace-pre-wrap">
                    {pctLine}
                  </p>
                </details>
              )}

              {/* Limit tiers */}
              {(limit30 || limit50 || limit60) && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/50">
                  {limit30 && (
                    <div>
                      <p className="font-mono text-2xs text-ink/30">30%</p>
                      <p className="font-mono text-xs font-medium text-ink">
                        {limit30.replace(/30% AMI income limit: \$/, "").replace(/\/year/, "")}
                      </p>
                    </div>
                  )}
                  {limit50 && (
                    <div>
                      <p className="font-mono text-2xs text-ink/30">50%</p>
                      <p className="font-mono text-xs font-medium text-ink">
                        {limit50.replace(/50% AMI income limit: \$/, "").replace(/\/year/, "")}
                      </p>
                    </div>
                  )}
                  {limit60 && (
                    <div>
                      <p className="font-mono text-2xs text-ink/30">60%</p>
                      <p className="font-mono text-xs font-medium text-ink">
                        {limit60.replace(/60% AMI income limit: \$/, "").replace(/\/year/, "")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RECEIPT-TAPE FOOTER */}
          <div className="border-t border-dotted border-line px-4 py-3">
            <ReceiptTear className="mb-2" />
            <p className="font-mono text-2xs uppercase tracking-wider text-ink/30">
              HUD MTSP 2026 &mdash; effective{" "}
              {calcResult.effective_date || "2026-05-01"}
            </p>
          </div>

          {/* EXPLAIN THIS CALCULATION */}
          <div className="border-t border-line">
            <button
              onClick={handleExplain}
              className="flex w-full items-center justify-between px-4 py-2.5 font-sans text-xs text-ink/50 transition-colors hover:bg-line/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              aria-expanded={explainOpen}
            >
              <span>Explain this calculation</span>
              {explainOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {explainOpen && (
              <div className="border-t border-line px-4 py-3">
                {explaining ? (
                  <p className="font-mono text-2xs text-ink/40">Loading explanation\u2026</p>
                ) : explanation ? (
                  <pre className="font-mono text-2xs leading-relaxed text-ink/60 whitespace-pre-wrap">
                    {explanation}
                  </pre>
                ) : (
                  <p className="font-mono text-2xs text-ink/40">
                    This formula shows how your annual income compares to the Area Median Income
                    (AMI) for your household size and metro area, using HUD\u2019s MTSP 2026 tables.
                    The math is deterministic \u2014 it doesn\u2019t judge or decide.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function UnderstandPage() {
  const {
    token, askQuestion, calcResult, calcLoading,
    explaining, explanation, calculate, calculateFromProfile, explainCalculation,
  } = useSessionContext();
  const [answer, setAnswer] = useState<any>(null);
  const [refusalError, setRefusalError] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  const handleAsk = useCallback(
    async (q: string) => {
      setRefusalError(null);
      setQaLoading(true);
      try {
        const result = await askQuestion(q, token || undefined);
        setAnswer(result);
      } catch (e: any) {
        const msg = e?.message || "";
        if (
          msg.toLowerCase().includes("eligible") ||
          msg.toLowerCase().includes("qualify") ||
          msg.toLowerCase().includes("approve") ||
          msg.toLowerCase().includes("decide")
        ) {
          setRefusalError(msg);
          setAnswer(null);
        } else {
          setAnswer({ abstained: true });
        }
      } finally {
        setQaLoading(false);
      }
    },
    [askQuestion, token]
  );

  const handleCalc = useCallback(
    (income: number, hhSize: number, county: string) => {
      calculate(income, hhSize, county);
    },
    [calculate]
  );

  const handleProfileCalc = useCallback(() => {
    if (token) calculateFromProfile(token);
  }, [calculateFromProfile, token]);

  return (
    <section aria-labelledby="understand-heading">
      <h2 id="understand-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 02 \u2014 Understand
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Ask questions about rental rules and calculate your income against program thresholds.
        All answers cite their sources. No eligibility decisions are made here.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="self-start">
          <QAPanel
            answer={answer}
            refusalError={refusalError}
            loading={qaLoading}
            onAsk={handleAsk}
            onClear={() => { setAnswer(null); setRefusalError(null); }}
          />
        </div>
        <div className="self-start">
          <CalculatorPanel
            calcResult={calcResult}
            calcLoading={calcLoading}
            explaining={explaining}
            explanation={explanation}
            onCalculate={handleCalc}
            onCalculateFromProfile={handleProfileCalc}
            onExplain={explainCalculation}
          />
        </div>
      </div>
    </section>
  );
}
