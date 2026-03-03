// src/utils/parsers.js — Local regex parsing + inventory matching
// Used as fallback when Claude AI is unavailable.

/**
 * Parse prescription text with regex patterns.
 * Extracts doctor, clinic, patient, date, and medication lines.
 */
export function localParseOCR(text) {
  const get = (rx) => {
    const m = text.match(rx);
    return m ? m[1].trim() : "Unknown";
  };
  const rxMatches = [
    ...text.matchAll(/Rx:\s*(.+?)\s*(?:[—\-]+\s*Qty:|quantity)\s*(\d+)/gi),
  ];
  return {
    doctor_name: get(/Dr\.\s+([^\n,]+)/i),
    clinic: get(/Clinic:\s*([^\n]+)/i),
    patient_name: get(/Patient:\s*([^\n]+)/i),
    date_issued: get(/Date:\s*([^\n]+)/i),
    items: rxMatches.map((m) => ({
      medication_name: m[1].trim(),
      quantity_requested: parseInt(m[2], 10),
    })),
  };
}

/**
 * Match parsed medication items against database inventory.
 * Uses first-word matching (e.g., "Amoxicillin" matches "Amoxicillin 500mg").
 */
export function localMatchItems(items, products) {
  return items.map((item) => {
    const key = item.medication_name.split(" ")[0].toLowerCase();
    const match = products.find((p) => p.name.toLowerCase().startsWith(key));
    if (!match) return { ...item, matched: false, stock_sufficient: false };
    return {
      ...item,
      database_id: match.product_id,
      led_address: match.led_address,
      price: parseFloat(match.price),
      in_stock: match.stock_count,
      requires_id: match.age_restricted,
      category: match.category,
      stock_sufficient: match.stock_count >= item.quantity_requested,
      matched: true,
    };
  });
}

/**
 * Match Claude AI results against database inventory.
 * First tries matched_product_id from Claude, then falls back to name matching.
 */
export function matchClaudeResultToProducts(claudeResult, products) {
  return claudeResult.items.map((item) => {
    const matchedProduct = item.matched_product_id
      ? products.find((p) => p.product_id === item.matched_product_id)
      : null;
    const fallbackMatch = !matchedProduct
      ? products.find((p) => {
          const itemKey = item.medication_name.split(" ")[0].toLowerCase();
          return p.name.toLowerCase().includes(itemKey);
        })
      : null;
    const match = matchedProduct || fallbackMatch;
    if (!match) {
      return {
        medication_name: item.medication_name,
        quantity_requested: item.quantity_requested,
        matched: false,
        stock_sufficient: false,
        confidence: item.confidence,
      };
    }
    return {
      medication_name: item.medication_name,
      quantity_requested: item.quantity_requested,
      database_id: match.product_id,
      led_address: match.led_address,
      price: parseFloat(match.price),
      in_stock: match.stock_count,
      requires_id: match.age_restricted,
      category: match.category,
      stock_sufficient: match.stock_count >= item.quantity_requested,
      matched: true,
      confidence: item.confidence,
    };
  });
}
