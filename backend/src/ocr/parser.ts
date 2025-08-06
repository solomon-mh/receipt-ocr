export const parseReceiptText = (text: string) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const storeName = lines[0] || "Unknown Store";

  const dateMatch = text.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/);
  const totalMatch = text.match(/Total\s*[:\-]?\s*\$?(\d+\.\d{2})/i);

  const items = lines
    .filter((line) => /^[A-Za-z].*\d+\.\d{2}$/.test(line))
    .map((line) => {
      const parts = line.split(/\s+/);
      const quantity = 1;
      const name = parts.slice(0, -1).join(" ");
      return { name, quantity };
    });

  return {
    storeName,
    purchaseDate: dateMatch ? new Date(dateMatch[0]) : new Date(),
    totalAmount: totalMatch ? parseFloat(totalMatch[1]) : 0.0,
    items,
  };
};
