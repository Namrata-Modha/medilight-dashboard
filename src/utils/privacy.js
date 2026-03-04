// src/utils/privacy.js — PHI redaction + local extraction
// Patient data NEVER leaves the browser. Only med names go to Gemini AI (via backend proxy).

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
 * Handles varied formats: "Dr.", "Prescriber:", "Pt:", "Patient:", etc.
 */
export function extractPHILocally(text) {
  const get = (...rxList) => {
    for (const rx of rxList) {
      const m = text.match(rx);
      if (m && m[1].trim() !== "") return m[1].trim();
    }
    return "Unknown";
  };
  return {
    doctor_name: get(
      /(?:Prescriber|Dr)[.:]\s*([^\n,]+?)(?:\s*[-—]\s*|$)/im,
      /Dr\.\s+([^\n,]+)/i
    ),
    clinic: get(
      /Clinic:\s*([^\n]+)/i,
      /^([A-Z][A-Z\s&]+(?:MEDICAL|CLINIC|HEALTH|HOSPITAL|PARTNERS|ASSOCIATES|PHARMACY)[A-Z\s]*)/im
    ),
    patient_name: get(
      /Patient(?:\s*Name)?:\s*([^\n]+)/i,
      /Pt[.:]\s*([^\n]+?)(?:\s+Date|\s+DOB|\s*$)/im,
      /Patient\s+Name:\s*([^\n]+)/i
    ),
    date_issued: get(
      /Date(?:\s*(?:Prescribed|Signed|Issued))?:\s*([^\n]+)/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/
    ),
  };
}