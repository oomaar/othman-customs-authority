import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OrderItem } from "./types";
import { formatEGP } from "./format";

type OwnerSummary = {
  owner: string;
  items: OrderItem[];
  priceTotal: number;
  customsTotal: number;
};

function groupByOwner(items: OrderItem[]): OwnerSummary[] {
  const map = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = map.get(item.owner) ?? [];
    list.push(item);
    map.set(item.owner, list);
  }
  return Array.from(map.entries())
    .map(([owner, ownerItems]) => ({
      owner,
      items: ownerItems,
      priceTotal: ownerItems.reduce((s, i) => s + i.price, 0),
      customsTotal: ownerItems.reduce(
        (s, i) => s + (i.calculatedCustoms ?? 0),
        0,
      ),
    }))
    .sort((a, b) => b.customsTotal - a.customsTotal);
}

export function exportOrderPdf(items: OrderItem[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const totalPrice = items.reduce((s, i) => s + i.price, 0);
  const totalCustoms = items.reduce(
    (s, i) => s + (i.calculatedCustoms ?? 0),
    0,
  );
  const hasCustoms = totalCustoms > 0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Customs Calculation", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(new Date().toLocaleString("en-EG"), 40, 68);
  doc.setTextColor(0);

  const itemsHead = hasCustoms
    ? [["Title", "Owner", "Price", "Customs", "Total"]]
    : [["Title", "Owner", "Price"]];

  const itemsBody = items.map((i) => {
    const total = i.price + (i.calculatedCustoms ?? 0);
    return hasCustoms
      ? [
          i.title,
          i.owner,
          formatEGP(i.price),
          formatEGP(i.calculatedCustoms ?? 0),
          formatEGP(total),
        ]
      : [i.title, i.owner, formatEGP(i.price)];
  });

  const itemsFoot = hasCustoms
    ? [
        [
          "Total",
          "",
          formatEGP(totalPrice),
          formatEGP(totalCustoms),
          formatEGP(totalPrice + totalCustoms),
        ],
      ]
    : [["Total", "", formatEGP(totalPrice)]];

  autoTable(doc, {
    head: itemsHead,
    body: itemsBody,
    foot: itemsFoot,
    startY: 90,
    theme: "striped",
    headStyles: { fillColor: [24, 24, 27], textColor: 255 },
    footStyles: {
      fillColor: [244, 244, 245],
      textColor: 24,
      fontStyle: "bold",
    },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 8 },
    columnStyles: hasCustoms
      ? {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
        }
      : { 2: { halign: "right" } },
  });

  if (hasCustoms) {
    const groups = groupByOwner(items);
    const afterItems =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 90;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("By Owner", 40, afterItems + 36);

    autoTable(doc, {
      startY: afterItems + 48,
      head: [["Owner", "Items", "Price", "Customs", "Total to pay"]],
      body: groups.map((g) => [
        g.owner,
        String(g.items.length),
        formatEGP(g.priceTotal),
        formatEGP(g.customsTotal),
        formatEGP(g.priceTotal + g.customsTotal),
      ]),
      theme: "striped",
      headStyles: { fillColor: [24, 24, 27], textColor: 255 },
      styles: { font: "helvetica", fontSize: 10, cellPadding: 8 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`customs-${stamp}.pdf`);
}
