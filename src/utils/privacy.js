// src/utils/privacy.js — PHI redaction + local extraction
// Patient data NEVER leaves the browser. Only med names go to Claude AI.

/**
 * Strip all Protected Health Information from text before sending to cloud.
 * Patient name, DOB, doctor name, clinic, phone, address → [REDACTED]
 */
export function redactPHI(text) {
  let redacted = text;
  redacted = redacted.replace(/Patient:\s*([^\n]+)/gi, "Patient: [REDACTED]");
  redacted = redacted.replace(/Dr\.\s+([^\n,]+)/gi, "Dr. [REDACTED]");
  redacted = redacted.replace(/Clinic:\s*([^\n]+)/gi, "Clinic: [REDACTED]");
  redacted = redacted.replace(/DOB:\s*([^\n]+)/gi, "DOB: [REDACTED]");
  redacted = redacted.replace(/Date of Birth:\s*([^\n]+)/gi, "Date of Birth: [REDACTED]");
  redacted = redacted.replace(/(\+?\d[\d\s\-()]{7,})/g, "[PHONE REDACTED]");
  redacted = redacted.replace(/Address:\s*([^\n]+)/gi, "Address: [REDACTED]");
  return redacted;
}

/**
 * Extract PHI locally (before redaction) so we keep it client-side only.
 * These details are displayed in the UI but never sent to any API.
 */
export function extractPHILocally(text) {
  const get = (rx) => {
    const m = text.match(rx);
    return m ? m[1].trim() : "Unknown";
  };
  return {
    doctor_name: get(/Dr\.\s+([^\n,]+)/i),
    clinic: get(/Clinic:\s*([^\n]+)/i),
    patient_name: get(/Patient:\s*([^\n]+)/i),
    date_issued: get(/Date:\s*([^\n]+)/i),
  };
}
