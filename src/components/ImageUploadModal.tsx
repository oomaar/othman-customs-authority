"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  RotateCcw,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import { parseBulkText } from "@/lib/bulkParse";
import { formatEGP } from "@/lib/format";
import { normalizeOcrText, runOcr, type OcrProgress } from "@/lib/ocr";
import type { ItemFormValues } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddMany: (items: ItemFormValues[]) => void;
};

type Phase = "idle" | "scanning" | "ready" | "error";

export function ImageUploadModal({ open, onClose, onAddMany }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [rawOcrText, setRawOcrText] = useState("");
  const [view, setView] = useState<"cleaned" | "raw">("cleaned");
  const [owner, setOwner] = useState("");
  const [ownerTouched, setOwnerTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      reset();
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset() {
    setFile(null);
    setText("");
    setRawOcrText("");
    setView("cleaned");
    setOwner("");
    setOwnerTouched(false);
    setPhase("idle");
    setProgress(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(selected: File) {
    setFile(selected);
    setText("");
    setRawOcrText("");
    setPhase("scanning");
    setErrorMsg(null);
    setProgress({ status: "starting", progress: 0 });
    try {
      const raw = await runOcr(selected, (p) => setProgress(p));
      setRawOcrText(raw);
      const normalized = normalizeOcrText(raw);
      if (normalized) {
        setText(normalized);
        setView("cleaned");
      } else {
        // Extraction found nothing — show the raw OCR for manual cleanup.
        setText(raw);
        setView("raw");
      }
      setPhase("ready");
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "OCR failed");
    }
  }

  function loadView(next: "cleaned" | "raw") {
    if (next === view) return;
    if (next === "raw") {
      setText(rawOcrText);
    } else {
      const cleaned = normalizeOcrText(rawOcrText);
      setText(cleaned || rawOcrText);
    }
    setView(next);
  }

  const parsed = useMemo(() => parseBulkText(text), [text]);
  const validRows = parsed.filter((p) => p.ok);
  const invalidRows = parsed.filter((p) => !p.ok);
  const trimmedOwner = owner.trim();
  const ownerError = ownerTouched && !trimmedOwner ? "Owner is required" : "";
  const canSubmit =
    phase === "ready" && validRows.length > 0 && !!trimmedOwner;

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

  const progressPct = Math.round((progress?.progress ?? 0) * 100);

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
            aria-labelledby="scan-title"
            className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl"
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

            <h2 id="scan-title" className="text-lg font-semibold tracking-tight">
              Scan image
            </h2>
            <p className="mt-1 text-sm text-muted">
              Upload a receipt or order screenshot. OCR runs in your browser —
              review and edit the result before adding.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-lg border border-border bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Uploaded preview"
                      className="h-48 w-full object-contain"
                    />
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-black/80"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/40 text-muted transition hover:border-ring hover:text-foreground"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      Click to upload an image
                    </span>
                    <span className="text-[10px]">
                      Screenshot or photo, any format
                    </span>
                  </button>
                )}

                {phase === "scanning" && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {progress?.status ?? "scanning"} · {progressPct}%
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                      <motion.div
                        className="h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {phase === "error" && errorMsg && (
                  <div className="mt-3 flex items-start gap-1.5 text-xs text-red-500">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-foreground">
                  Owner (applied to all extracted items)
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

                <div className="mt-4 mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    Extracted text
                  </span>
                  {rawOcrText && (
                    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => loadView("cleaned")}
                        className={`rounded-full px-2 py-0.5 transition ${
                          view === "cleaned"
                            ? "bg-surface-muted text-foreground"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Cleaned
                      </button>
                      <button
                        type="button"
                        onClick={() => loadView("raw")}
                        className={`rounded-full px-2 py-0.5 transition ${
                          view === "raw"
                            ? "bg-surface-muted text-foreground"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Raw OCR
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    phase === "idle"
                      ? "Upload an image to extract text…"
                      : "title | price per line"
                  }
                  rows={6}
                  disabled={phase === "scanning"}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none transition placeholder:text-muted focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
                />
                {rawOcrText && view === "raw" && (
                  <button
                    type="button"
                    onClick={() => loadView("cleaned")}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted transition hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to cleaned output
                  </button>
                )}
              </label>
            </div>

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
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background">
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

            <div className="mt-5 flex items-center justify-between">
              <p className="hidden text-[11px] text-muted sm:flex sm:items-center sm:gap-1">
                <ScanLine className="h-3 w-3" />
                Edit the extracted text to fix any OCR mistakes.
              </p>
              <div className="flex flex-1 justify-end gap-2 sm:flex-none">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
