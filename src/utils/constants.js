// src/utils/constants.js — App-wide constants and configuration

export const SAMPLE_RX = [
  {
    label: "Rx #1 — Antibiotics + Controlled",
    text: "Dr. Sarah Smith, MD\nClinic: Downtown Medical Center\nPatient: John Doe\nDate: Feb 26, 2026\n\nRx: Amoxicillin 500mg — Qty: 30\nRx: Lorazepam 1mg — Qty: 10\nRx: Ibuprofen 400mg — Qty: 20",
  },
  {
    label: "Rx #2 — Chronic Conditions",
    text: "Dr. Michael Chen, DO\nClinic: Harbor Health Center\nPatient: Maria Garcia\nDate: Feb 25, 2026\n\nRx: Metformin 500mg — Qty: 60\nRx: Lisinopril 10mg — Qty: 30\nRx: Aspirin 81mg — Qty: 90",
  },
  {
    label: "Rx #3 — Pain + Controlled",
    text: "Dr. Priya Patel, MD\nClinic: Sunset Pharmacy Clinic\nPatient: Alex Thompson\nDate: Feb 26, 2026\n\nRx: Codeine 30mg — Qty: 15\nRx: Omeprazole 20mg — Qty: 30\nRx: Cetirizine 10mg — Qty: 28",
  },
];

export const SHELF_LAYOUT = [
  {
    label: "Shelf A — General",
    color: "#3b82f6",
    addrs: [
      ["shelf_A_row_1_pos_1", "shelf_A_row_1_pos_2"],
      ["shelf_A_row_2_pos_1", "shelf_A_row_2_pos_2"],
    ],
  },
  {
    label: "Shelf B — Specialty",
    color: "#8b5cf6",
    addrs: [
      ["shelf_B_row_1_pos_1", "shelf_B_row_1_pos_2"],
      ["shelf_B_row_2_pos_1", "shelf_B_row_2_pos_2"],
    ],
  },
  {
    label: "Shelf C — Controlled",
    color: "#ef4444",
    addrs: [
      ["shelf_C_row_1_pos_1", "shelf_C_row_1_pos_2"],
      ["shelf_C_row_2_pos_1", "shelf_C_row_2_pos_2"],
    ],
  },
];

export const STEPS = [
  "Upload / Select",
  "Review OCR",
  "Verify ID",
  "Confirm Order",
  "Dispense",
];

export const CONFIDENCE_COLORS = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#ef4444",
};

// ─── Shared inline styles ─────────────────────────────────────
export const s = {
  root: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "#0a0f1c",
    color: "#e2e8f0",
    minHeight: "100vh",
  },
  topBar: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    borderBottom: "1px solid #1e293b",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "7px",
    background: "linear-gradient(135deg, #22c55e, #10b981)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 800,
    color: "#0a0f1c",
  },
  section: {
    background: "#111827",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #1e293b",
    marginBottom: "16px",
  },
  label: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "12px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  btn: (bg, color) => ({
    padding: "11px 22px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
    transition: "all 0.2s",
  }),
  btnOutline: {
    padding: "11px 22px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#94a3b8",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0a0f1c",
    color: "#e2e8f0",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
  },
  tag: (bg, color) => ({
    display: "inline-block",
    padding: "2px 7px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: 700,
    background: bg,
    color,
    marginLeft: "6px",
  }),
};
