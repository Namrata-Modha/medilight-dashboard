// src/utils/parsers.js — Local regex parsing + inventory matching
// Used as fallback when Gemini AI is unavailable.
// Includes fuzzy matching for OCR typos (Codiene→Codeine, Omprazole→Omeprazole).

/**
 * Levenshtein distance — measures edit distance between two strings.
 * Used for fuzzy medication name matching when OCR introduces typos.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match a medication name against inventory.
 * Returns best match if similarity > 60% and within 3 edits, else null.
 */
function fuzzyMatchProduct(medName, products) {
  const key = medName.split(/\s+/)[0].toLowerCase();
  if (key.length < 3) return null;

  let bestMatch = null;
  let bestDist = Infinity;

  for (const p of products) {
    const pKey = p.name.split(/\s+/)[0].toLowerCase();
    const dist = levenshtein(key, pKey);
    const maxLen = Math.max(key.length, pKey.length);
    const similarity = 1 - dist / maxLen;

    if (dist <= 3 && similarity > 0.6 && dist < bestDist) {
      bestDist = dist;
      bestMatch = p;
    }
  }

  return bestMatch;
}

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
 * Uses exact first-word match, then fuzzy Levenshtein fallback.
 */
export function localMatchItems(items, products) {
  return items.map((item) => {
    const key = item.medication_name.split(" ")[0].toLowerCase();

    // Try exact first-word match
    let match = products.find((p) => p.name.toLowerCase().startsWith(key));

    // Fuzzy fallback for OCR typos
    if (!match) {
      match = fuzzyMatchProduct(item.medication_name, products);
    }

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
 * Match AI results against database inventory.
 * Three-tier matching:
 *   1. AI-provided matched_product_id (direct)
 *   2. Exact first-word name match (contains)
 *   3. Fuzzy Levenshtein match (typo tolerance)
 */
export function matchAIResultToProducts(aiResult, products) {
  return aiResult.items.map((item) => {
    // Tier 1: AI matched product_id
    const matchedProduct = item.matched_product_id
      ? products.find((p) => p.product_id === item.matched_product_id)
      : null;

    // Tier 2: Exact first-word contains match
    const exactMatch = !matchedProduct
      ? products.find((p) => {
          const itemKey = item.medication_name.split(" ")[0].toLowerCase();
          return p.name.toLowerCase().includes(itemKey);
        })
      : null;

    // Tier 3: Fuzzy Levenshtein match for OCR typos
    const fuzzyMatch = !matchedProduct && !exactMatch
      ? fuzzyMatchProduct(item.medication_name, products)
      : null;

    const match = matchedProduct || exactMatch || fuzzyMatch;

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
      confidence: item.confidence || (fuzzyMatch ? "medium" : undefined),
    };
  });
}