// src/components/OrdersTab.jsx — Order history from PostgreSQL

import { s } from "../utils/constants";

export default function OrdersTab({ orders, dbConnected }) {
  return (
    <div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "3px" }}>
        Order History
      </div>
      <div
        style={{ fontSize: "10px", color: "#64748b", marginBottom: "14px" }}
      >
        {dbConnected
          ? "🗄️ Persistent — stored in Neon PostgreSQL"
          : "⚠️ Database not connected — orders will not persist"}
      </div>

      {!orders.length ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px",
            color: "#475569",
            fontSize: "13px",
          }}
        >
          No orders yet.
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.id} style={{ ...s.section, marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    fontFamily: "monospace",
                  }}
                >
                  {o.id}
                </span>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    marginTop: "1px",
                  }}
                >
                  {o.patient} — Dr. {o.doctor}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#22c55e",
                  }}
                >
                  ${o.total.toFixed(2)}
                </div>
                <div style={{ fontSize: "9px", color: "#475569" }}>
                  {o.timestamp}
                </div>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
            >
              {o.items.map((it, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10px",
                    background: "#1e293b",
                    color: "#94a3b8",
                    padding: "2px 7px",
                    borderRadius: "4px",
                  }}
                >
                  {it.medication_name} ×
                  {it.quantity_requested || it.quantity}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
