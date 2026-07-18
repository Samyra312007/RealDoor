import { useState, useCallback } from "react";
import { api } from "@/api/client";

export function useRules() {
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = useCallback(async (question: string, context?: any) => {
    setLoading(true);
    try {
      const result = await api.askRule(question, context);
      setAnswer(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { answer, loading, askQuestion, setAnswer };
}
