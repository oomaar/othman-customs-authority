"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, Plus, Save } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AddItemModal } from "@/components/AddItemModal";
import { OrderItemsList } from "@/components/OrderItemsList";
import { CustomsCalculator } from "@/components/CustomsCalculator";
import { OwnerGroups } from "@/components/OwnerGroups";
import type { ItemFormValues, OrderItem } from "@/lib/types";
import { formatEGP } from "@/lib/format";
import { exportOrderPdf } from "@/lib/pdf";
import { loadItems, saveItems } from "@/lib/storage";

export default function Home() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const saved = loadItems();
    if (saved && saved.length > 0) setItems(saved);
  }, []);

  const totalOrderPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price, 0),
    [items],
  );

  const totalCustoms = useMemo(
    () => items.reduce((sum, i) => sum + (i.calculatedCustoms ?? 0), 0),
    [items],
  );

  const addItem = (values: ItemFormValues) => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: values.title,
        price: values.price,
        owner: values.owner,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const calculate = (customsTotal: number) => {
    if (totalOrderPrice <= 0) return;
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        calculatedCustoms: (i.price / totalOrderPrice) * customsTotal,
      })),
    );
  };

  const handleSave = () => {
    saveItems(items);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1600);
  };

  const handleExport = () => {
    if (items.length === 0) return;
    exportOrderPdf(items);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Your order
            </h1>
            <p className="mt-1 text-sm text-muted">
              {items.length === 0
                ? "Add items to get started."
                : `${items.length} item${items.length === 1 ? "" : "s"} · ${formatEGP(totalOrderPrice)}`}
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </motion.section>

        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              key="actions"
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-4 flex flex-wrap gap-2"
            >
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-muted"
              >
                {justSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-muted"
              >
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <OrderItemsList items={items} onRemove={removeItem} />
        </motion.section>

        {items.length > 0 && (
          <motion.section
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <CustomsCalculator
              totalOrderPrice={totalOrderPrice}
              onCalculate={calculate}
            />

            {totalCustoms > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-4 py-3"
              >
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  Customs allocated across items
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatEGP(totalCustoms)}
                </span>
              </motion.div>
            )}
          </motion.section>
        )}

        {totalCustoms > 0 && (
          <div className="mt-8">
            <OwnerGroups items={items} />
          </div>
        )}
      </main>

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addItem}
      />
    </div>
  );
}
