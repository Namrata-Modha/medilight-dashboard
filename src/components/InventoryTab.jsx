// src/components/InventoryTab.jsx — Product grid with stock bars

import { s } from "../utils/constants";

export default function InventoryTab({
  products,
  dbConnected,
  onFullReset,
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700 }}>
            Inventory Dashboard
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            {dbConnected
              ? "🗄️ Live from PostgreSQL (Neon)"
              : "⚠️ Database not connected"}
          </div>
        </div>
        <button
          onClick={onFullReset}
          style={{ ...s.btnOutline, fontSize: "10px", padding: "6px 12px" }}
        >
          Reset All Data
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: "8px",
        }}
      >
        {products.map((p) => {
          const low = p.stock_count <= (p.reorder_threshold || 20);
          return (
            <div
              key={p.product_id}
              style={{
                background: "#111827",
                borderRadius: "9px",
                padding: "12px",
                border: low
                  ? "1px solid #eab30844"
                  : "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      marginTop: "1px",
                    }}
                  >
                    {p.category} · ${p.price}
                  </div>
                </div>
                {p.age_restricted && (
                  <span style={s.tag("#dc262622", "#f87171")}>CTRL</span>
                )}
              </div>
              <div style={{ marginTop: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    color: "#64748b",
                    marginBottom: "3px",
                  }}
                >
                  <span>Stock</span>
                  <span
                    style={{
                      color: low ? "#eab308" : "#22c55e",
                      fontWeight: 700,
                    }}
                  >
                    {p.stock_count}
                  </span>
                </div>
                <div
                  style={{
                    height: "3px",
                    background: "#1e293b",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (p.stock_count / 200) * 100)}%`,
                      background: low ? "#eab308" : "#22c55e",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
