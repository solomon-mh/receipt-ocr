// receiptParser.ts
type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

type ParsedReceipt = {
  storeName: string;
  purchaseDate: Date;
  totalAmount: number;
  items: ReceiptItem[];
};

/**
 * Parse a numeric price string like "1,234.56", "79.050", "*79.05" => number
 */
const parsePrice = (s: string): number | null => {
  if (!s) return null;
  // remove stray non-number characters except dot and comma
  const cleaned = s.replace(/[^0-9.,-]/g, "").trim();
  if (!cleaned) return null;
  // normalize comma to dot (common in OCR results)
  const normalized = cleaned.replace(/,/g, ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
};

/**
 * Try to extract a Date from a text string (supports multiple formats).
 * Returns Date | null
 */
const tryParseDateFromString = (s: string): Date | null => {
  if (!s) return null;
  // common date patterns
  // dd/mm/yyyy | dd-mm-yyyy | dd.mm.yyyy  (also 2-digit year)
  const dmy = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmy) {
    let day = parseInt(dmy[1], 10);
    let month = parseInt(dmy[2], 10) - 1;
    let year = parseInt(dmy[3], 10);
    if (year < 100) {
      // naive 2-digit year -> 2000+ (adjust if you want different)
      year += 2000;
    }
    const dt = new Date(year, month, day);
    if (!isNaN(dt.getTime())) return dt;
  }

  // yyyy/mm/dd or yyyy-mm-dd
  const ymd = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const dt = new Date(year, month, day);
    if (!isNaN(dt.getTime())) return dt;
  }

  // "30 August 2024" or "30 Aug 2024"
  const monthName = s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if (monthName) {
    const day = parseInt(monthName[1], 10);
    const monthStr = monthName[2];
    const year = parseInt(monthName[3], 10);
    const dt = new Date(`${monthStr} ${day}, ${year}`);
    if (!isNaN(dt.getTime())) return dt;
  }

  return null;
};

export const parseReceiptText = (text: string): ParsedReceipt => {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Normalize lines: remove repeated internal spaces, remove leading/trailing stars
  const lines = rawLines.map((l) =>
    l
      .replace(/\*/g, "") // remove stars OCR sometimes adds
      .replace(/\s{2,}/g, " ")
      .trim()
  );

  // === store name detection: look for keywords like "coffee", "cafe", "shop" within first 10 lines ===
  const storeKeywords = [
    "coffee",
    "cafe",
    "shop",
    "store",
    "mart",
    "bakery",
    "bar",
  ];
  let storeName = "Unknown Store";
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const l = lines[i].toLowerCase();
    if (storeKeywords.some((kw) => l.includes(kw))) {
      storeName = lines[i];
      break;
    }
  }
  // fallback: first non-empty line
  if (storeName === "Unknown Store" && lines.length > 0) {
    storeName = lines[0];
  }

  // === purchase date detection: scan every line for a date ===
  let purchaseDate: Date | null = null;
  for (const l of lines) {
    const dt = tryParseDateFromString(l);
    if (dt) {
      purchaseDate = dt;
      break;
    }
  }
  // fallback: use "now" to avoid Prisma null error. If you prefer null, change this.
  if (!purchaseDate) purchaseDate = new Date();

  // === total amount detection ===
  const totalKeywords = [
    "total",
    "amount due",
    "amount payable",
    "total due",
    "balance",
    "amt due",
  ];
  let totalAmount = 0;
  // search from bottom for a line containing keywords and a price
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].toLowerCase();
    if (totalKeywords.some((kw) => l.includes(kw))) {
      const priceMatch = lines[i].match(/(\d+[.,]\d{2,3})/);
      if (priceMatch) {
        const p = parsePrice(priceMatch[1]);
        if (p !== null) {
          totalAmount = p;
          break;
        }
      }
    }
  }
  // fallback: largest decimal number found (only decimals with 2+ digits after decimal)
  if (!totalAmount) {
    const allPrices = text.match(/(\d+[.,]\d{2,3})/g) || [];
    const nums = allPrices
      .map((p) => parsePrice(p))
      .filter((n): n is number => n !== null);
    if (nums.length > 0) totalAmount = Math.max(...nums);
  }

  // === item parsing ===
  const items: ReceiptItem[] = [];
  const usedLineIndex = new Set<number>();
  const nonItemKeywords = [
    "subtotal",
    "sub total",
    "tax",
    "t/x",
    "total",
    "balance",
    "amount",
    "change",
    "txbl",
    "table",
    "cashier",
    "waiter",
    "ref",
    "fs no",
    "receipt",
    "cash invoice",
    "system by",
    "tin",
    "tel",
    "call",
    "erca",
    "ser. charge",
    "service charge",
  ];

  // Regexes:
  // Full-line: Name ... QTY PRICE [AMOUNT]
  const fullItemRegex = /^(.+?)\s+(\d+)\s+([\d.,]+)(?:\s+([\d.,]+))?$/;

  // Number-only line (qty price [amount]) to attach to previous line
  const qtyPriceOnlyRegex = /^(\d+)\s+([\d.,]+)(?:\s+([\d.,]+))?$/;

  for (let i = 0; i < lines.length; i++) {
    if (usedLineIndex.has(i)) continue;
    const l = lines[i];
    const lower = l.toLowerCase();

    // skip clearly non-item lines
    if (nonItemKeywords.some((kw) => lower.includes(kw))) continue;

    // try full-line match first
    const fullMatch = l.match(fullItemRegex);
    if (fullMatch) {
      const rawName = fullMatch[1].trim();
      const qty = parseInt(fullMatch[2], 10) || 1;
      const unitPrice = parsePrice(fullMatch[3]) ?? 0;
      // amount in fullMatch[4] might be total line (qty * price) but we ignore it for now
      const name = rawName;
      if (name && qty > 0 && unitPrice > 0) {
        items.push({ name, quantity: qty, price: unitPrice });
        usedLineIndex.add(i);
        continue;
      }
    }

    // if not matched, check if line is qty+price and previous line looks like item name
    const numOnlyMatch = l.match(qtyPriceOnlyRegex);
    if (numOnlyMatch && i - 1 >= 0 && !usedLineIndex.has(i - 1)) {
      const prev = lines[i - 1].replace(/\*/g, "").trim();
      const prevLower = prev.toLowerCase();
      // ensure previous line is not header/footer
      if (!nonItemKeywords.some((kw) => prevLower.includes(kw))) {
        const qty = parseInt(numOnlyMatch[1], 10) || 1;
        const unitPrice = parsePrice(numOnlyMatch[2]) ?? 0;
        const name = prev;
        if (name && qty > 0 && unitPrice > 0) {
          items.push({ name, quantity: qty, price: unitPrice });
          usedLineIndex.add(i);
          usedLineIndex.add(i - 1);
          continue;
        }
      }
    }

    // Additional heuristic: some OCRs put an asterisk or star before the amount only
    // Example: "Double EsPriso 1 79.050 *79.05" - handled by fullItemRegex after star removal at top.
  }

  // Optional: do a quick dedupe by name+price to avoid duplicates
  const deduped: ReceiptItem[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const key = `${it.name.toLowerCase()}|${it.price}|${it.quantity}`;
    if (!seen.has(key)) {
      deduped.push(it);
      seen.add(key);
    }
  }

  return {
    storeName,
    purchaseDate: purchaseDate!,
    totalAmount: totalAmount || 0,
    items: deduped,
  };
};
