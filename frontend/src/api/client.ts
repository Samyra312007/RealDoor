const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    throw new Error(
      typeof detail === "string" ? detail :
      detail?.message ? detail.message :
      err.message ? err.message :
      res.statusText || "Request failed"
    );
  }
  return res.json();
}

export const api = {
  createSession: () =>
    request<{ session_token: string; message: string }>("/session/create", { method: "POST" }),

  getSessionInfo: (token: string) =>
    request<any>(`/session/info?token=${encodeURIComponent(token)}`),

  getSessionProfile: (token: string) =>
    request<{ session_token: string; profile: Record<string, any> }>(`/session/profile?token=${encodeURIComponent(token)}`),

  deleteSession: (token: string) =>
    request<{ message: string }>(`/session/delete?token=${encodeURIComponent(token)}`, { method: "DELETE" }),

  getSessionLog: (token: string) =>
    request<{ session_token: string; consent_log: any[]; total_actions: number }>(`/session/${encodeURIComponent(token)}/log`),

  extractDocument: async (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("session_token", token);
    const res = await fetch(`${BASE_URL}/extract/?session_token=${encodeURIComponent(token)}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail = err.detail;
      throw new Error(
        typeof detail === "string" ? detail :
        detail?.message ? detail.message :
        err.message ? err.message :
        "We couldn\u2019t read this file \u2014 try a clearer photo or a PDF."
      );
    }
    return res.json();
  },

  confirmField: (token: string, fieldName: string, correctedValue?: string) =>
    request<any>("/confirm/", {
      method: "POST",
      body: JSON.stringify({
        session_token: token,
        field_name: fieldName,
        corrected_value: correctedValue || null,
        confirmed: true,
      }),
    }),

  updateProfile: (profile: any) =>
    request<any>("/confirm/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  askRule: (question: string, sessionToken?: string) =>
    request<any>("/rules/ask", {
      method: "POST",
      body: JSON.stringify({ question, session_token: sessionToken || "" }),
    }),

  calculate: (annualIncome: number, householdSize: number, countyOrCbsa: string) =>
    request<any>("/calc/", {
      method: "POST",
      body: JSON.stringify({
        annual_income: annualIncome,
        household_size: householdSize,
        county_or_cbsa: countyOrCbsa,
      }),
    }),

  calculateFromProfile: (sessionToken: string) =>
    request<any>("/calc/from-profile", {
      method: "POST",
      body: JSON.stringify({ session_token: sessionToken }),
    }),

  getChecklist: (program: string, token: string) =>
    request<any[]>(`/checklist/?program=${program}&session_token=${encodeURIComponent(token)}`),

  assemblePacket: (token: string, includeFields: string[]) =>
    request<any>("/packet/assemble", {
      method: "POST",
      body: JSON.stringify({ session_token: token, include_fields: includeFields }),
    }),

  downloadPacket: async (packetId: string, token: string) => {
    const res = await fetch(`${BASE_URL}/packet/download/${packetId}?session_token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail?.message || err.detail || "Download failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RealDoor_packet_${packetId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return blob;
  },

  deletePacket: (packetId: string, token: string) =>
    request<{ message: string }>(`/packet/${packetId}?session_token=${encodeURIComponent(token)}`, { method: "DELETE" }),

  getPackets: (token: string) =>
    request<{ session_token: string; packets: any[] }>(`/session/${encodeURIComponent(token)}/packets`),

  listDiscoverProperties: (cbsa: string, minBedrooms?: number, maxBedrooms?: number, minUnits?: number) => {
    const params = new URLSearchParams({ cbsa });
    if (minBedrooms !== undefined) params.set("min_bedrooms", String(minBedrooms));
    if (maxBedrooms !== undefined) params.set("max_bedrooms", String(maxBedrooms));
    if (minUnits !== undefined) params.set("min_units", String(minUnits));
    return request<{
      properties: any[];
      total_count: number;
      staleness_note: string;
      disclaimer: string;
      filters_applied: any;
    }>(`/discover/properties?${params.toString()}`);
  },

  getDiscoverCbsaCodes: () =>
    request<{ codes: string[] }>("/discover/codes"),

  getFmrContext: (cbsa: string) =>
    request<{
      cbsa_code: string;
      cbsa_name: string;
      fair_market_rents: Record<string, number>;
      effective_date: string;
      context_note: string;
    }>(`/fmr/?cbsa=${encodeURIComponent(cbsa)}`),
};
