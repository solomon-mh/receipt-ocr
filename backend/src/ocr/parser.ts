type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

type ParsedReceipt = {
  storeName: string;
  purchaseDate: Date | null;
  totalAmount: number;
  items: ReceiptItem[];
};

const similarity = (s1: string, s2: string) => {
  // Simple case-insensitive similarity: counts matching chars in order
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  let matches = 0;
  for (let i = 0, j = 0; i < s1.length && j < s2.length; ) {
    if (s1[i] === s2[j]) {
      matches++;
      i++;
      j++;
    } else if (s1[i] < s2[j]) {
      i++;
    } else {
      j++;
    }
  }
  return matches / Math.max(s1.length, s2.length);
};

export const parseReceiptText = (text: string): ParsedReceipt => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // === 1. Store name detection ===
  // Skip lines that look like addresses, phone numbers, or empty
  const isNoiseLine = (line: string) => {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?){1,2}\d{3,4}/;
    const addressKeywords = [
      "street",
      "st.",
      "road",
      "rd.",
      "ave",
      "avenue",
      "blvd",
      "floor",
      "suite",
    ];
    if (phoneRegex.test(line.toLowerCase())) return true;
    if (addressKeywords.some((kw) => line.toLowerCase().includes(kw)))
      return true;
    if (line.length < 2) return true;
    return false;
  };

  let storeName = "Unknown Store";
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (!isNoiseLine(lines[i])) {
      storeName = lines[i];
      break;
    }
  }

  // === 2. Purchase date detection (support multiple formats) ===
  const datePatterns = [
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/, // yyyy-mm-dd or yyyy/mm/dd
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/, // dd-mm-yyyy or dd/mm/yyyy
    /\b(\d{1,2})\s([A-Za-z]{3,9})\s(\d{4})\b/, // e.g. 12 March 2023
  ];

  let purchaseDate: Date | null = null;
  outer: for (const line of lines) {
    for (const regex of datePatterns) {
      const match = line.match(regex);
      if (match) {
        try {
          // Parse date based on format
          let dt: Date | null = null;
          if (regex === datePatterns[0]) {
            // yyyy-mm-dd
            dt = new Date(
              parseInt(match[1]),
              parseInt(match[2]) - 1,
              parseInt(match[3])
            );
          } else if (regex === datePatterns[1]) {
            // dd-mm-yyyy
            dt = new Date(
              parseInt(match[3]),
              parseInt(match[2]) - 1,
              parseInt(match[1])
            );
          } else if (regex === datePatterns[2]) {
            // dd Month yyyy
            dt = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
          }
          if (dt && !isNaN(dt.getTime())) {
            purchaseDate = dt;
            break outer;
          }
        } catch {
          // ignore parse error and try next
        }
      }
    }
  }

  // === 3. Total amount detection with fuzzy matching ===
  // Common keywords that mean total
  const totalKeywords = [
    "total",
    "amount due",
    "balance due",
    "amount payable",
    "total due",
  ];

  // Regex to extract price with optional currency and decimal separator (dot or comma)
  const priceRegex = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/;

  let totalAmount = 0;
  for (const line of lines.reverse()) {
    // Check if line contains a "total" like keyword approximately
    const lineLower = line.toLowerCase();
    const hasTotalKeyword = totalKeywords.some((kw) => {
      // Use similarity to allow minor OCR typos
      return similarity(kw, lineLower) > 0.6;
    });
    if (hasTotalKeyword) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        // Normalize comma to dot
        const normalizedPrice = priceMatch[1].replace(/,/g, ".");
        totalAmount = parseFloat(normalizedPrice);
        if (!isNaN(totalAmount)) break;
      }
    }
  }

  // === 4. Item lines detection with quantity and price ===
  // Item lines often look like:
  // 2 Apple 5.00
  // Apple x2 5,00
  // Apple 5.00
  // Format: [optional quantity] itemName price
  // We'll support quantity before or after the item name with "x" or just a number

  const items: ReceiptItem[] = [];

  // Regex for line with optional quantity and price at the end
  // Examples matched:
  // 2 Apple 5.00
  // Apple x2 5.00
  // Apple 5.00
  const itemLineRegex = /^(\d+)?\s*([a-zA-Z\s]+?)\s*(x\d+)?\s*([\d.,]+)$/;

  for (const line of lines) {
    const match = line.match(itemLineRegex);
    if (match) {
      // Extract quantity
      let quantity = 1;
      if (match[1]) quantity = parseInt(match[1]);
      else if (match[3]) quantity = parseInt(match[3].substring(1)); // remove 'x'

      // Extract name and price
      const name = match[2].trim();
      const priceStr = match[4].replace(/,/g, ".");
      const price = parseFloat(priceStr);

      if (name && !isNaN(price)) {
        items.push({ name, quantity, price });
      }
    }
  }

  return {
    storeName,
    purchaseDate,
    totalAmount,
    items,
  };
};
