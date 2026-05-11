import { parseNumber } from "./format";

export type ParsedBulkRow = {
  title: string;
  price: number;
};

export type ParsedLine =
  | { ok: true; line: number; raw: string; values: ParsedBulkRow }
  | { ok: false; line: number; raw: string; error: string };

const DELIMITER = /\s*[|,\t]\s*/;

export function parseBulkText(text: string): ParsedLine[] {
  const results: ParsedLine[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed === "") continue;

    const parts = trimmed.split(DELIMITER);
    if (parts.length < 2) {
      results.push({
        ok: false,
        line: i + 1,
        raw,
        error: "Expected: title | price",
      });
      continue;
    }

    // Allow extra delimiters in the title by joining the leading parts:
    // "Wireless | Mouse | 120" → title="Wireless | Mouse"
    const priceStr = parts[parts.length - 1].trim();
    const title = parts.slice(0, -1).join(" | ").trim();

    if (!title) {
      results.push({ ok: false, line: i + 1, raw, error: "Title is empty" });
      continue;
    }

    const price = parseNumber(priceStr);
    if (price === null) {
      results.push({
        ok: false,
        line: i + 1,
        raw,
        error: `"${priceStr}" is not a valid number`,
      });
      continue;
    }
    if (price <= 0) {
      results.push({
        ok: false,
        line: i + 1,
        raw,
        error: "Price must be greater than 0",
      });
      continue;
    }

    results.push({
      ok: true,
      line: i + 1,
      raw,
      values: { title, price },
    });
  }

  return results;
}
