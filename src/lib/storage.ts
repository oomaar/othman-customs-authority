import type { OrderItem } from "./types";

const STORAGE_KEY = "customs-calculator:items";

export function saveItems(items: OrderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded or unavailable — fail silently.
  }
}

export function loadItems(): OrderItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const items: OrderItem[] = [];
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry.id === "string" &&
        typeof entry.title === "string" &&
        typeof entry.price === "number" &&
        typeof entry.owner === "string" &&
        (entry.calculatedCustoms === undefined ||
          typeof entry.calculatedCustoms === "number")
      ) {
        items.push(entry);
      }
    }
    return items;
  } catch {
    return null;
  }
}

export function clearItems(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
