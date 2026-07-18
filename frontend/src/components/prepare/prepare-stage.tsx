import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";

export function PrepareStage({ token }: { token: string | null }) {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [packetResult, setPacketResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getChecklist("LIHTC", token).then(setChecklist).catch(() => {});
  }, [token]);

  const handleAssemble = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await api.assemblePacket(token, []);
      setPacketResult(result);
    } finally {
      setLoading(false);
    }
  };

  const missingItems = checklist.filter((i) => i.status === "missing").length;
  const presentItems = checklist.filter((i) => i.status === "present").length;

  return (
    <section aria-labelledby="prepare-heading">
      <h2 id="prepare-heading" className="mb-6 text-2xl font-bold text-neutral-900">
        Stage 3: Prepare
      </h2>
      <p className="mb-6 text-neutral-600">
        Review your checklist, see what's missing, then assemble and export your packet.
        Your packet is downloaded to you — it is never auto-transmitted.
      </p>

      <Card title="Document Checklist" className="mb-6">
        <p className="mb-4 text-sm text-neutral-600">
          <span className="font-medium">{presentItems}</span> present,{" "}
          <span className="font-medium">{missingItems}</span> missing
        </p>
        <ul className="space-y-2" role="list">
          {checklist.map((item) => (
            <li
              key={item.item_name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`text-lg ${
                    item.status === "present" ? "text-green-600" : "text-neutral-300"
                  }`}
                >
                  {item.status === "present" ? "✓" : "○"}
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                  {item.notes && (
                    <p className="text-xs text-amber-600">{item.notes}</p>
                  )}
                </div>
              </div>
              <Badge
                variant={item.status === "present" ? "success" : "warning"}
              >
                {item.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Export Packet" className="mb-6">
        <p className="mb-4 text-sm text-neutral-600">
          Assemble all confirmed fields into a downloadable packet for your records.
        </p>
        <Button onClick={handleAssemble} disabled={loading}>
          {loading ? "Assembling..." : "Assemble & Export Packet"}
        </Button>

        {packetResult && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4"
          >
            <p className="text-sm font-medium text-green-800">Packet ready</p>
            <p className="mt-1 text-xs text-green-700">
              Packet ID: {packetResult.packet_id} | Fields included:{" "}
              {packetResult.fields_included}
            </p>
            <p className="mt-2 text-xs text-green-600">
              This packet has been downloaded to your device. It has NOT been transmitted
              to any property or agency.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
