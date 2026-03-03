// src/utils/ai.js — Gemini AI prescription analysis (via backend proxy)
// PRIVACY: All text is PHI-redacted before sending. Images only extract meds.
// Calls backend at /api/ai/* which forwards to Google Gemini API server-side.

import { redactPHI } from "./privacy";

const API_URL = "https://medilight-backend.onrender.com";

/**
 * Parse prescription TEXT with Gemini AI (via backend proxy).
 * PHI is automatically redacted before the request.
 */
export async function interpretWithAI(text, inventoryList) {
  const safeText = redactPHI(text);
  const inventoryNames = inventoryList
    .map((p) => `${p.product_id}: ${p.name} (${p.category})`)
    .join("\n");

  const response = await fetch(`${API_URL}/api/ai/parse-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: safeText,
      inventory: inventoryNames,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI proxy error: ${response.status}`);
  }

  return response.json();
}

/**
 * Analyze prescription IMAGE with Gemini AI Vision (via backend proxy).
 * PRIVACY: Only asks for medication data — explicitly forbids PHI extraction.
 */
export async function interpretImageWithAI(base64Data, mediaType, inventoryList) {
  const inventoryNames = inventoryList
    .map((p) => `${p.product_id}: ${p.name} (${p.category})`)
    .join("\n");

  const response = await fetch(`${API_URL}/api/ai/parse-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: base64Data,
      media_type: mediaType,
      inventory: inventoryNames,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI Vision proxy error: ${response.status}`);
  }

  return response.json();
}