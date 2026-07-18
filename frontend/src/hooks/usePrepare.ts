import { useState, useCallback, useEffect } from "react";
import { api } from "@/api/client";

export type ChecklistItemType = {
  item_name: string;
  status: "present" | "missing" | "expired";
  document_supported: boolean;
  notes?: string;
};

export function usePrepare(token: string | null) {
  const [checklist, setChecklist] = useState<ChecklistItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [packetResult, setPacketResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggledItems, setToggledItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .getChecklist("LIHTC", token)
      .then((items) => {
        setChecklist(items);
        setToggledItems(new Set(items.filter((i) => i.status === "present").map((i) => i.item_name)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleItem = useCallback((itemName: string) => {
    setToggledItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  }, []);

  const assemble = useCallback(async () => {
    if (!token) return;
    setAssembling(true);
    setError(null);
    try {
      const result = await api.assemblePacket(token, Array.from(toggledItems));
      setPacketResult(result);
      return result;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setAssembling(false);
    }
  }, [token, toggledItems]);

  const download = useCallback(
    async (packetId: string) => {
      if (!token) return;
      try {
        await api.downloadPacket(packetId, token);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [token]
  );

  const presentItems = checklist.filter((i) => i.status === "present");
  const missingItems = checklist.filter((i) => i.status === "missing");
  const expiredItems = checklist.filter((i) => i.status === "expired");

  return {
    checklist,
    loading,
    assembling,
    packetResult,
    error,
    presentItems,
    missingItems,
    expiredItems,
    toggledItems,
    toggleItem,
    assemble,
    download,
    setPacketResult,
  };
}
