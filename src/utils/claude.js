// src/utils/claude.js — AI prescription analysis via backend (free Gemini API)
// PRIVACY: All text is PHI-redacted before sending. Images only extract meds.
// Calls go through YOUR backend — no CORS issues, key stays server-side.

import { redactPHI } from "./privacy";

// Uses the same backend URL as the rest of the app
const API_URL = "https://medilight-backend.onrender.com";

/**
 * Parse prescription TEXT with AI (via backend proxy to free Gemini).
 * PHI is automatically redacted before the request.
 */
export async function interpretWithClaude(text, inventoryList) {
  const safeText = redactPHI(text);
  const inventory = inventoryList
    .map((p) => `${p.product_id}: ${p.name} (${p.category})`)
    .join("\n");

  const response = await fetch(`${API_URL}/api/ai/parse-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ redacted_text: safeText, inventory }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `AI proxy error: ${response.status}`);
  }

  return response.json();
}

/**
 * Analyze prescription IMAGE with AI Vision (via backend proxy to free Gemini).
 * PRIVACY: Only asks for medication data — explicitly forbids PHI extraction.
 */
export async function interpretImageWithClaude(base64Data, mediaType, inventoryList) {
  const inventory = inventoryList
    .map((p) => `${p.product_id}: ${p.name} (${p.category})`)
    .join("\n");

  const response = await fetch(`${API_URL}/api/ai/parse-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: base64Data,
      media_type: mediaType,
      inventory,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `AI vision proxy error: ${response.status}`);
  }

  return response.json();
}