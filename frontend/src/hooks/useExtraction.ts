import { useState, useCallback } from "react";
import { api } from "@/api/client";

export function useExtraction(token: string | null) {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useCallback(
    async (file: File) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await api.extractDocument(token, file);
        setFields(result.fields || []);
        return result;
      } catch (e: any) {
        setError(e.message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const confirmField = useCallback(
    async (fieldName: string, correctedValue?: string) => {
      if (!token) return;
      await api.confirmField(token, fieldName, correctedValue);
      setFields((prev) =>
        prev.map((f) =>
          f.field_name === fieldName
            ? { ...f, requires_confirmation: false, value: correctedValue || f.value }
            : f
        )
      );
    },
    [token]
  );

  return { fields, loading, error, uploadDocument, confirmField, setFields };
}
