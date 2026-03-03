// src/components/JsonLog.jsx — API payload viewer for debugging

export default function JsonLog({ jsonLog }) {
  return (
    <div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "3px" }}>
        API Payloads
      </div>
      <div
        style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}
      >
        Dashboard ↔ Backend ↔ Claude AI ↔ Shelf Device. PHI redaction logged.
      </div>

      {!jsonLog.length ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px",
            color: "#475569",
            fontSize: "13px",
          }}
        >
          Run a workflow to see payloads.
        </div>
      ) : (
        jsonLog.map((e, i) => (
          <div
            key={i}
            style={{
              background: "#111827",
              borderRadius: "9px",
              border: "1px solid #1e293b",
              overflow: "hidden",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: "#1e293b",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color:
                    e.label.includes("AI") || e.label.includes("Claude")
                      ? "#a5b4fc"
                      : e.label.includes("PHI") ||
                        e.label.includes("Privacy")
                      ? "#86efac"
                      : "#93c5fd",
                }}
              >
                {e.label}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "#475569",
                  fontFamily: "monospace",
                }}
              >
                {e.ts}
              </span>
            </div>
            <pre
              style={{
                padding: "10px 12px",
                margin: 0,
                fontSize: "10px",
                color: "#94a3b8",
                fontFamily: "'Courier New', monospace",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {JSON.stringify(e.data, null, 2)}
            </pre>
          </div>
        ))
      )}
    </div>
  );
}
