import { useState, useRef, useEffect } from "react";
import { useSessionContext } from "@/lib/session-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { Upload, FileText, AlertCircle, Eye, Check, SkipForward } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  household_size: "Household Size",
  annual_income: "Annual Income",
  monthly_income: "Monthly Income",
  income_source: "Income Source",
  has_voucher: "Has Housing Voucher",
  voucher_type: "Voucher Type",
  current_address: "Current Address",
  has_government_id: "Government ID",
  is_veteran: "Veteran Status",
  is_senior: "Senior Status",
  has_disability: "Disability Status",
  property_county: "Property County",
  property_cbsa: "Property CBSA",
};

const FIELD_ORDER = [
  "full_name", "current_address", "household_size",
  "annual_income", "monthly_income", "income_source",
  "has_voucher", "voucher_type",
  "has_government_id", "is_veteran", "is_senior", "has_disability",
  "property_county", "property_cbsa",
];

export function ProfilePage() {
  const {
    fields, extractLoading, extractError, uploads,
    uploadDocument, confirmField, skipField, allConfirmed, needsReviewRef,
  } = useSessionContext();

  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.size > 0 && (f.name.endsWith(".pdf") || f.name.match(/\.(png|jpg|jpeg)$/i))
    );
    files.forEach((f) => uploadDocument(f));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => uploadDocument(f));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConfirm = async (fieldName: string, correctedValue?: string) => {
    await confirmField(fieldName, correctedValue);
    setAnnouncement(`${FIELD_LABELS[fieldName] || fieldName} confirmed`);
  };

  const sorted = [...fields].sort(
    (a, b) => FIELD_ORDER.indexOf(a.field_name) - FIELD_ORDER.indexOf(b.field_name)
  );
  const confirmedCount = fields.filter((f) => !f.requires_confirmation).length;
  const needsReview = fields.filter((f) => f.needs_review && f.requires_confirmation);

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 01 — Profile
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Upload your documents. We&rsquo;ll extract the information. You confirm or correct each field.
      </p>

      <div ref={statusRef} aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <Card title="Upload documents" className="mb-6">
        <div
          role="button"
          tabIndex={extractLoading ? -1 : 0}
          aria-label="Upload document area. Drag and drop or click to select."
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
          <Upload className="mb-2 h-6 w-6 text-ink/30" aria-hidden="true" />
          <p className="font-sans text-sm font-medium text-ink/70">
            {extractLoading ? "Upload in progress..." : "Drag & drop documents, or click to browse"}
          </p>
          <p className="mt-1 font-sans text-2xs text-ink/40">PDF, PNG, or JPEG (max 10 MB each)</p>
        </div>

        {uploads.length > 0 && (
          <ul className="mt-4 space-y-2" role="list">
            {uploads.map((u, i) => (
              <li key={i} className="flex items-center gap-3 border border-line px-3 py-2">
                <FileText className="h-4 w-4 text-ink/30" aria-hidden="true" />
                <span className="flex-1 truncate font-sans text-sm text-ink/70">{u.file.name}</span>
                {u.status === "uploading" && (
                  <span className="font-mono text-xs text-brass">Extracting...</span>
                )}
                {u.status === "done" && (
                  <LedgerStamp variant="confirmed">Extracted</LedgerStamp>
                )}
                {u.status === "error" && (
                  <span className="flex items-center gap-1 font-sans text-xs text-expired" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    <span>{u.error || "Failed"}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {extractLoading && (
        <div className="mb-4">
          <p className="mb-2 font-sans text-sm text-ink/50">Extracting fields from document...</p>
          <div className="border border-line bg-line/20 p-3">
            <Progress value={50} label="Document extraction in progress" />
            <p className="mt-2 font-mono text-xs text-brass">Processing document &mdash; this may take a moment</p>
          </div>
        </div>
      )}

      {extractError && (
        <div role="alert" className="mb-4 flex items-center gap-2 border border-expired/30 bg-expired/5 p-3 font-sans text-sm text-expired">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{extractError}</span>
        </div>
      )}

      {fields.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between border border-line bg-line/20 p-3">
            <p className="font-mono text-xs text-ink/50">
              <span className="font-medium text-ink/80">{confirmedCount}</span> / {fields.length} confirmed
            </p>
            <Progress value={confirmedCount} max={fields.length} label="Field confirmation progress" />
          </div>

          {needsReview.length > 0 && (
            <div
              ref={needsReviewRef}
              role="alert"
              className="mb-4 flex items-center gap-2 border border-review/30 bg-review/5 p-3"
            >
              <Eye className="h-4 w-4 shrink-0 text-review" aria-hidden="true" />
              <span className="font-sans text-xs text-review">
                <span className="font-medium">{needsReview.length} field(s)</span> need your review.
                Please confirm or correct the highlighted fields below.
              </span>
            </div>
          )}

          <ul className="space-y-3" role="list">
            {sorted.map((field) => (
              <li key={field.field_name}>
                <div
                  className={`border p-4 ${field.needs_review && field.requires_confirmation ? "border-review" : "border-line"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-sans text-sm font-medium text-ink">
                          {FIELD_LABELS[field.field_name] || field.field_name.replace(/_/g, " ")}
                        </p>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                          field.confidence >= 0.9 ? "bg-confirmed" :
                          field.confidence >= 0.7 ? "bg-review" : "bg-expired"
                        }`} />
                        <span className="font-mono text-2xs text-ink/40">
                          {Math.round(field.confidence * 100)}%
                        </span>
                      </div>

                      {confirming === field.field_name ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            defaultValue={field.value}
                            id={`edit-${field.field_name}`}
                            label="Corrected value"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleConfirm(field.field_name, (e.target as HTMLInputElement).value);
                                setConfirming(null);
                              }
                              if (e.key === "Escape") setConfirming(null);
                            }}
                          />
                          <Button size="sm" variant="primary" onClick={() => {
                            handleConfirm(field.field_name, (document.getElementById(`edit-${field.field_name}`) as HTMLInputElement)?.value);
                            setConfirming(null);
                          }}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <p className={`mt-1 flex items-center gap-1 font-mono text-sm ${
                          field.value ? "text-ink" : "italic text-ink/40"
                        }`}>
                          {field.value || (
                            <>
                              <AlertCircle className="h-3 w-3" aria-hidden="true" />
                              <span className="font-sans">Needs your input — not found in document</span>
                            </>
                          )}
                        </p>
                      )}

                      {field.source_snippet && (
                        <details className="mt-1">
                          <summary className="cursor-pointer font-mono text-2xs text-ink/40 hover:text-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded">
                            View source snippet
                          </summary>
                          <p className="mt-1 border border-line bg-paper p-2 font-mono text-2xs text-ink/60 whitespace-pre-wrap">
                            {field.source_snippet}
                          </p>
                        </details>
                      )}
                    </div>

                    <div className="flex shrink-0 items-start gap-2">
                      {field.requires_confirmation ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleConfirm(field.field_name)}
                          >
                            <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirming(field.field_name)}
                            aria-label={`Edit ${field.field_name}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => skipField(field.field_name)}
                            aria-label={`Skip ${field.field_name}`}
                          >
                            <SkipForward className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <LedgerStamp variant="confirmed">Confirmed</LedgerStamp>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {allConfirmed && (
            <div className="mt-6 border border-confirmed/30 bg-confirmed/5 p-4 text-center">
              <LedgerStamp variant="confirmed" className="mb-2 text-xs">
                Stage complete
              </LedgerStamp>
              <p className="font-sans text-sm text-confirmed">
                All fields confirmed. You can proceed to the Understand stage.
              </p>
            </div>
          )}
        </>
      )}

      {!extractLoading && fields.length === 0 && !extractError && (
        <div className="border border-line bg-line/20 p-6 text-center">
          <p className="font-sans text-sm text-ink/50">
            Upload a document to get started. We&rsquo;ll extract your information and present it here for review.
          </p>
        </div>
      )}
    </section>
  );
}
