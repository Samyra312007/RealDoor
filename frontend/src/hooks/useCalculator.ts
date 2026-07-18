import { useState, useCallback } from "react";
import { api } from "@/api/client";

export function useCalculator() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  return { result, loading, calculate, setResult };
}
