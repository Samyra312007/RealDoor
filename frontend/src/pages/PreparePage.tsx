import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { usePrepare } from "@/hooks/usePrepare";
import { useSessionContext } from "@/lib/session-context";
import { AlertCircle, CheckCircle2, Clock, FileText, Download, Pencil, X, Save } from "lucide-react";

function ChecklistSection({
  title,
  items,
  variant,
  toggledItems,
  onToggle,
}: {
  title: string;
  items: { item_name: string; status: string; notes?: string }[];
  variant: "confirmed" | "review" | "expired";
  toggledItems: Set<string>;
  onToggle: (name: string) => void;
}) {
  if (items.length === 0) return null;

  const iconMap = {
    confirmed: <CheckCircle2 className="h-4 w-4 shrink-0 text-confirmed" aria-hidden="true" />,
    review: <AlertCircle className="h-4 w-4 shrink-0 text-review" aria-hidden="true" />,
    expired: <Clock className="h-4 w-4 shrink-0 text-expired" aria-hidden="true" />,
  };

  return (
    <Card title={title} className="mb-4">
      <ul className="space-y-2" role="list">
        {items.map((item) => (
          <li key={item.item_name} className="flex items-center justify-between border border-line bg-line/20 p-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={toggledItems.has(item.item_name)}
                onChange={() => onToggle(item.item_name)}
                className="h-4 w-4 accent-brass"
                aria-label={`Include ${item.item_name}`}
              />
              <div>
                <p className="font-sans text-sm font-medium text-ink">{item.item_name}</p>
                {item.notes && (
                  <p className="flex items-center gap-1 font-mono text-2xs text-ink/50">
                    {iconMap[variant]}
                    <span>{item.notes}</span>
                  </p>
                )}
              </div>
            </div>
            <LedgerStamp variant={variant}>{variant}</LedgerStamp>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function PreparePage() {
  const { token } = useSessionContext();
  const {
    presentItems, missingItems, expiredItems, loading, assembling,
    packetResult, error, toggledItems, profile, editingField, editValue,
    toggleItem, startEdit, cancelEdit, saveEdit, setEditValue,
    assemble, download, setPacketResult, PROFILE_LABELS,
  } = usePrepare(token);

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const total = presentItems.length + missingItems.length + expiredItems.length;

  if (loading) {
    return (
      <section aria-labelledby="prepare-heading" className="py-12 text-center">
        <p className="font-sans text-sm text-ink/50">Loading checklist...</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="prepare-heading">
      <h2 id="prepare-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 03 — Prepare
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Review your readiness checklist. Select items to include in your export packet.
        Your packet is downloaded to you — it is never auto-transmitted.
      </p>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 border border-expired/30 bg-expired/5 p-3 font-sans text-sm text-expired">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3" role="status" aria-live="polite">
        <span className="inline-flex items-center gap-1 border border-confirmed/30 px-2 py-0.5 font-mono text-2xs font-medium text-confirmed">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          {presentItems.length} present
        </span>
        <span className="inline-flex items-center gap-1 border border-review/30 px-2 py-0.5 font-mono text-2xs font-medium text-review">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {missingItems.length} missing
        </span>
        <span className="inline-flex items-center gap-1 border border-expired/30 px-2 py-0.5 font-mono text-2xs font-medium text-expired">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {expiredItems.length} expired
        </span>
        <span className="inline-flex items-center gap-1 border border-line px-2 py-0.5 font-mono text-2xs font-medium text-ink/50">
          <FileText className="h-3 w-3" aria-hidden="true" />
          {total} total
        </span>
      </div>

      <ChecklistSection title="Missing items" items={missingItems} variant="review" toggledItems={toggledItems} onToggle={toggleItem} />
      <ChecklistSection title="Expired items" items={expiredItems} variant="expired" toggledItems={toggledItems} onToggle={toggleItem} />
      <ChecklistSection title="Present items" items={presentItems} variant="confirmed" toggledItems={toggledItems} onToggle={toggleItem} />

      {total === 0 && (
        <Card className="mb-4">
          <p className="font-sans text-sm text-ink/50">
            No checklist items loaded. Upload documents in the Profile stage to see your readiness status.
          </p>
        </Card>
      )}

      {profile && (
        <Card title="Confirmed profile" className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-2xs text-ink/40">
              Review and edit your confirmed fields before export.
            </p>
            <Button size="sm" variant="ghost" onClick={() => setShowProfileEdit(!showProfileEdit)} aria-expanded={showProfileEdit}>
              <Pencil className="mr-1 h-3 w-3" aria-hidden="true" />
              {showProfileEdit ? "Done" : "Edit"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(PROFILE_LABELS).map(([key, label]) => {
              if (profile[key] === undefined || profile[key] === null) return null;
              const isEditing = editingField === key;
              return (
                <div key={key} className="flex items-center justify-between border border-line bg-line/20 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-2xs text-ink/40">{label}</p>
                    {isEditing ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="mt-1 h-8 font-mono text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(key);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <p className="truncate font-mono text-sm font-medium text-ink">{String(profile[key])}</p>
                    )}
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="primary" onClick={() => saveEdit(key)} aria-label={`Save ${label}`}>
                          <Save className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit} aria-label="Cancel">
                          <X className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </>
                    ) : showProfileEdit ? (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(key, profile[key])} aria-label={`Edit ${label}`}>
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="Export packet" className="mb-6">
        <p className="mb-4 font-sans text-sm text-ink/60">
          {toggledItems.size > 0
            ? `${toggledItems.size} item${toggledItems.size !== 1 ? "s" : ""} selected for export. `
            : "Toggle items above to include them, or leave empty to include all."}
          Assemble your confirmed fields and selected checklist items into a downloadable PDF.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={assemble} disabled={assembling} aria-busy={assembling}>
            {assembling ? "Assembling..." : "Assemble packet"}
          </Button>
          {packetResult && (
            <Button variant="primary" onClick={() => download(packetResult.packet_id)}>
              <Download className="mr-1 h-4 w-4" aria-hidden="true" />
              Download PDF
            </Button>
          )}
          {packetResult && (
            <Button variant="outline" onClick={() => setPacketResult(null)}>
              Clear
            </Button>
          )}
        </div>

        {packetResult && (
          <div role="status" aria-live="polite" className="mt-4 flex items-start gap-3 border border-confirmed/30 bg-confirmed/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-confirmed" aria-hidden="true" />
            <div>
              <LedgerStamp variant="confirmed" className="mb-2">Packet ready</LedgerStamp>
              <p className="font-mono text-2xs text-confirmed/70">
                Packet ID: {packetResult.packet_id} | Fields: {packetResult.fields_included}
              </p>
              <p className="mt-2 font-sans text-2xs text-confirmed/60">
                This packet is for your records. It has NOT been transmitted to any property or agency.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card title="Data privacy">
        <p className="font-mono text-2xs text-ink/40 leading-relaxed">
          All session data is encrypted at rest and auto-deleted after 24 hours.
          You can delete your session at any time using the button in the top bar.
          The packet you download is your copy only — it is never stored or transmitted elsewhere.
        </p>
      </Card>
    </section>
  );
}
