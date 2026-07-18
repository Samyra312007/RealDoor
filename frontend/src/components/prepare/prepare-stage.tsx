import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrepare } from "@/hooks/usePrepare";

export function PrepareStage({ token }: { token: string | null }) {
  const {
    presentItems,
    missingItems,
    expiredItems,
    loading,
    assembling,
    packetResult,
    error,
    toggledItems,
    toggleItem,
    assemble,
    download,
    setPacketResult,
  } = usePrepare(token);

  const total = presentItems.length + missingItems.length + expiredItems.length;

  if (loading) {
    return (
      <section aria-labelledby="prepare-heading" className="text-center py-12">
        <p className="text-neutral-500">Loading checklist...</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="prepare-heading">
      <h2 id="prepare-heading" className="mb-6 text-2xl font-bold text-neutral-900">
        Stage 3: Prepare
      </h2>
      <p className="mb-6 text-neutral-600">
        Review your readiness checklist. Select items to include in your export packet.
        Your packet is downloaded to you — it is never auto-transmitted.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3 text-sm text-neutral-600">
        <Badge variant="success">{presentItems.length} present</Badge>
        <Badge variant="warning">{missingItems.length} missing</Badge>
        <Badge variant="error">{expiredItems.length} expired</Badge>
        <Badge variant="info">{total} total</Badge>
      </div>

      {missingItems.length > 0 && (
        <Card title="Missing Items" className="mb-4 border-amber-200">
          <p className="mb-3 text-xs text-amber-700">
            These items were not found in your uploaded documents. Consider uploading documentation.
          </p>
          <ul className="space-y-2" role="list">
            {missingItems.map((item) => (
              <li key={item.item_name} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={toggledItems.has(item.item_name)}
                    onChange={() => toggleItem(item.item_name)}
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    aria-label={`Include ${item.item_name}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                    {item.notes && (
                      <p className="text-xs text-amber-600">{item.notes}</p>
                    )}
                  </div>
                </div>
                <Badge variant="warning">missing</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {expiredItems.length > 0 && (
        <Card title="Expired Items" className="mb-4 border-red-200">
          <p className="mb-3 text-xs text-red-700">
            These documents may be out of date. Consider uploading current versions.
          </p>
          <ul className="space-y-2" role="list">
            {expiredItems.map((item) => (
              <li key={item.item_name} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={toggledItems.has(item.item_name)}
                    onChange={() => toggleItem(item.item_name)}
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    aria-label={`Include ${item.item_name}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                    {item.notes && (
                      <p className="text-xs text-red-600">{item.notes}</p>
                    )}
                  </div>
                </div>
                <Badge variant="error">expired</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {presentItems.length > 0 && (
        <Card title="Present Items" className="mb-4 border-green-200">
          <ul className="space-y-2" role="list">
            {presentItems.map((item) => (
              <li key={item.item_name} className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={toggledItems.has(item.item_name)}
                    onChange={() => toggleItem(item.item_name)}
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    aria-label={`Include ${item.item_name}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                    {item.notes && (
                      <p className="text-xs text-green-600">{item.notes}</p>
                    )}
                  </div>
                </div>
                <Badge variant="success">present</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {total === 0 && (
        <Card className="mb-4">
          <p className="text-sm text-neutral-500">
            No checklist items loaded. Upload documents in Stage 1 to see your readiness status.
          </p>
        </Card>
      )}

      <Card title="Export Packet" className="mb-6">
        <p className="mb-4 text-sm text-neutral-600">
          {toggledItems.size > 0
            ? `${toggledItems.size} item${toggledItems.size !== 1 ? "s" : ""} selected for export. `
            : "Toggle items above to include them, or leave empty to include all."}
          Assemble your confirmed fields and selected checklist items into a downloadable PDF.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={assemble} disabled={assembling}>
            {assembling ? "Assembling..." : "Assemble Packet"}
          </Button>
          {packetResult && (
            <Button
              variant="primary"
              onClick={() => download(packetResult.packet_id)}
            >
              Download PDF
            </Button>
          )}
          {packetResult && (
            <Button
              variant="outline"
              onClick={() => setPacketResult(null)}
            >
              Clear
            </Button>
          )}
        </div>

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
              This packet is for your records. It has NOT been transmitted
              to any property or agency.
            </p>
          </div>
        )}
      </Card>

      <Card title="Data Privacy" className="mb-6">
        <p className="text-xs text-neutral-500">
          All session data is encrypted at rest and auto-deleted after 24 hours.
          You can delete your session at any time using the "Delete Session" button
          in the header. The packet you download is your copy only.
        </p>
      </Card>
    </section>
  );
}
