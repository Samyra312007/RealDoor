import { useState, useCallback, useRef } from "react";
import { api } from "@/api/client";

export type ExtractedField = {
  field_name: string;
  value: string;
  confidence: number;
  source_snippet: string;
  page_number?: number;
  requires_confirmation: boolean;
  needs_review: boolean;
};

export type UploadStatus = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export function useExtraction(token: string | null) {
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const needsReviewRef = useRef<HTMLDivElement>(null);

  const uploadDocument = useCallback(
    async (file: File) => {
      if (!token) return;
      setUploads((prev) => [...prev, { file, status: "pending" }]);
      setError(null);

      const idx = uploads.length;
      setUploads((prev) => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], status: "uploading" };
        return next;
      });

      try {
        const result = await api.extractDocument(token, file);
        setFields((prev) => {
          const merged = [...prev];
          for (const newField of result.fields || []) {
            const existing = merged.find((f) => f.field_name === newField.field_name);
            if (!existing || newField.confidence > existing.confidence) {
              if (existing) {
                Object.assign(existing, newField);
              } else {
                merged.push(newField);
              }
            }
          }
          return merged;
        });
        setUploads((prev) => {
          const next = [...prev];
          if (next[idx]) next[idx] = { ...next[idx], status: "done" };
          return next;
        });
        return result;
      } catch (e: any) {
        setError(e.message);
        setUploads((prev) => {
          const next = [...prev];
          if (next[idx]) next[idx] = { ...next[idx], status: "error", error: e.message };
          return next;
        });
        throw e;
      }
    },
    [token, uploads.length]
  );

  const confirmField = useCallback(
    async (fieldName: string, correctedValue?: string) => {
      if (!token) return;
      await api.confirmField(token, fieldName, correctedValue);
      setFields((prev) =>
        prev.map((f) =>
          f.field_name === fieldName
            ? { ...f, requires_confirmation: false, needs_review: false, value: correctedValue || f.value }
            : f
        )
      );
    },
    [token]
  );

  const skipField = useCallback(
    async (fieldName: string) => {
      if (!token) return;
      await api.confirmField(token, fieldName, "(skipped)");
      setFields((prev) =>
        prev.map((f) =>
          f.field_name === fieldName
            ? { ...f, requires_confirmation: false, needs_review: false, value: f.value || "(skipped)" }
            : f
        )
      );
    },
    [token]
  );

  const deleteField = useCallback(
    async (fieldName: string) => {
      if (!token) return;
      await api.deleteField(token, fieldName);
      setFields((prev) => prev.filter((f) => f.field_name !== fieldName));
    },
    [token]
  );

  const allConfirmed = fields.length > 0 && fields.every((f) => !f.requires_confirmation);
  const needsReviewFields = fields.filter((f) => f.needs_review);

  const scrollToNeedsReview = useCallback(() => {
    setTimeout(() => {
      needsReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const resetExtraction = useCallback(() => {
    setFields([]);
    setUploads([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    fields,
    loading,
    error,
    uploads,
    uploadDocument,
    confirmField,
    skipField,
    deleteField,
    setFields,
    allConfirmed,
    needsReviewFields,
    needsReviewRef,
    scrollToNeedsReview,
    resetExtraction,
  };
}
