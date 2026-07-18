import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type ExtractedField = {
  field_name: string;
  value: string;
  confidence: number;
  source_snippet: string;
  page_number?: number;
  requires_confirmation: boolean;
};

export function ProfileStage({
  fields,
  loading,
  error,
  onUpload,
  onConfirm,
}: {
  fields: ExtractedField[];
  loading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<void>;
  onConfirm: (fieldName: string, correctedValue?: string) => Promise<void>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const confirmedCount = fields.filter((f) => !f.requires_confirmation).length;

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-6 text-2xl font-bold text-neutral-900">
        Stage 1: Profile
      </h2>
      <p className="mb-6 text-neutral-600">
        Upload your documents. The AI extracts the information. You confirm or correct each field.
      </p>

      <Card title="Upload Document" className="mb-6">
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
            className="hidden"
            onChange={handleFileSelect}
            aria-hidden="true"
          />
          <span className="mb-2 text-3xl" aria-hidden="true">📄</span>
          <p className="text-sm font-medium text-neutral-700">
            Drag & drop a document, or click to browse
          </p>
          <p className="mt-1 text-xs text-neutral-500">PDF, PNG, or JPEG (max 10 MB)</p>
        </div>
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

          <ul className="space-y-4" role="list">
            {fields.map((field) => (
              <li key={field.field_name}>
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {field.field_name.replace(/_/g, " ")}
                        </p>
                        <Badge
                          variant={
                            field.confidence >= 0.8
                              ? "success"
                              : field.confidence >= 0.5
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
                          <Button size="sm" variant="primary" onClick={() => setConfirming(null)}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-neutral-700">{field.value}</p>
                      )}
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700">
                          View source snippet
                        </summary>
                        <p className="mt-1 rounded bg-neutral-50 p-2 text-xs text-neutral-600">
                          {field.source_snippet}
                        </p>
                      </details>
                    </div>
                    <div className="ml-4 flex gap-2">
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
