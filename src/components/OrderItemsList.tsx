"use client";

import { AnimatePresence, motion } from "motion/react";
import { Trash2, User, Package } from "lucide-react";
import type { OrderItem } from "@/lib/types";
import { formatEGP } from "@/lib/format";

type Props = {
  items: OrderItem[];
  onRemove: (id: string) => void;
};

export function OrderItemsList({ items, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted">
          <Package className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">No items yet</p>
        <p className="mt-1 max-w-xs text-xs text-muted">
          Add items with title, price, and owner. Then enter the total customs
          to split it proportionally.
        </p>
      </motion.div>
    );
  }

  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-ring/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted">
                    {formatEGP(item.price)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <User className="h-3 w-3" />
                  {item.owner}
                </p>
              </div>

              <button
                aria-label={`Remove ${item.title}`}
                onClick={() => onRemove(item.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-muted hover:text-red-500 focus:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence>
              {item.calculatedCustoms !== undefined && (
                <motion.div
                  key="customs"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                      Item customs
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatEGP(item.calculatedCustoms)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
