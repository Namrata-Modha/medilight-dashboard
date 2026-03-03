// src/components/StatusBar.jsx — Top bar: logo, badges, tab navigation

import { s } from "../utils/constants";

export default function StatusBar({
  backendOk,
  dbConnected,
  deviceCount,
  tab,
  setTab,
}) {
  return (
    <div style={s.topBar}>
      <div style={s.logo}>
        <div style={s.logoIcon}>M</div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
            MediLight
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#64748b",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Dispensing System v3.0
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {/* Backend status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 10px",
            borderRadius: "6px",
            background: backendOk ? "#22c55e15" : "#dc262615",
            border: `1px solid ${backendOk ? "#22c55e44" : "#dc262644"}`,
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: backendOk ? "#22c55e" : "#ef4444",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: backendOk ? "#86efac" : "#fca5a5",
            }}
          >
            {backendOk
              ? `Backend · ${deviceCount} device${deviceCount !== 1 ? "s" : ""}`
              : "Backend Disconnected"}
          </span>
        </div>

        {/* DB status */}
        {backendOk && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 8px",
              borderRadius: "6px",
              background: dbConnected ? "#6366f115" : "#eab30815",
              border: `1px solid ${dbConnected ? "#6366f133" : "#eab30833"}`,
            }}
          >
            <span style={{ fontSize: "10px" }}>
              {dbConnected ? "🗄️" : "⚠️"}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: dbConnected ? "#a5b4fc" : "#fde68a",
              }}
            >
              {dbConnected ? "PostgreSQL" : "No DB"}
            </span>
          </div>
        )}

        {/* Privacy badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 8px",
            borderRadius: "6px",
            background: "#22c55e10",
            border: "1px solid #22c55e33",
          }}
        >
          <span style={{ fontSize: "10px" }}>🔒</span>
          <span
            style={{ fontSize: "10px", fontWeight: 600, color: "#86efac" }}
          >
            PHI Protected
          </span>
        </div>

        {/* Tab nav */}
        <div
          style={{
            display: "flex",
            gap: "3px",
            background: "#1e293b",
            borderRadius: "7px",
            padding: "3px",
          }}
        >
          {["workflow", "inventory", "orders", "json"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "5px 12px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "capitalize",
                background: tab === t ? "#334155" : "transparent",
                color: tab === t ? "#f8fafc" : "#64748b",
              }}
            >
              {t === "json" ? "JSON Log" : t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
