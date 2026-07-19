import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/lib/session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { usePrepare } from "@/hooks/usePrepare";
import {
  CheckCircle2, Clock, AlertCircle, FileText, Download,
  Pencil, X, Save, Trash2, ArrowLeft,
} from "lucide-react";

const MISSING_LINKS: Record<string, string> = {
  "government id": "has_government_id",
  "photo id": "has_government_id",
  "proof of income": "annual_income",
  "income verification": "annual_income",
  "pay stubs": "annual_income",
  "lease agreement": "current_address",
  "proof of address": "current_address",
  "voucher": "has_voucher",
  "voucher documentation": "has_voucher",
  "section 8": "voucher_type",
  "household income": "annual_income",
  "household size": "household_size",
};

function matchProfileField(itemName: string): string | null {
  const lower = itemName.toLowerCase();
  for (const [key, field] of Object.entries(MISSING_LINKS)) {
    if (lower.includes(key)) return field;
  }
  return null;
}

function DeleteDialog({
  open,
  onConfirm,
  onCancel,
  deleting,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm border border-line bg-paper p-6 shadow-lg">
        <h3 id="delete-dialog-title" className="mb-2 font-display text-base font-semibold text-ink">
          Delete all your data?
        </h3>
        <p className="mb-4 font-sans text-sm leading-relaxed text-ink/60">
          This permanently erases your profile, uploaded documents, and any
          packets you&rsquo;ve prepared. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Keep my data
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={deleting} aria-busy={deleting}>
            {deleting ? "Deleting\u2026" : "Delete everything"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PacketPreview({
  presentItems,
  missingItems,
  expiredItems,
  toggledItems,
}: {
  presentItems: { item_name: string; notes?: string }[];
  missingItems: { item_name: string; notes?: string }[];
  expiredItems: { item_name: string; notes?: string }[];
  toggledItems: Set<string>;
}) {
  const included = [
    ...presentItems.filter((i) => toggledItems.has(i.item_name)),
    ...missingItems.filter((i) => toggledItems.has(i.item_name)),
    ...expiredItems.filter((i) => toggledItems.has(i.item_name)),
  ];

  if (included.length === 0) return null;

  return (
    <div className="border border-line bg-paper/30 p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-ink/30" aria-hidden="true" />
        <p className="font-sans text-xs font-medium uppercase tracking-wider text-ink/40">
          Packet preview
        </p>
        <span className="font-mono text-2xs text-ink/30">{included.length} items</span>
      </div>
      <div className="space-y-1">
        {presentItems
          .filter((i) => toggledItems.has(i.item_name))
          .map((i) => (
            <div key={i.item_name} className="flex items-center gap-2 border-l-2 border-confirmed/40 pl-2">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-confirmed" aria-hidden="true" />
              <span className="font-mono text-2xs text-ink/50">{i.item_name}</span>
            </div>
          ))}
        {missingItems
          .filter((i) => toggledItems.has(i.item_name))
          .map((i) => (
            <div key={i.item_name} className="flex items-center gap-2 border-l-2 border-review/40 pl-2">
              <AlertCircle className="h-3 w-3 shrink-0 text-review" aria-hidden="true" />
              <span className="font-mono text-2xs text-ink/40">{i.item_name}</span>
            </div>
          ))}
        {expiredItems
          .filter((i) => toggledItems.has(i.item_name))
          .map((i) => (
            <div key={i.item_name} className="flex items-center gap-2 border-l-2 border-expired/40 pl-2">
              <Clock className="h-3 w-3 shrink-0 text-expired" aria-hidden="true" />
              <span className="font-mono text-2xs text-ink/40">{i.item_name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ChecklistColumn({
  title,
  icon,
  items,
  variant,
  toggledItems,
  onToggle,
  profile,
}: {
  title: string;
  icon: React.ReactNode;
  items: { item_name: string; status: string; notes?: string }[];
  variant: "confirmed" | "expired" | "review";
  toggledItems: Set<string>;
  onToggle: (name: string) => void;
  profile: Record<string, any> | null;
}) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const headerLabel =
    variant === "confirmed" ? "Present" :
    variant === "expired" ? "Expired" :
    "Missing";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        {icon}
        <p className="font-sans text-xs font-medium uppercase tracking-wider text-ink/50">
          {headerLabel}
        </p>
        <span className="font-mono text-2xs text-ink/30">{items.length}</span>
      </div>
      {items.map((item) => {
        const included = toggledItems.has(item.item_name);
        const profileField = variant === "review" ? matchProfileField(item.item_name) : null;

        return (
          <div
            key={item.item_name}
            className={`border p-3 transition-colors ${
              variant === "confirmed" ? "border-confirmed/20" :
              variant === "expired" ? "border-expired/20" :
              "border-review/20"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={included}
                  onChange={() => onToggle(item.item_name)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-brass"
                  aria-label={`Include ${item.item_name} in packet`}
                />
                <div>
                  <p className="font-sans text-sm font-medium text-ink">{item.item_name}</p>

                  {variant === "confirmed" && item.notes && (
                    <p className="mt-0.5 font-mono text-2xs text-confirmed/60">{item.notes}</p>
                  )}

                  {variant === "expired" && (
                    <div className="mt-1 space-y-0.5">
                      {item.notes ? (
                        <p className="font-mono text-2xs text-expired/70">{item.notes}</p>
                      ) : (
                        <p className="font-mono text-2xs text-expired/50">
                          This document may be out of date
                        </p>
                      )}
                    </div>
                  )}

                  {variant === "review" && (
                    <p className="mt-0.5 font-mono text-2xs text-review/60">
                      {item.notes || "Not found in uploaded documents"}
                    </p>
                  )}
                </div>
              </label>

              <LedgerStamp
                variant={variant}
                className="shrink-0 scale-[0.85] origin-top-right"
              >
                {headerLabel}
              </LedgerStamp>
            </div>

            {/* Missing items: link to profile */}
            {variant === "review" && profileField && profile && (
              <div className="mt-2 border-t border-review/10 pt-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="inline-flex items-center gap-1 font-mono text-2xs text-review/60 transition-colors hover:text-review focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  <span>Fill this in on the Profile page</span>
                </button>
              </div>
            )}

            {/* Expired items: expandable date detail */}
            {variant === "expired" && item.notes && (
              <button
                onClick={() => setExpandedId(expandedId === item.item_name ? null : item.item_name)}
                className="mt-1 inline-flex items-center gap-1 font-mono text-2xs text-ink/30 transition-colors hover:text-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass rounded"
                aria-expanded={expandedId === item.item_name}
              >
                <span>{expandedId === item.item_name ? "Less" : "Why?"}</span>
              </button>
            )}

            {expandedId === item.item_name && variant === "expired" && (
              <div className="mt-2 border-t border-expired/10 pt-2">
                <p className="font-mono text-2xs text-ink/40 leading-relaxed">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PreparePage() {
  const { token, deleteSession } = useSessionContext();
  const navigate = useNavigate();
  const {
    presentItems, missingItems, expiredItems, loading, assembling,
    packetResult, error, toggledItems, profile, editingField, editValue,
    toggleItem, startEdit, cancelEdit, saveEdit, setEditValue,
    assemble, download, setPacketResult, PROFILE_LABELS,
  } = usePrepare(token);

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPacketPreview, setShowPacketPreview] = useState(false);

  const total = presentItems.length + missingItems.length + expiredItems.length;
  const hasItems = total > 0;

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteSession();
      navigate("/");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [deleteSession, navigate]);

  const handleAssemble = useCallback(async () => {
    try {
      await assemble();
      setShowPacketPreview(true);
    } catch {
      /* error state handled by hook */
    }
  }, [assemble]);

  if (loading) {
    return (
      <section aria-labelledby="prepare-heading" className="py-12 text-center">
        <p className="font-sans text-sm text-ink/50">Loading your checklist\u2026</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="prepare-heading">
      <h2 id="prepare-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 03 \u2014 Prepare
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Review what you have, what needs updating, and what&rsquo;s missing.
        Then assemble and download your paperwork packet.
      </p>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 border border-expired/30 bg-expired/5 p-3 font-sans text-sm text-expired">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary row */}
      {hasItems && (
        <div className="mb-6 flex flex-wrap gap-3" role="status" aria-live="polite">
          <span className="inline-flex items-center gap-1.5 border border-confirmed/30 px-2.5 py-1 font-mono text-2xs font-medium text-confirmed">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {presentItems.length} present
          </span>
          <span className="inline-flex items-center gap-1.5 border border-expired/30 px-2.5 py-1 font-mono text-2xs font-medium text-expired">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {expiredItems.length} expired
          </span>
          <span className="inline-flex items-center gap-1.5 border border-review/30 px-2.5 py-1 font-mono text-2xs font-medium text-review">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {missingItems.length} missing
          </span>
        </div>
      )}

      {/* Three-column checklist */}
      {hasItems && (
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <ChecklistColumn
            title="Present"
            icon={<CheckCircle2 className="h-4 w-4 text-confirmed" aria-hidden="true" />}
            items={presentItems}
            variant="confirmed"
            toggledItems={toggledItems}
            onToggle={toggleItem}
            profile={profile}
          />
          <ChecklistColumn
            title="Expired"
            icon={<Clock className="h-4 w-4 text-expired" aria-hidden="true" />}
            items={expiredItems}
            variant="expired"
            toggledItems={toggledItems}
            onToggle={toggleItem}
            profile={profile}
          />
          <ChecklistColumn
            title="Missing"
            icon={<AlertCircle className="h-4 w-4 text-review" aria-hidden="true" />}
            items={missingItems}
            variant="review"
            toggledItems={toggledItems}
            onToggle={toggleItem}
            profile={profile}
          />
        </div>
      )}

      {!hasItems && (
        <div className="mb-8 border border-line bg-line/20 p-6 text-center">
          <p className="font-sans text-sm text-ink/50">
            No checklist items yet. Upload documents in the Profile stage to see your readiness status.
          </p>
        </div>
      )}

      {/* Packet preview panel */}
      {hasItems && (
        <div className="mb-6">
          <button
            onClick={() => setShowPacketPreview(!showPacketPreview)}
            className="flex w-full items-center justify-between border border-line bg-line/20 px-4 py-2.5 font-sans text-xs font-medium text-ink/60 transition-colors hover:bg-line/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            aria-expanded={showPacketPreview}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Preview packet</span>
            </span>
            <span className="font-mono text-2xs text-ink/30">
              {toggledItems.size} of {total} items selected
            </span>
          </button>
          {showPacketPreview && (
            <div className="border border-t-0 border-line">
              <PacketPreview
                presentItems={presentItems}
                missingItems={missingItems}
                expiredItems={expiredItems}
                toggledItems={toggledItems}
              />
              {toggledItems.size === 0 && (
                <div className="p-4 text-center">
                  <p className="font-mono text-2xs text-ink/30">
                    Toggle items above to include them in the packet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Profile edit (compact) */}
      {profile && (
        <div className="mb-6">
          <button
            onClick={() => setShowProfileEdit(!showProfileEdit)}
            className="flex w-full items-center justify-between border border-line bg-line/20 px-4 py-2.5 font-sans text-xs font-medium text-ink/60 transition-colors hover:bg-line/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            aria-expanded={showProfileEdit}
          >
            <span className="flex items-center gap-2">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              <span>Edit confirmed profile</span>
            </span>
          </button>
          {showProfileEdit && (
            <div className="border border-t-0 border-line p-4">
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
                          <p className="truncate font-mono text-sm font-medium text-ink">
                            {String(profile[key])}
                          </p>
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
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(key, profile[key])} aria-label={`Edit ${label}`}>
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export section — ledger-stamp CTA */}
      <div className="mb-8 border border-line bg-paper">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-sans text-sm text-ink/60">
              {toggledItems.size > 0
                ? `${toggledItems.size} item${toggledItems.size !== 1 ? "s" : ""} selected`
                : "Toggle items above to include them in the packet"}
            </p>
          </div>

          {!packetResult ? (
            <button
              onClick={handleAssemble}
              disabled={assembling || toggledItems.size === 0}
              className="inline-flex items-center gap-3 rounded-sm border-2 border-brass px-6 py-3 font-display text-base font-semibold text-brass transition-colors hover:bg-brass/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:pointer-events-none disabled:opacity-40"
              aria-busy={assembling}
            >
              {assembling ? "Assembling\u2026" : "Assemble paperwork packet"}
            </button>
          ) : (
            <div className="space-y-4">
              <div role="status" aria-live="polite" className="sr-only">
                Packet ready. {toggledItems.size} item{toggledItems.size !== 1 ? "s" : ""} included.
              </div>
              <div className="flex items-start gap-3 border border-confirmed/30 bg-confirmed/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-confirmed" aria-hidden="true" />
                <div>
                  <LedgerStamp variant="confirmed" className="mb-2 text-xs">
                    Packet ready
                  </LedgerStamp>
                  <p className="font-mono text-2xs text-confirmed/70">
                    Packet ID: {packetResult.packet_id}
                  </p>
                  <p className="mt-2 font-sans text-2xs text-confirmed/60">
                    This packet is for your records. It has NOT been transmitted to any property or agency.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => download(packetResult.packet_id)}
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-brass bg-brass px-6 py-3 font-display text-base font-semibold text-paper transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  Download PDF
                </button>
                <Button variant="outline" onClick={() => navigate("/profile")}>
                  Start over
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete all my data — quieter, directly below export */}
        <div className="border-t border-line px-6 py-3">
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-ink/30 transition-colors hover:text-expired focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expired rounded"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Delete all my data</span>
          </button>
        </div>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        deleting={deleting}
      />
    </section>
  );
}
