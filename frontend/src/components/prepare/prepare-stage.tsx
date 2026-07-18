import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePrepare, type ChecklistItemType } from "@/hooks/usePrepare";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText, Download, Trash2, Pencil, X, Save } from "lucide-react";

function ChecklistSection({
  title,
  items,
  icon,
  variant,
  toggledItems,
  onToggle,
}: {
  title: string;
  items: ChecklistItemType[];
  icon: React.ReactNode;
  variant: "success" | "warning" | "error";
  toggledItems: Set<string>;
  onToggle: (name: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Card title={title} className={`mb-4 border-${variant === "success" ? "green" : variant === "warning" ? "amber" : "red"}-200`}>
      {variant === "success" ? null : (
        <p className={`mb-3 text-xs text-${variant === "warning" ? "amber" : "red"}-700`}>
          {variant === "warning"
            ? "These items were not found in your uploaded documents. Consider uploading documentation."
            : "These documents may be out of date. Consider uploading current versions."}
        </p>
      )}
      <ul className="space-y-2" role="list">
        {items.map((item) => (
          <li key={item.item_name} className={`flex items-center justify-between rounded-lg border border-${variant === "success" ? "green" : variant === "warning" ? "amber" : "red"}-100 bg-${variant === "success" ? "green" : variant === "warning" ? "amber" : "red"}-50/50 p-3`}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={toggledItems.has(item.item_name)}
                onChange={() => onToggle(item.item_name)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:outline-2 focus:outline-offset-2 focus:outline-brand-500"
                aria-label={`Include ${item.item_name}`}
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">{item.item_name}</p>
                {item.notes && (
                  <p className={`flex items-center gap-1 text-xs text-${variant === "success" ? "green" : variant === "warning" ? "amber" : "red"}-600`}>
                    {variant === "success" ? <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" /> : variant === "warning" ? <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" /> : <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    <span>{item.notes}</span>
                  </p>
                )}
              </div>
            </div>
            <Badge variant={variant}>{variant}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

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
  } = usePrepare(token);

  const total = presentItems.length + missingItems.length + expiredItems.length;
  const [showProfileEdit, setShowProfileEdit] = useState(false);

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

      <ChecklistSection title="Missing Items" items={missingItems} icon={<AlertCircle />} variant="warning" toggledItems={toggledItems} onToggle={toggleItem} />
      <ChecklistSection title="Expired Items" items={expiredItems} icon={<Clock />} variant="error" toggledItems={toggledItems} onToggle={toggleItem} />
      <ChecklistSection title="Present Items" items={presentItems} icon={<CheckCircle2 />} variant="success" toggledItems={toggledItems} onToggle={toggleItem} />

      {total === 0 && (
        <Card className="mb-4">
          <p className="text-sm text-neutral-500">
            No checklist items loaded. Upload documents in Stage 1 to see your readiness status.
          </p>
        </Card>
      )}

      {profile && (
        <Card title="Confirmed Profile" className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-neutral-500">
              Review and edit your confirmed fields before export. Changes update your profile in real time.
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
                <div key={key} className="flex items-center justify-between rounded border border-neutral-100 bg-neutral-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500">{label}</p>
                    {isEditing ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="mt-1 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(key);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <p className="truncate text-sm font-medium text-neutral-900">{String(profile[key])}</p>
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
            <Button variant="primary" onClick={() => download(packetResult.packet_id)}>
              <Download className="mr-1 h-4 w-4" aria-hidden="true" />
              Download PDF
            </Button>
          )}
          {packetResult && (
            <Button variant="outline" onClick={() => setPacketResult(null)}>
              <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>

        {packetResult && (
          <div role="status" aria-live="polite" className="mt-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-green-800">Packet ready</p>
              <p className="mt-1 text-xs text-green-700">
                Packet ID: {packetResult.packet_id} | Fields included: {packetResult.fields_included}
              </p>
              <p className="mt-2 text-xs text-green-600">
                This packet is for your records. It has NOT been transmitted to any property or agency.
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
