import { useState, useCallback } from "react";
import { api } from "@/api/client";

export function useCalculator() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const calculate = useCallback(
    async (income: number, hhSize: number, county: string) => {
      setLoading(true);
      try {
        const data = await api.calculate(income, hhSize, county);
        setResult(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const calculateFromProfile = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const data = await api.calculateFromProfile(token);
      setResult(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const explainCalculation = useCallback(async () => {
    if (!result) return;
    setExplaining(true);
    setExplanation(null);
    if (result.formula_steps) {
      setExplanation(result.formula_steps.join("\n"));
    }
    setExplaining(false);
  }, [result]);

  return {
    result,
    loading,
    explaining,
    explanation,
    calculate,
    calculateFromProfile,
    explainCalculation,
    setResult,
    setExplanation,
  };
}
