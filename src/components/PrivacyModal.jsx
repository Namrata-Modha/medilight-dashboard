// src/components/PrivacyModal.jsx — Consent gate before prescription upload

import { s } from "../utils/constants";

export default function PrivacyModal({ onAccept, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#111827",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "480px",
          width: "100%",
          border: "1px solid #dc262666",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#dc262622",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>
          <div>
            <div
              style={{ fontSize: "16px", fontWeight: 800, color: "#f87171" }}
            >
              Privacy & Data Warning
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Please read before uploading
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#0a0f1c",
            borderRadius: "10px",
            padding: "16px",
            border: "1px solid #1e293b",
            marginBottom: "16px",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: "1.7" }}
          >
            <strong style={{ color: "#f87171" }}>
              🚫 DO NOT upload real prescriptions
            </strong>{" "}
            with actual patient information. This is a demonstration system.
            <br />
            <br />
            <strong style={{ color: "#eab308" }}>
              If you proceed with image upload:
            </strong>
            <br />• Patient names, DOB, and doctor names are{" "}
            <strong style={{ color: "#22c55e" }}>extracted locally</strong> on
            your device
            <br />• Only{" "}
            <strong style={{ color: "#22c55e" }}>
              medication names & quantities
            </strong>{" "}
            are sent to AI for matching
            <br />• Personal health info (PHI) is{" "}
            <strong style={{ color: "#22c55e" }}>
              automatically redacted
            </strong>{" "}
            before any cloud API call
            <br />
            <br />
            <strong style={{ color: "#94a3b8" }}>For demo purposes:</strong> Use
            the sample prescriptions (Paste Text tab) or the manual selection
            mode.
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} style={{ ...s.btnOutline, flex: 1 }}>
            Cancel
          </button>
          <button
            onClick={onAccept}
            style={{ ...s.btn("#dc2626", "#fff"), flex: 1 }}
          >
            I Understand — Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
