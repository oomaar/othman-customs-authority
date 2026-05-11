"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { parseBulkText } from "@/lib/bulkParse";
import { formatEGP } from "@/lib/format";
import type { ItemFormValues } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddMany: (items: ItemFormValues[]) => void;
};

const PLACEHOLDER = `Mouse | 120
Keyboard | 450
Headphones | 800`;

export function BulkAddModal({ open, onClose, onAddMany }: Props) {
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [ownerTouched, setOwnerTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setText("");
      setOwner("");
      setOwnerTouched(false);
    }
  }, [open]);

  const parsed = useMemo(() => parseBulkText(text), [text]);
  const validRows = parsed.filter((p) => p.ok);
  const invalidRows = parsed.filter((p) => !p.ok);
  const trimmedOwner = owner.trim();
  const ownerError = ownerTouched && !trimmedOwner ? "Owner is required" : "";
  const canSubmit = validRows.length > 0 && !!trimmedOwner;

  const handleSubmit = () => {
    if (!trimmedOwner) {
      setOwnerTouched(true);
      return;
    }
    if (validRows.length === 0) return;
    const items: ItemFormValues[] = validRows
      .map((p) => (p.ok ? { ...p.values, owner: trimmedOwner } : null))
      .filter((v): v is ItemFormValues => v !== null);
    onAddMany(items);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-add-title"
            className="relative w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="bulk-add-title"
              className="text-lg font-semibold tracking-tight"
            >
              Paste items
            </h2>
            <p className="mt-1 text-sm text-muted">
              One item per line:{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-mono">
                title | price
              </code>
              . Commas or tabs also work as separators.
            </p>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">
                Owner (applied to all pasted items)
              </span>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                onBlur={() => setOwnerTouched(true)}
                placeholder="Othman"
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              {ownerError && (
                <span className="mt-1 block text-xs text-red-500">
                  {ownerError}
                </span>
              )}
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">
                Items
              </span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={6}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none transition placeholder:text-muted focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>

            {parsed.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="h-3.5 w-3.5" />
                    {validRows.length} valid
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {invalidRows.length} invalid
                    </span>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background">
                  <ul className="divide-y divide-border">
                    {parsed.map((p) => (
                      <li
                        key={p.line}
                        className="flex items-start gap-2 px-3 py-1.5 text-xs"
                      >
                        <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-[10px] text-muted">
                          {p.line}
                        </span>
                        {p.ok ? (
                          <>
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                              {p.values.title}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">
                              {formatEGP(p.values.price)}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                            <span className="min-w-0 flex-1 text-red-500">
                              {p.error}
                            </span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                Add {validRows.length || ""} item
                {validRows.length === 1 ? "" : "s"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
