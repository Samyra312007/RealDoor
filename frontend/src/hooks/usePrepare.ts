import { useState, useCallback, useEffect } from "react";
import { api } from "@/api/client";

export type ChecklistItemType = {
  item_name: string;
  status: "present" | "missing" | "expired";
  document_supported: boolean;
  notes?: string;
};

const PROFILE_LABELS: Record<string, string> = {
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

export function usePrepare(token: string | null) {
  const [checklist, setChecklist] = useState<ChecklistItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [packetResult, setPacketResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggledItems, setToggledItems] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.getChecklist("LIHTC", token),
      api.getSessionProfile(token).catch(() => ({ profile: null })),
    ])
      .then(([items, sessionData]) => {
        setChecklist(items);
        setProfile(sessionData.profile);
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

  const startEdit = useCallback((fieldName: string, currentValue: any) => {
    setEditingField(fieldName);
    setEditValue(String(currentValue ?? ""));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(
    async (fieldName: string) => {
      if (!token || !profile) return;
      const updated = { ...profile, [fieldName]: editValue };
      try {
        await api.updateProfile({ session_token: token, [fieldName]: editValue });
        setProfile(updated);
        setEditingField(null);
        setEditValue("");
      } catch (e: any) {
        setError(e.message);
      }
    },
    [token, profile, editValue]
  );

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
    profile,
    editingField,
    editValue,
    toggleItem,
    startEdit,
    cancelEdit,
    saveEdit,
    setEditValue,
    assemble,
    download,
    setPacketResult,
    PROFILE_LABELS,
  };
}
