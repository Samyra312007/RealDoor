import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/lib/session-context";
import { Button } from "@/components/ui/button";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { Upload, FileText, CheckCircle2, AlertCircle, HelpCircle, Eye, ChevronRight, SkipForward } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  current_address: "Current address",
  household_size: "Household size",
  annual_income: "Annual income",
  monthly_income: "Monthly income",
  income_source: "Income source",
  has_voucher: "Has housing voucher",
  voucher_type: "Voucher type",
  has_government_id: "Government ID",
  is_veteran: "Veteran status",
  is_senior: "Senior status",
  has_disability: "Disability status",
  property_county: "Property county",
  property_cbsa: "Property CBSA",
};

const FIELD_ORDER = [
  "full_name", "current_address", "household_size",
  "annual_income", "monthly_income", "income_source",
  "has_voucher", "voucher_type",
  "has_government_id", "is_veteran", "is_senior", "has_disability",
  "property_county", "property_cbsa",
];

function FileCaseTab({
  upload,
  needsReview,
}: {
  upload: { file: File; status: string; error?: string };
  needsReview: boolean;
}) {
  const isPending = upload.status === "pending";
  const isUploading = upload.status === "uploading";
  const isDone = upload.status === "done";
  const isError = upload.status === "error";

  let statusWord: string;
  let statusColor: string;
  if (isPending || isUploading) {
    statusWord = "Reading\u2026";
    statusColor = "text-brass";
  } else if (isDone) {
    statusWord = needsReview ? "Needs review" : "Confirmed";
    statusColor = needsReview ? "text-review" : "text-confirmed";
  } else {
    statusWord = "Couldn\u2019t read";
    statusColor = "text-expired";
  }

  return (
    <div className="border border-line" role="listitem">
      <div className="flex items-center gap-3 px-3 py-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-ink/30" aria-hidden="true" />
        <span className="flex-1 truncate font-sans text-sm text-ink/80">{upload.file.name}</span>
        <span className={`shrink-0 font-mono text-2xs font-medium ${statusColor}`}>
          {statusWord}
        </span>
      </div>
      <div className="h-0.5 bg-line/50">
        <div
          className={`h-full ${isUploading || isPending ? "w-2/3 bg-brass" : isDone ? "w-full bg-confirmed" : isError ? "w-full bg-expired" : "w-0"}`}
          style={isUploading || isPending ? { animation: "shimmer 1.5s ease-in-out infinite" } : undefined}
        />
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.9) {
    return (
      <span className="inline-flex items-center gap-1 font-sans text-xs text-confirmed">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>High</span>
      </span>
    );
  }
  if (confidence >= 0.7) {
    return (
      <span className="inline-flex items-center gap-1 font-sans text-xs text-review">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Check this</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-sans text-xs text-expired">
      <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Not found</span>
    </span>
  );
}

function FieldRow({
  field,
  onConfirm,
  onSkip,
}: {
  field: {
    field_name: string;
    value: string;
    confidence: number;
    source_snippet: string;
    requires_confirmation: boolean;
    needs_review: boolean;
  };
  onConfirm: (fieldName: string, correctedValue?: string) => Promise<void>;
  onSkip: (fieldName: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(field.value || "");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!field.requires_confirmation) return;
    setDraft(field.value || "");
  }, [field.value, field.requires_confirmation]);

  const isNumeric = ["annual_income", "monthly_income", "household_size"].includes(field.field_name);
  const isSkipped = !field.requires_confirmation && field.value === "(skipped)";
  const isConfirmed = !field.requires_confirmation && field.value !== "(skipped)";
  const showInput = field.requires_confirmation;

  const handleConfirmClick = async () => {
    setConfirming(true);
    try {
      await onConfirm(field.field_name, draft || undefined);
    } finally {
      setConfirming(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleConfirmClick();
    }
  };

  return (
    <div
      className={`border p-4 transition-colors ${
        field.needs_review && field.requires_confirmation
          ? "border-review"
          : isConfirmed
          ? "border-confirmed/30"
          : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="font-sans text-xs font-medium uppercase tracking-wider text-ink/50">
              {FIELD_LABELS[field.field_name] || field.field_name.replace(/_/g, " ")}
            </p>
            <ConfidenceBadge confidence={field.confidence} />
          </div>

          {showInput ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type={isNumeric ? "text" : "text"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    field.confidence < 0.7
                      ? "Needs your input \u2014 not found in document"
                      : "Edit value if needed"
                  }
                  className={`w-full rounded-sm border bg-paper px-3 py-1.5 font-sans text-sm text-ink placeholder:text-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                    field.needs_review ? "border-review" : "border-line"
                  } ${isNumeric ? "font-mono" : ""}`}
                  aria-label={FIELD_LABELS[field.field_name] || field.field_name}
                  autoComplete="off"
                />
              </div>
            </div>
          ) : (
            <p className={`font-sans text-sm ${isNumeric ? "font-mono" : ""} ${
              isSkipped ? "text-ink/40 italic" : "text-ink"
            }`}>
              {isSkipped ? "Skipped" : field.value}
            </p>
          )}

          {field.source_snippet && (
            <details className="mt-1.5">
              <summary className="inline-flex cursor-pointer items-center gap-1 font-mono text-2xs text-ink/40 hover:text-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded">
                <Eye className="h-3 w-3" aria-hidden="true" />
                <span>Show source</span>
              </summary>
              <div className="mt-1.5 border border-line bg-line/20 p-2">
                <p className="font-mono text-2xs leading-relaxed text-ink/60 whitespace-pre-wrap">
                  {field.source_snippet}
                </p>
              </div>
            </details>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-2">
          {field.requires_confirmation ? (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={handleConfirmClick}
                disabled={confirming}
                aria-busy={confirming}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSkip(field.field_name)}
                aria-label={`Skip ${FIELD_LABELS[field.field_name] || field.field_name}`}
              >
                <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          ) : isSkipped ? (
            <LedgerStamp variant="skipped">Skipped</LedgerStamp>
          ) : (
            <LedgerStamp variant="confirmed">Confirmed</LedgerStamp>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const {
    fields, extractLoading, extractError, uploads,
    uploadDocument, confirmField, skipField, allConfirmed, needsReviewRef,
  } = useSessionContext();
  const navigate = useNavigate();

  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const sorted = [...fields].sort(
    (a, b) => FIELD_ORDER.indexOf(a.field_name) - FIELD_ORDER.indexOf(b.field_name)
  );

  const needsReviewFields = sorted.filter(
    (f) => f.needs_review && f.requires_confirmation
  );
  const otherFields = sorted.filter(
    (f) => !(f.needs_review && f.requires_confirmation)
  );
  const confirmedOrSkippedCount = fields.filter((f) => !f.requires_confirmation).length;
  const totalFields = fields.length;
  const hasUploads = uploads.length > 0;
  const hasFields = fields.length > 0;
  const anyUploadNeedsReview = uploads.some((u) => u.status === "done") && needsReviewFields.length > 0;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.size > 0 && (f.name.endsWith(".pdf") || f.name.match(/\.(png|jpg|jpeg)$/i))
    );
    if (files.length === 0) {
      setAnnouncement("We couldn\u2019t read that file \u2014 try a PDF or an image.");
      return;
    }
    files.forEach((f) => uploadDocument(f));
    setAnnouncement(`${files.length} file${files.length > 1 ? "s" : ""} added`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => uploadDocument(f));
    if (fileRef.current) fileRef.current.value = "";
    if (files.length > 0) {
      setAnnouncement(`${files.length} file${files.length > 1 ? "s" : ""} added`);
    }
  };

  const handleConfirm = async (fieldName: string, correctedValue?: string) => {
    await confirmField(fieldName, correctedValue);
    setAnnouncement(`${FIELD_LABELS[fieldName] || fieldName} confirmed`);
  };

  const handleSkip = async (fieldName: string) => {
    await skipField(fieldName);
    setAnnouncement(`${FIELD_LABELS[fieldName] || fieldName} skipped`);
  };

  const uploadZone = (
    <div
      role="button"
      tabIndex={extractLoading ? -1 : 0}
      aria-label="Upload documents. Drag and drop or click to select."
      aria-disabled={extractLoading}
      className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-line p-8 transition-colors
        ${extractLoading ? "pointer-events-none opacity-50" : ""}
        ${dragOver ? "border-brass bg-brass/5" : "hover:border-brass/50"}
      `}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !extractLoading && fileRef.current?.click()}
      onKeyDown={(e) => {
        if (!extractLoading && (e.key === "Enter" || e.key === " ")) fileRef.current?.click();
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        aria-hidden="true"
        disabled={extractLoading}
      />
      <Upload className="mb-3 h-8 w-8 text-ink/20" aria-hidden="true" />
      <p className="font-sans text-sm font-medium text-ink/70">
        {extractLoading ? "Uploading\u2026" : "Drop your documents here, or click to browse"}
      </p>
      <p className="mt-1 font-sans text-2xs text-ink/40">PDF, PNG, or JPEG \u2014 up to 10 MB each</p>
    </div>
  );

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 01 \u2014 Profile
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Upload your documents. We\u2019ll extract the information. You confirm or correct each field.
      </p>

      <div ref={statusRef} aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {extractError && (
        <div role="alert" className="mb-4 flex items-center gap-2 border border-expired/30 bg-expired/5 p-3 font-sans text-sm text-expired">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{extractError}</span>
        </div>
      )}

      {!hasUploads && !hasFields && !extractLoading && !extractError && (
        <div className="mx-auto max-w-lg py-12">
          {uploadZone}
        </div>
      )}

      {(hasUploads || hasFields || extractLoading) && (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-sans text-xs font-medium uppercase tracking-wider text-ink/40">
                Documents
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileRef.current?.click()}
                disabled={extractLoading}
              >
                <Upload className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Add file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                aria-hidden="true"
                disabled={extractLoading}
              />
            </div>
            <ul className="space-y-2" role="list" aria-label="Uploaded files">
              {uploads.map((u, i) => (
                <li key={i}>
                  <FileCaseTab upload={u} needsReview={anyUploadNeedsReview} />
                </li>
              ))}
            </ul>
          </div>

          {extractLoading && (
            <div className="border border-line bg-line/20 p-4">
              <p className="font-sans text-sm text-ink/60">
                We\u2019re reading your document\u2026
              </p>
              <div className="mt-2 h-0.5 bg-line/50">
                <div
                  className="h-full w-2/3 bg-brass"
                  style={{ animation: "shimmer 1.5s ease-in-out infinite" }}
                />
              </div>
              <p className="mt-2 font-mono text-2xs text-ink/30">
                Extracting fields \u2014 this may take a moment
              </p>
            </div>
          )}

          {hasFields && (
            <div>
              <div className="mb-1 flex items-center gap-2">
                <p className="font-sans text-xs font-medium uppercase tracking-wider text-ink/40">
                  Extracted fields
                </p>
                {totalFields > 0 && (
                  <span className="font-mono text-2xs text-ink/30">
                    {confirmedOrSkippedCount} of {totalFields} done
                  </span>
                )}
              </div>

              {needsReviewFields.length > 0 && (
                <div
                  ref={needsReviewRef}
                  className="mb-4 space-y-3"
                >
                  <div className="flex items-center gap-2 border border-review/30 bg-review/5 px-3 py-2">
                    <Eye className="h-4 w-4 shrink-0 text-review" aria-hidden="true" />
                    <p className="font-sans text-xs text-review">
                      Needs your input &mdash; <span className="font-medium">{needsReviewFields.length} field{needsReviewFields.length > 1 ? "s" : ""}</span>{" "}
                      we couldn&rsquo;t read confidently. Review them below.
                    </p>
                  </div>
                  <ul className="space-y-2" role="list">
                    {needsReviewFields.map((field) => (
                      <li key={field.field_name}>
                        <FieldRow
                          field={field}
                          onConfirm={handleConfirm}
                          onSkip={handleSkip}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {otherFields.length > 0 && (
                <ul className="space-y-2" role="list">
                  {otherFields.map((field) => (
                    <li key={field.field_name}>
                      <FieldRow
                        field={field}
                        onConfirm={handleConfirm}
                        onSkip={handleSkip}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {hasFields && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-line bg-paper px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <p className="font-sans text-sm text-ink/60">
              <span className="font-medium text-ink/80">{confirmedOrSkippedCount}</span> of{" "}
              <span className="font-medium text-ink/80">{totalFields}</span> fields confirmed
            </p>
            <div className="flex items-center gap-3">
              {!allConfirmed && (
                <p className="hidden font-sans text-xs text-review sm:block">
                  Confirm or skip all fields to continue
                </p>
              )}
              <Button
                variant="primary"
                onClick={() => navigate("/understand")}
                disabled={!allConfirmed}
              >
                Continue to Understand
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
