// src/utils/claude.js — Claude AI prescription analysis
// PRIVACY: All text is PHI-redacted before sending. Images only extract meds.

import { redactPHI } from "./privacy";

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

/**
 * Parse prescription TEXT with Claude AI.
 * PHI is automatically redacted before the request.
 */
export async function interpretWithClaude(text, inventoryList) {
  const safeText = redactPHI(text);
  const inventoryNames = inventoryList
    .map((p) => `${p.product_id}: ${p.name} (${p.category})`)
    .join("\n");

  const response = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a pharmacy prescription parser. Extract medications from this prescription text (which may be messy OCR output). Match medications to our inventory. Patient details have been redacted for privacy — focus only on medications.

OUR INVENTORY:
${inventoryNames}

PRESCRIPTION TEXT (PHI redacted):
"""
${safeText}
"""

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "items": [
    {
      "medication_name": "exact name as it appears",
      "quantity_requested": number,
      "matched_product_id": "product_id from inventory or null",
      "confidence": "high" or "medium" or "low"
    }
  ],
  "notes": "any warnings about the prescription"
}

Rules:
- Match medications by active ingredient name
- If quantity unclear, default to 30
- Include ALL medications found, even if not in inventory
- confidence: "high" if clear match, "medium" if partially garbled, "low" if unsure`,
        },
      ],
    }),
  });

  const data = await response.json();
  const textResponse =
    data.content?.find((b) => b.type === "text")?.text || "";
  return JSON.parse(textResponse.replace(/```json|```/g, "").trim());
}

/**
 * Analyze prescription IMAGE with Claude Vision.
 * PRIVACY: Only asks for medication data — explicitly forbids PHI extraction.
 */
export async function interpretImageWithClaude(
  base64Data,
  mediaType,
  inventoryList
) {
  const inventoryNames = inventoryList
    .map((p) => `${p.product_id}: ${p.name} (${p.category})`)
    .join("\n");

  const response = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `You are a pharmacy prescription parser. Read this prescription image and extract ONLY medication data. DO NOT extract or return any patient names, doctor names, clinic names, addresses, dates of birth, or phone numbers — these are protected health information.

OUR INVENTORY:
${inventoryNames}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "items": [
    {
      "medication_name": "medication name",
      "quantity_requested": number,
      "matched_product_id": "product_id from inventory or null",
      "confidence": "high" or "medium" or "low"
    }
  ],
  "notes": "any warnings (do NOT include patient or doctor names here)"
}

Rules:
- ONLY extract medications — NO personal/health information
- Match by active ingredient
- If quantity unclear, default to 30
- Include ALL medications, even if not in inventory`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const textResponse =
    data.content?.find((b) => b.type === "text")?.text || "";
  return JSON.parse(textResponse.replace(/```json|```/g, "").trim());
}
