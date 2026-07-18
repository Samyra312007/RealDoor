import { useState, useCallback } from "react";
import { api } from "@/api/client";

export type Property = {
  property_name: string;
  address: string;
  cbsa_code: string;
  total_units: number;
  low_income_units: number;
  bedroom_studio: number;
  bedroom_1br: number;
  bedroom_2br: number;
  bedroom_3br: number;
  year_placed_in_service: number;
};

export type FmrData = {
  cbsa_code: string;
  cbsa_name: string;
  fair_market_rents: Record<string, number>;
  effective_date: string;
  context_note: string;
};

export function useDiscover() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stalenessNote, setStalenessNote] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [fmr, setFmr] = useState<FmrData | null>(null);
  const [fmrLoading, setFmrLoading] = useState(false);

  const search = useCallback(
    async (
      cbsa: string,
      minBedrooms?: number,
      maxBedrooms?: number,
      minUnits?: number
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listDiscoverProperties(
          cbsa,
          minBedrooms,
          maxBedrooms,
          minUnits
        );
        setProperties(data.properties);
        setTotalCount(data.total_count);
        setStalenessNote(data.staleness_note);
        setDisclaimer(data.disclaimer);
        return data;
      } catch (e: any) {
        setError(e.message);
        setProperties([]);
        setTotalCount(0);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadFmr = useCallback(async (cbsa: string) => {
    setFmrLoading(true);
    try {
      const data = await api.getFmrContext(cbsa);
      setFmr(data);
      return data;
    } catch {
      setFmr(null);
    } finally {
      setFmrLoading(false);
    }
  }, []);

  return {
    properties,
    totalCount,
    loading,
    error,
    stalenessNote,
    disclaimer,
    fmr,
    fmrLoading,
    search,
    loadFmr,
    setProperties,
    setError,
  };
}
