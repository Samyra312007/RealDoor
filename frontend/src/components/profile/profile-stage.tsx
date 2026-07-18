import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle2, AlertCircle, SkipForward } from "lucide-react";

type ExtractedField = {
  field_name: string;
  value: string;
  confidence: number;
  source_snippet: string;
  page_number?: number;
  requires_confirmation: boolean;
  needs_review: boolean;
};

type UploadStatus = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

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

export function ProfileStage({
  fields,
  loading,
  error,
  uploads,
  onUpload,
  onConfirm,
  onSkip,
  needsReviewRef,
}: {
  fields: ExtractedField[];
  loading: boolean;
  error: string | null;
  uploads: UploadStatus[];
  onUpload: (file: File) => Promise<void>;
  onConfirm: (fieldName: string, correctedValue?: string) => Promise<void>;
  onSkip: (fieldName: string) => Promise<void>;
  needsReviewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.size > 0 && (f.name.endsWith(".pdf") || f.name.match(/\.(png|jpg|jpeg)$/i))
    );
    files.forEach((f) => onUpload(f));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => onUpload(f));
    if (fileRef.current) fileRef.current.value = "";
  };

  const sorted = [...fields].sort(
    (a, b) => FIELD_ORDER.indexOf(a.field_name) - FIELD_ORDER.indexOf(b.field_name)
  );
  const confirmedCount = fields.filter((f) => !f.requires_confirmation).length;
  const needsReview = fields.filter((f) => f.needs_review && f.requires_confirmation);

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-6 text-2xl font-bold text-neutral-900">
        Stage 1: Profile
      </h2>
      <p className="mb-6 text-neutral-600">
        Upload your documents. The AI extracts the information. You confirm or correct each field.
      </p>

      <Card title="Upload Documents" className="mb-6">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload document area. Drag and drop or click to select."
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors
            ${dragOver ? "border-brand-500 bg-brand-50" : "border-neutral-300 hover:border-brand-400"}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            aria-hidden="true"
          />
          <Upload className="mb-2 h-8 w-8 text-neutral-400" aria-hidden="true" />
          <p className="text-sm font-medium text-neutral-700">
            Drag & drop documents, or click to browse
          </p>
          <p className="mt-1 text-xs text-neutral-500">PDF, PNG, or JPEG (max 10 MB each)</p>
        </div>

        {uploads.length > 0 && (
          <ul className="mt-4 space-y-2" role="list">
            {uploads.map((u, i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border bg-neutral-50 px-3 py-2">
                <FileText className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                <span className="flex-1 truncate text-sm text-neutral-700">{u.file.name}</span>
                {u.status === "uploading" && (
                  <span className="text-xs text-brand-600">Extracting...</span>
                )}
                {u.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Uploaded" />
                )}
                {u.status === "error" && (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {u.error || "Failed"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {loading && (
        <div role="status" aria-live="polite" className="mb-4">
          <p className="mb-2 text-sm text-neutral-600">Extracting fields from document...</p>
          <Progress value={50} label="Document extraction in progress" />
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {fields.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              <span className="font-medium">{confirmedCount}</span> of{" "}
              <span className="font-medium">{fields.length}</span> fields confirmed
            </p>
            <Progress value={confirmedCount} max={fields.length} label="Field confirmation progress" />
          </div>

          {needsReview.length > 0 && (
            <div
              ref={needsReviewRef}
              role="alert"
              className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              <span className="font-medium">{needsReview.length} field(s)</span> need your review.
              Please confirm or correct the highlighted fields below.
            </div>
          )}

          <ul className="space-y-4" role="list">
            {sorted.map((field) => (
              <li key={field.field_name}>
                <Card
                  className={`p-4 ${field.needs_review && field.requires_confirmation ? "ring-2 ring-amber-400" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {FIELD_LABELS[field.field_name] || field.field_name.replace(/_/g, " ")}
                        </p>
                        <Badge
                          variant={
                            field.confidence >= 0.9
                              ? "success"
                              : field.confidence >= 0.7
                              ? "warning"
                              : "error"
                          }
                        >
                          {Math.round(field.confidence * 100)}%
                        </Badge>
                      </div>

                      {confirming === field.field_name ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            defaultValue={field.value}
                            id={`edit-${field.field_name}`}
                            label="Corrected value"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onConfirm(field.field_name, (e.target as HTMLInputElement).value);
                                setConfirming(null);
                              }
                            }}
                          />
                          <Button size="sm" variant="primary" onClick={() => { setConfirming(null); onConfirm(field.field_name, (document.getElementById(`edit-${field.field_name}`) as HTMLInputElement)?.value); }}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <p className={`mt-1 text-sm ${field.value ? "text-neutral-700" : "italic text-neutral-400"}`}>
                          {field.value || "Needs your input — not found in document"}
                        </p>
                      )}

                      {field.source_snippet && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700">
                            View source snippet
                          </summary>
                          <p className="mt-1 rounded bg-neutral-50 p-2 text-xs text-neutral-600 font-mono whitespace-pre-wrap">
                            {field.source_snippet}
                          </p>
                        </details>
                      )}
                    </div>

                    <div className="ml-4 flex shrink-0 gap-2">
                      {field.requires_confirmation ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onConfirm(field.field_name)}
                          >
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
                            onClick={() => onSkip(field.field_name)}
                            aria-label={`Skip ${field.field_name}`}
                          >
                            <SkipForward className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="success">Confirmed</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
