export type OcrProgress = {
  status: string;
  progress: number;
};

export async function runOcr(
  source: File | Blob | string,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (onProgress && typeof m.progress === "number") {
        onProgress({ status: m.status, progress: m.progress });
      }
    },
  });

  try {
    const { data } = await worker.recognize(source);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

// Detects an "EGP <amount>" anywhere on a line. Tesseract often mangles the
// "EGP" prefix because of the bold currency styling — examples we saw on a
// real Temu screenshot:
//   £cp155.43   £6P615.24   ecp107 57   EcP190.s2   Ecp4,512.37
// The pattern matches:
//   - leading `£` or `E`/`e`
//   - any single letter or digit (G mangled as c, 6, 0, etc.)
//   - any P/p/F/f character
//   - then a numeric amount, allowing a space, dot, or comma as the decimal.
const EGP_PRICE_RE =
  /(?:£|[Ee])[a-zA-Z0-9][PpFf]\s*([\d,]+)(?:[\s.,]+([\dsSoOQiIlL]{1,2}))?/;

// Lines that contain an EGP-like price but aren't real item prices.
const PRICE_BLACKLIST_RE = /\bapplied\b/i;

// Lines we skip when walking backward looking for a title.
const NOISE_PATTERNS: RegExp[] = [
  /^\s*$/,
  /^[\d\s,.\-]+%?$/, //                       pure numbers/punctuation
  /^\d+\s*[*x×]\s*\d+/i, //                   dimensions like 30*50, 35×47
  /(\bcm\b|\bmm\b|\binch\b)/i, //             dimension units
  /\bpre[-\s]?order/i,
  /\bfree\s+shipping\b/i,
  /\blimited[-\s]?time\b/i,
  /\bdelivery\b/i,
  /\bcart\s*\(/i,
  /\bsize\s*:/i,
];

// If the walk-backward from a price line hits any of these, we've descended
// into footer territory (the totals row) and give up rather than risk
// borrowing a title from the previous item.
const STOP_BACKWARD_RE =
  /\b(almost\s+sold|sold\s+out|checkout|applied)\b/i;

function isNoiseLine(line: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(line));
}

function isPriceLine(line: string): boolean {
  if (PRICE_BLACKLIST_RE.test(line)) return false;
  return EGP_PRICE_RE.test(line);
}

function parseEgpPrice(line: string): number | null {
  if (PRICE_BLACKLIST_RE.test(line)) return null;
  const m = line.match(EGP_PRICE_RE);
  if (!m) return null;
  const intPart = m[1].replace(/[,\s]/g, "");
  // OCR commonly mistakes 8→s, 0→o, 1→l/i in the small-font cents.
  const decPart = (m[2] ?? "0")
    .replace(/[sS]/g, "8")
    .replace(/[oOQ]/g, "0")
    .replace(/[iIlL]/g, "1");
  if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
  const n = parseFloat(`${intPart}.${decPart}`);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function looksLikeTitle(line: string): boolean {
  const letters = (line.match(/[A-Za-z]/g) ?? []).length;
  const words = line.split(/\s+/).filter(Boolean).length;
  return letters >= 10 && words >= 2;
}

// Strip leading junk and trailing checkbox/icon artifacts, while keeping
// trailing "..." (the screenshot's truncation indicator) so the title stays
// recognizable to the user.
function cleanTitle(s: string): string {
  let t = s.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  // Strip a leading lone lowercase letter followed by whitespace and a
  // capital/digit — that's a checkbox icon mis-read as "a A Shocking…".
  t = t.replace(/^[a-z]\s+(?=[A-Z0-9])/u, "");
  // Truncate everything after the last "..." (drops trailing "[J", "OJ", etc.)
  const lastDots = t.lastIndexOf("...");
  if (lastDots >= 0) t = t.slice(0, lastDots + 3);
  return t.trim();
}

type Block = { title: string; price: number };

function extractItemBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];

  for (let i = 0; i < lines.length; i++) {
    const price = parseEgpPrice(lines[i]);
    if (price === null) continue;

    let title = "";
    for (let j = i - 1; j >= 0; j--) {
      const candidate = lines[j];
      if (!candidate) continue;
      if (isPriceLine(candidate)) break;
      if (STOP_BACKWARD_RE.test(candidate)) break;
      if (isNoiseLine(candidate)) continue;
      if (!looksLikeTitle(candidate)) continue;
      title = cleanTitle(candidate);
      break;
    }

    if (title) blocks.push({ title, price });
  }

  return blocks;
}

// Normalize OCR text into `title | price` lines for the bulk parser. Returns
// an empty string when no item blocks are detected so the modal can fall
// back to showing the raw OCR for manual cleanup.
export function normalizeOcrText(raw: string): string {
  const lines = raw.split(/\r?\n/).map((l) => l.trim());
  const blocks = extractItemBlocks(lines);
  if (blocks.length === 0) return "";
  return blocks.map((b) => `${b.title} | ${b.price}`).join("\n");
}
