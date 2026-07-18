import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrepare } from "@/hooks/usePrepare";
import { AlertCircle, CheckCircle2, Clock, FileText, Download, Trash2 } from "lucide-react";

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
      <section aria-labelledby="prepare-heading" className="py-12 text-center">
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
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3 text-sm text-neutral-600" role="status" aria-live="polite">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          {presentItems.length} present
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {missingItems.length} missing
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {expiredItems.length} expired
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          <FileText className="h-3 w-3" aria-hidden="true" />
          {total} total
        </span>
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
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:outline-2 focus:outline-offset-2 focus:outline-brand-500"
                    aria-label={`Include ${item.item_name}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                    {item.notes && (
                      <p className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{item.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  missing
                </span>
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
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:outline-2 focus:outline-offset-2 focus:outline-brand-500"
                    aria-label={`Include ${item.item_name}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                    {item.notes && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{item.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  expired
                </span>
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
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:outline-2 focus:outline-offset-2 focus:outline-brand-500"
                    aria-label={`Include ${item.item_name}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                    {item.notes && (
                      <p className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{item.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  present
                </span>
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
          <Button onClick={assemble} disabled={assembling} aria-busy={assembling}>
            {assembling ? "Assembling..." : "Assemble Packet"}
          </Button>
          {packetResult && (
            <Button
              variant="primary"
              onClick={() => download(packetResult.packet_id)}
            >
              <Download className="mr-1 h-4 w-4" aria-hidden="true" />
              Download PDF
            </Button>
          )}
          {packetResult && (
            <Button
              variant="outline"
              onClick={() => setPacketResult(null)}
            >
              <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>

        {packetResult && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
            <div>
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
