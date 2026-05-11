"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import type { ItemFormValues } from "@/lib/types";
import { parseNumber } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (values: ItemFormValues) => void;
};

type FormState = {
  title: string;
  price: string;
  owner: string;
};

export function AddItemModal({ open, onClose, onAdd }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormState>({
    defaultValues: { title: "", price: "", owner: "" },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = handleSubmit((values) => {
    const price = parseNumber(values.price);
    if (price === null) return;
    onAdd({
      title: values.title.trim(),
      price,
      owner: values.owner.trim(),
    });
    reset();
    onClose();
  });

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-ring focus:ring-2 focus:ring-ring/30";

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
            aria-labelledby="add-item-title"
            className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
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
              id="add-item-title"
              className="text-lg font-semibold tracking-tight"
            >
              Add order item
            </h2>
            <p className="mt-1 text-sm text-muted">
              Title, price, and owner. Currency is EGP.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field label="Title" error={errors.title?.message}>
                <input
                  autoFocus
                  placeholder="Mouse"
                  className={inputClass}
                  {...register("title", {
                    required: "Title is required",
                    minLength: { value: 1, message: "Too short" },
                  })}
                />
              </Field>

              <Field label="Price (EGP)" error={errors.price?.message}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="120"
                  autoComplete="off"
                  className={inputClass}
                  {...register("price", {
                    required: "Price is required",
                    validate: (v) => {
                      const n = parseNumber(v);
                      if (n === null) return "Enter a valid number";
                      if (n <= 0) return "Price must be greater than 0";
                      return true;
                    },
                  })}
                />
              </Field>

              <Field label="Owner" error={errors.owner?.message}>
                <input
                  placeholder="Othman"
                  className={inputClass}
                  {...register("owner", {
                    required: "Owner is required",
                    minLength: { value: 1, message: "Too short" },
                  })}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  Add item
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      )}
    </label>
  );
}
