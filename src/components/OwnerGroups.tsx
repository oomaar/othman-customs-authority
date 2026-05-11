"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { User } from "lucide-react";
import type { OrderItem } from "@/lib/types";
import { formatEGP } from "@/lib/format";

type OwnerGroup = {
  owner: string;
  items: OrderItem[];
  priceTotal: number;
  customsTotal: number;
};

type Props = {
  items: OrderItem[];
};

export function OwnerGroups({ items }: Props) {
  const groups = useMemo<OwnerGroup[]>(() => {
    const byOwner = new Map<string, OrderItem[]>();
    for (const item of items) {
      const list = byOwner.get(item.owner) ?? [];
      list.push(item);
      byOwner.set(item.owner, list);
    }

    return Array.from(byOwner.entries())
      .map(([owner, ownerItems]) => ({
        owner,
        items: ownerItems,
        priceTotal: ownerItems.reduce((sum, i) => sum + i.price, 0),
        customsTotal: ownerItems.reduce(
          (sum, i) => sum + (i.calculatedCustoms ?? 0),
          0,
        ),
      }))
      .sort((a, b) => b.customsTotal - a.customsTotal);
  }, [items]);

  if (groups.length === 0) return null;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <header>
        <h2 className="text-sm font-semibold tracking-tight">By owner</h2>
        <p className="mt-0.5 text-xs text-muted">
          Each owner&apos;s items and their share of the customs.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group, idx) => (
          <motion.div
            key={group.owner}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: idx * 0.04,
              type: "spring",
              stiffness: 360,
              damping: 28,
            }}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {group.owner}
                  </p>
                  <p className="text-[11px] text-muted">
                    {group.items.length} item
                    {group.items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  Customs
                </p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatEGP(group.customsTotal)}
                </p>
              </div>
            </div>

            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted">
                    {formatEGP(item.price)}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    +{formatEGP(item.calculatedCustoms ?? 0)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Total to pay
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatEGP(group.priceTotal + group.customsTotal)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
