// src/components/InventoryTab.jsx — Product grid with Add / Edit / Delete

import { useState } from "react";
import { s } from "../utils/constants";

const SHELF_ADDRESSES = [
  "shelf_A_row_1_pos_1", "shelf_A_row_1_pos_2",
  "shelf_A_row_2_pos_1", "shelf_A_row_2_pos_2",
  "shelf_B_row_1_pos_1", "shelf_B_row_1_pos_2",
  "shelf_B_row_2_pos_1", "shelf_B_row_2_pos_2",
  "shelf_C_row_1_pos_1", "shelf_C_row_1_pos_2",
  "shelf_C_row_2_pos_1", "shelf_C_row_2_pos_2",
];

const CATEGORIES = [
  "Antibiotic", "Pain Relief", "Cardiovascular", "Diabetes",
  "Gastrointestinal", "Allergy", "Corticosteroid", "Controlled",
];

const emptyForm = {
  product_id: "", name: "", price: "", stock_count: "",
  category: "Antibiotic", led_address: "", age_restricted: false, reorder_threshold: "20",
};

export default function InventoryTab({ products, dbConnected, onFullReset, onRefreshInventory, backendOk }) {
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // product_id
  const [deleting, setDeleting] = useState(false);

  const API_URL = "https://medilight-backend.onrender.com";

  const usedAddresses = products.map((p) => p.led_address);
  const availableAddresses = SHELF_ADDRESSES.filter((a) => !usedAddresses.includes(a));

  const openAdd = () => {
    setForm({ ...emptyForm, led_address: availableAddresses[0] || "" });
    setError("");
    setModal("add");
  };

  const openEdit = (p) => {
    setForm({
      product_id: p.product_id,
      name: p.name,
      price: String(p.price),
      stock_count: String(p.stock_count),
      category: p.category,
      led_address: p.led_address,
      age_restricted: p.age_restricted,
      reorder_threshold: String(p.reorder_threshold || 20),
    });
    setError("");
    setModal("edit");
  };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) { setError("Valid price required"); return; }
    if (!form.stock_count || isNaN(Number(form.stock_count))) { setError("Valid stock count required"); return; }

    setSaving(true);
    try {
      if (modal === "add") {
        if (!form.product_id.trim()) { setError("Product ID is required"); setSaving(false); return; }
        if (products.find((p) => p.product_id === form.product_id)) { setError("Product ID already exists"); setSaving(false); return; }
        const res = await fetch(`${API_URL}/api/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: form.product_id.trim(),
            name: form.name.trim(),
            price: Number(form.price),
            stock_count: Number(form.stock_count),
            category: form.category,
            led_address: form.led_address,
            age_restricted: form.age_restricted,
            reorder_threshold: Number(form.reorder_threshold) || 20,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `API error: ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_URL}/api/inventory/${form.product_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            price: Number(form.price),
            stock_count: Number(form.stock_count),
            category: form.category,
            reorder_threshold: Number(form.reorder_threshold) || 20,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `API error: ${res.status}`);
        }
      }
      setModal(null);
      if (onRefreshInventory) onRefreshInventory();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (productId) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/inventory/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `API error: ${res.status}`);
      }
      setConfirmDelete(null);
      if (onRefreshInventory) onRefreshInventory();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
    setDeleting(false);
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700 }}>Inventory Dashboard</div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            {dbConnected ? "🗄️ Live from PostgreSQL (Neon)" : "⚠️ Database not connected"} · {products.length} products
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {backendOk && (
            <button onClick={openAdd} style={{ ...s.btn("linear-gradient(135deg,#2563eb,#3b82f6)", "#fff"), fontSize: "11px", padding: "7px 14px" }}>
              + Add Product
            </button>
          )}
          <button onClick={onFullReset} style={{ ...s.btnOutline, fontSize: "10px", padding: "6px 12px" }}>
            Reset All Data
          </button>
        </div>
      </div>

      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "8px" }}>
        {products.map((p) => {
          const low = p.stock_count <= (p.reorder_threshold || 20);
          const isDeleting = confirmDelete === p.product_id;
          return (
            <div key={p.product_id} style={{
              background: isDeleting ? "#dc262612" : "#111827",
              borderRadius: "9px", padding: "12px",
              border: isDeleting ? "1px solid #dc262666" : low ? "1px solid #eab30844" : "1px solid #1e293b",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "1px" }}>
                    {p.category} · ${p.price} · <span style={{ fontFamily: "monospace", fontSize: "9px" }}>{p.product_id}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "2px", alignItems: "flex-start" }}>
                  {p.age_restricted && <span style={s.tag("#dc262622", "#f87171")}>CTRL</span>}
                </div>
              </div>

              {/* Stock bar */}
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>
                  <span>Stock</span>
                  <span style={{ color: low ? "#eab308" : "#22c55e", fontWeight: 700 }}>{p.stock_count}</span>
                </div>
                <div style={{ height: "3px", background: "#1e293b", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, (p.stock_count / 200) * 100)}%`,
                    background: low ? "#eab308" : "#22c55e", borderRadius: "2px",
                  }} />
                </div>
              </div>

              {/* Action buttons */}
              {backendOk && (
                <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
                  {!isDeleting ? (
                    <>
                      <button onClick={() => openEdit(p)} style={{
                        flex: 1, padding: "5px 8px", borderRadius: "5px", border: "1px solid #334155",
                        background: "#1e293b", color: "#94a3b8", cursor: "pointer", fontSize: "10px", fontWeight: 600,
                      }}>✏️ Edit</button>
                      <button onClick={() => setConfirmDelete(p.product_id)} style={{
                        padding: "5px 8px", borderRadius: "5px", border: "1px solid #dc262633",
                        background: "#dc262612", color: "#f87171", cursor: "pointer", fontSize: "10px", fontWeight: 600,
                      }}>🗑</button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, fontSize: "10px", color: "#fca5a5", fontWeight: 600, lineHeight: "24px" }}>Delete this product?</div>
                      <button onClick={() => handleDelete(p.product_id)} disabled={deleting} style={{
                        padding: "5px 10px", borderRadius: "5px", border: "none",
                        background: "#dc2626", color: "#fff", cursor: deleting ? "default" : "pointer", fontSize: "10px", fontWeight: 700,
                      }}>{deleting ? "..." : "Yes"}</button>
                      <button onClick={() => setConfirmDelete(null)} style={{
                        padding: "5px 10px", borderRadius: "5px", border: "1px solid #334155",
                        background: "#1e293b", color: "#94a3b8", cursor: "pointer", fontSize: "10px", fontWeight: 600,
                      }}>No</button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999, display: "flex",
          alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", padding: "20px",
        }}>
          <div style={{
            background: "#111827", borderRadius: "14px", padding: "24px",
            maxWidth: "440px", width: "100%", border: "1px solid #334155",
          }}>
            <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
              {modal === "add" ? "➕ Add New Product" : `✏️ Edit — ${form.name}`}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "18px" }}>
              {modal === "add" ? "Fill in all fields to add to inventory." : "Update product details below."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Product ID (add only) */}
              {modal === "add" && (
                <div>
                  <div style={lbl}>Product ID</div>
                  <input value={form.product_id} onChange={(e) => set("product_id", e.target.value)}
                    placeholder="e.g. med_100" style={s.input} />
                </div>
              )}

              {/* Name */}
              <div>
                <div style={lbl}>Medication Name</div>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Paracetamol 500mg" style={s.input} />
              </div>

              {/* Price + Stock */}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={lbl}>Price ($)</div>
                  <input type="number" step="0.01" min="0" value={form.price}
                    onChange={(e) => set("price", e.target.value)} placeholder="9.99" style={s.input} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={lbl}>Stock Count</div>
                  <input type="number" min="0" value={form.stock_count}
                    onChange={(e) => set("stock_count", e.target.value)} placeholder="100" style={s.input} />
                </div>
              </div>

              {/* Category + Reorder Threshold */}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={lbl}>Category</div>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={lbl}>Reorder Threshold</div>
                  <input type="number" min="0" value={form.reorder_threshold}
                    onChange={(e) => set("reorder_threshold", e.target.value)} placeholder="20" style={s.input} />
                </div>
              </div>

              {/* LED Address (add only) */}
              {modal === "add" && (
                <div>
                  <div style={lbl}>Shelf LED Address</div>
                  <select value={form.led_address} onChange={(e) => set("led_address", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                    {availableAddresses.length ? (
                      availableAddresses.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)
                    ) : (
                      <option value="">No available slots</option>
                    )}
                  </select>
                </div>
              )}

              {/* Controlled checkbox */}
              {modal === "add" && (
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#e2e8f0" }}>
                  <input type="checkbox" checked={form.age_restricted}
                    onChange={(e) => set("age_restricted", e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#dc2626" }} />
                  Age-restricted / Controlled substance (requires ID)
                </label>
              )}

              {/* Error */}
              {error && (
                <div style={{ background: "#dc262612", border: "1px solid #dc262644", borderRadius: "6px", padding: "8px 12px", fontSize: "11px", color: "#fca5a5" }}>
                  ❌ {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => setModal(null)} style={{ ...s.btnOutline, flex: 1 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{
                  ...s.btn(saving ? "#1e293b" : "linear-gradient(135deg,#2563eb,#3b82f6)", saving ? "#475569" : "#fff"),
                  flex: 1, cursor: saving ? "default" : "pointer",
                }}>
                  {saving ? "Saving..." : modal === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" };