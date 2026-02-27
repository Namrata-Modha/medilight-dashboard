import { useState, useEffect } from "react";
// Note: This is a frontend React component simulating the MediLight system. In a real deployment, API calls would interact with an actual backend and hardware.
const API_URL = "https://medilight-backend.onrender.com";

const isConnected = () => API_URL.length > 0;

const SEED_PRODUCTS = [
  { product_id: "med_001", name: "Amoxicillin 500mg", price: 15.99, age_restricted: false, stock_count: 150, led_address: "shelf_A_row_1_pos_1", category: "Antibiotic", reorder_threshold: 30 },
  { product_id: "med_012", name: "Ibuprofen 400mg", price: 8.49, age_restricted: false, stock_count: 200, led_address: "shelf_A_row_1_pos_2", category: "Pain Relief", reorder_threshold: 40 },
  { product_id: "med_023", name: "Aspirin 81mg", price: 6.99, age_restricted: false, stock_count: 300, led_address: "shelf_A_row_2_pos_1", category: "Cardiovascular", reorder_threshold: 50 },
  { product_id: "med_034", name: "Lisinopril 10mg", price: 12.5, age_restricted: false, stock_count: 85, led_address: "shelf_A_row_2_pos_2", category: "Cardiovascular", reorder_threshold: 20 },
  { product_id: "med_045", name: "Metformin 500mg", price: 9.75, age_restricted: false, stock_count: 120, led_address: "shelf_B_row_1_pos_1", category: "Diabetes", reorder_threshold: 25 },
  { product_id: "med_056", name: "Omeprazole 20mg", price: 11.25, age_restricted: false, stock_count: 90, led_address: "shelf_B_row_1_pos_2", category: "Gastrointestinal", reorder_threshold: 20 },
  { product_id: "med_067", name: "Cetirizine 10mg", price: 7.99, age_restricted: false, stock_count: 175, led_address: "shelf_B_row_2_pos_1", category: "Allergy", reorder_threshold: 30 },
  { product_id: "med_078", name: "Prednisone 20mg", price: 14.0, age_restricted: false, stock_count: 60, led_address: "shelf_B_row_2_pos_2", category: "Corticosteroid", reorder_threshold: 15 },
  { product_id: "med_089", name: "Lorazepam 1mg", price: 25.5, age_restricted: true, stock_count: 45, led_address: "shelf_C_row_1_pos_1", category: "Controlled", reorder_threshold: 10 },
  { product_id: "med_090", name: "Adderall 20mg", price: 35.0, age_restricted: true, stock_count: 30, led_address: "shelf_C_row_1_pos_2", category: "Controlled", reorder_threshold: 10 },
  { product_id: "med_091", name: "Codeine 30mg", price: 22.0, age_restricted: true, stock_count: 25, led_address: "shelf_C_row_2_pos_1", category: "Controlled", reorder_threshold: 8 },
  { product_id: "med_092", name: "Alprazolam 0.5mg", price: 28.75, age_restricted: true, stock_count: 40, led_address: "shelf_C_row_2_pos_2", category: "Controlled", reorder_threshold: 10 },
];

const SAMPLE_RX = [
  { label: "Rx #1 — Antibiotics + Controlled", text: "Dr. Sarah Smith, MD\nClinic: Downtown Medical Center\nPatient: John Doe\nDate: Feb 26, 2026\n\nRx: Amoxicillin 500mg — Qty: 30\nRx: Lorazepam 1mg — Qty: 10\nRx: Ibuprofen 400mg — Qty: 20" },
  { label: "Rx #2 — Chronic Conditions", text: "Dr. Michael Chen, DO\nClinic: Harbor Health Center\nPatient: Maria Garcia\nDate: Feb 25, 2026\n\nRx: Metformin 500mg — Qty: 60\nRx: Lisinopril 10mg — Qty: 30\nRx: Aspirin 81mg — Qty: 90" },
  { label: "Rx #3 — Pain + Controlled", text: "Dr. Priya Patel, MD\nClinic: Sunset Pharmacy Clinic\nPatient: Alex Thompson\nDate: Feb 26, 2026\n\nRx: Codeine 30mg — Qty: 15\nRx: Omeprazole 20mg — Qty: 30\nRx: Cetirizine 10mg — Qty: 28" },
];

function localParseOCR(text) {
  const get = (rx) => { const m = text.match(rx); return m ? m[1].trim() : "Unknown"; };
  const rxM = [...text.matchAll(/Rx:\s*(.+?)\s*(?:[—\-]+\s*Qty:|quantity)\s*(\d+)/gi)];
  return {
    doctor_name: get(/Dr\.\s+([^\n,]+)/i), clinic: get(/Clinic:\s*([^\n]+)/i),
    patient_name: get(/Patient:\s*([^\n]+)/i), date_issued: get(/Date:\s*([^\n]+)/i),
    items: rxM.map((m) => ({ medication_name: m[1].trim(), quantity_requested: parseInt(m[2], 10) })),
  };
}

function localMatchItems(items, products) {
  return items.map((item) => {
    const key = item.medication_name.split(" ")[0].toLowerCase();
    const match = products.find((p) => p.name.toLowerCase().startsWith(key));
    if (!match) return { ...item, matched: false, stock_sufficient: false };
    return { ...item, database_id: match.product_id, led_address: match.led_address, price: match.price, in_stock: match.stock_count, requires_id: match.age_restricted, category: match.category, stock_sufficient: match.stock_count >= item.quantity_requested, matched: true };
  });
}

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const s = {
  root: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0a0f1c", color: "#e2e8f0", minHeight: "100vh" },
  topBar: { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", borderBottom: "1px solid #1e293b", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: { width: "30px", height: "30px", borderRadius: "7px", background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#0a0f1c" },
  section: { background: "#111827", borderRadius: "12px", padding: "20px", border: "1px solid #1e293b", marginBottom: "16px" },
  label: { fontSize: "12px", color: "#94a3b8", marginBottom: "12px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" },
  btn: (bg, color) => ({ padding: "11px 22px", borderRadius: "8px", border: "none", background: bg, color, cursor: "pointer", fontWeight: 700, fontSize: "13px", transition: "all 0.2s" }),
  btnOutline: { padding: "11px 22px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "13px" },
  input: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155", background: "#0a0f1c", color: "#e2e8f0", fontSize: "13px", boxSizing: "border-box", outline: "none" },
  tag: (bg, color) => ({ display: "inline-block", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: bg, color, marginLeft: "6px" }),
};

const SHELF_LAYOUT = [
  { label: "Shelf A — General", color: "#3b82f6", addrs: [["shelf_A_row_1_pos_1", "shelf_A_row_1_pos_2"], ["shelf_A_row_2_pos_1", "shelf_A_row_2_pos_2"]] },
  { label: "Shelf B — Specialty", color: "#8b5cf6", addrs: [["shelf_B_row_1_pos_1", "shelf_B_row_1_pos_2"], ["shelf_B_row_2_pos_1", "shelf_B_row_2_pos_2"]] },
  { label: "Shelf C — Controlled", color: "#ef4444", addrs: [["shelf_C_row_1_pos_1", "shelf_C_row_1_pos_2"], ["shelf_C_row_2_pos_1", "shelf_C_row_2_pos_2"]] },
];

const STEPS = ["Upload / Select", "Review OCR", "Verify ID", "Confirm Order", "Dispense"];

export default function MediLight() {
  const [products, setProducts] = useState(JSON.parse(JSON.stringify(SEED_PRODUCTS)));
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("ocr");
  const [ocrText, setOcrText] = useState("");
  const [ocrResult, setOcrResult] = useState(null);
  const [matched, setMatched] = useState([]);
  const [idOk, setIdOk] = useState(false);
  const [idForm, setIdForm] = useState({ name: "", id: "", dob: "" });
  const [activeLeds, setActiveLeds] = useState([]);
  const [blink, setBlink] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [qty, setQty] = useState({});
  const [lowAlerts, setLowAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("workflow");
  const [jsonLog, setJsonLog] = useState([]);
  const [deviceCount, setDeviceCount] = useState(0);
  const [backendOk, setBackendOk] = useState(false);

  useEffect(() => {
    if (!isConnected()) return;
    api("/api/health").then((d) => { setBackendOk(true); setDeviceCount(d.connected_devices || 0); }).catch(() => setBackendOk(false));
  }, []);

  useEffect(() => {
    if (!activeLeds.length) return;
    const t = setInterval(() => setBlink((b) => !b), 480);
    return () => clearInterval(t);
  }, [activeLeds]);

  const needsId = matched.some((i) => i.requires_id && i.matched);
  const log = (label, data) => setJsonLog((p) => [{ label, data, ts: new Date().toLocaleTimeString() }, ...p]);

  const runOCR = async () => {
    if (!ocrText.trim()) return;
    setBusy(true);
    try {
      let result, items;
      if (isConnected()) {
        const res = await api("/api/ocr/extract", { method: "POST", body: JSON.stringify({ ocr_text: ocrText }) });
        result = res.prescription_data; items = res.order_summary;
        log("OCR Extraction (Backend)", res);
      } else {
        result = localParseOCR(ocrText);
        items = localMatchItems(result.items, products);
        log("OCR Extraction (Local)", { prescription_data: result, order_summary: items });
      }
      setOcrResult(result); setMatched(items); setStep(1);
    } catch (e) { alert("OCR Error: " + e.message); }
    setBusy(false);
  };

  const toggleSel = (id) => {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    if (!qty[id]) setQty((q) => ({ ...q, [id]: 1 }));
  };

  const manualProceed = () => {
    if (!selected.length) return;
    const items = selected.map((id) => {
      const p = products.find((pr) => pr.product_id === id);
      const q = qty[id] || 1;
      return { medication_name: p.name, quantity_requested: q, database_id: p.product_id, led_address: p.led_address, price: p.price, in_stock: p.stock_count, requires_id: p.age_restricted, category: p.category, stock_sufficient: p.stock_count >= q, matched: true };
    });
    setOcrResult({ doctor_name: "Manual Selection", clinic: "—", patient_name: "Walk-in", date_issued: new Date().toLocaleDateString(), items: items.map((i) => ({ medication_name: i.medication_name, quantity_requested: i.quantity_requested })) });
    setMatched(items); log("Manual Selection", { items }); setStep(1);
  };

  const verifyId = async () => {
    if (!idForm.name || !idForm.id) return;
    setBusy(true);
    try {
      if (isConnected()) {
        const res = await api("/api/verify-id", { method: "POST", body: JSON.stringify({ patient_name: idForm.name, id_number: idForm.id, date_of_birth: idForm.dob }) });
        log("ID Verification (Backend)", res);
      } else {
        log("ID Verification (Local)", { status: "verified", patient_name: idForm.name });
      }
      setIdOk(true); setTimeout(() => setStep(3), 500);
    } catch (e) { alert("Verification Error: " + e.message); }
    setBusy(false);
  };

  const confirmOrder = async () => {
    setBusy(true);
    const confirmedItems = matched.filter((i) => i.matched);
    try {
      if (isConnected()) {
        const res = await api("/api/orders/confirm", {
          method: "POST",
          body: JSON.stringify({
            transaction_id: `txn_${Date.now().toString(36)}`,
            patient_name: ocrResult?.patient_name, doctor_name: ocrResult?.doctor_name,
            items: confirmedItems.map((i) => ({ database_id: i.database_id, quantity_requested: i.quantity_requested })),
            id_verified: idOk,
          }),
        });
        log("Order Confirmed (Backend)", res);
        log("LED Trigger Broadcast", res.hardware_payload);
        setDeviceCount(res.connected_devices || 0);
        if (res.low_stock_alerts?.length) setLowAlerts(res.low_stock_alerts);
        const inv = await api("/api/inventory");
        setProducts(inv.products.map((p) => ({ ...p, product_id: p.product_id })));
      } else {
        const updated = products.map((p) => {
          const oi = confirmedItems.find((i) => i.database_id === p.product_id);
          return oi ? { ...p, stock_count: Math.max(0, p.stock_count - oi.quantity_requested) } : p;
        });
        setLowAlerts(updated.filter((p) => p.stock_count <= p.reorder_threshold));
        setProducts(updated);
        const ledPayload = { command: "ACTIVATE_LEDS", activation_mode: "BLINK_FAST", duration_seconds: 30, color_hex: "#00FF00", targets: confirmedItems.map((i) => ({ led_address: i.led_address, item: i.medication_name })) };
        log("LED Trigger (Simulated)", ledPayload);
        log("Inventory Sync (Local)", { status: "completed", inventory_updated: true });
      }
      setActiveLeds(confirmedItems.map((i) => i.led_address));
      const total = confirmedItems.reduce((acc, i) => acc + i.price * i.quantity_requested, 0);
      setOrders((p) => [{ id: `txn_${Date.now().toString(36)}`, patient: ocrResult?.patient_name, doctor: ocrResult?.doctor_name, items: confirmedItems, total: parseFloat(total.toFixed(2)), timestamp: new Date().toLocaleString() }, ...p]);
      setStep(4);
    } catch (e) { alert("Confirm Error: " + e.message); }
    setBusy(false);
  };

  const reset = () => {
    setStep(0); setOcrText(""); setOcrResult(null); setMatched([]); setIdOk(false);
    setIdForm({ name: "", id: "", dob: "" }); setActiveLeds([]); setBlink(true);
    setSearch(""); setSelected([]); setQty({}); setLowAlerts([]); setBusy(false); setMode("ocr");
  };

  const fullReset = async () => {
    reset();
    if (isConnected()) { await api("/api/inventory/reset", { method: "POST" }); const inv = await api("/api/inventory"); setProducts(inv.products); }
    else setProducts(JSON.parse(JSON.stringify(SEED_PRODUCTS)));
    setOrders([]); setJsonLog([]);
  };

  const orderTotal = matched.filter((i) => i.matched).reduce((acc, i) => acc + i.price * i.quantity_requested, 0);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={s.root}>
      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>M</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>MediLight</div>
            <div style={{ fontSize: "9px", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dispensing System v2.0</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "6px", background: isConnected() && backendOk ? "#22c55e15" : "#1e293b", border: `1px solid ${isConnected() && backendOk ? "#22c55e44" : "#334155"}` }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isConnected() && backendOk ? "#22c55e" : "#eab308" }} />
            <span style={{ fontSize: "10px", fontWeight: 600, color: isConnected() && backendOk ? "#86efac" : "#fde68a" }}>
              {isConnected() ? (backendOk ? `Backend Connected · ${deviceCount} device${deviceCount !== 1 ? "s" : ""}` : "Backend Offline") : "Simulation Mode"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "3px", background: "#1e293b", borderRadius: "7px", padding: "3px" }}>
            {["workflow", "inventory", "orders", "json"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 12px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, textTransform: "capitalize", background: tab === t ? "#334155" : "transparent", color: tab === t ? "#f8fafc" : "#64748b" }}>
                {t === "json" ? "JSON Log" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "20px 16px" }}>

        {/* ══ WORKFLOW ══ */}
        {tab === "workflow" && (<div>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: "3px", marginBottom: "24px" }}>
            {STEPS.map((label, i) => {
              const skip = i === 2 && !needsId && step > 2;
              return (<div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: "3px", borderRadius: "2px", marginBottom: "6px", background: i < step ? "#22c55e" : i === step ? "#3b82f6" : skip ? "#475569" : "#1e293b", transition: "all 0.3s" }} />
                <div style={{ fontSize: "10px", fontWeight: i === step ? 700 : 500, color: i < step ? "#22c55e" : i === step ? "#93c5fd" : "#475569" }}>{skip ? "Skipped" : `${i + 1}. ${label}`}</div>
              </div>);
            })}
          </div>

          {/* Step 0: Input */}
          {step === 0 && (<div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button onClick={() => setMode("ocr")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: mode === "ocr" ? "2px solid #3b82f6" : "2px solid #1e293b", background: mode === "ocr" ? "#1e293b" : "#0f172a", color: mode === "ocr" ? "#93c5fd" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>📄 Upload Prescription</button>
              <button onClick={() => setMode("manual")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: mode === "manual" ? "2px solid #8b5cf6" : "2px solid #1e293b", background: mode === "manual" ? "#1e293b" : "#0f172a", color: mode === "manual" ? "#c4b5fd" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>🔍 Manual Select</button>
            </div>
            {mode === "ocr" && (
              <div style={s.section}>
                <div style={s.label}>Paste or Load a Prescription</div>
                <div style={{ display: "flex", gap: "5px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {SAMPLE_RX.map((rx, i) => (<button key={i} onClick={() => setOcrText(rx.text)} style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", cursor: "pointer", fontSize: "10px" }}>{rx.label}</button>))}
                </div>
                <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} placeholder="Paste prescription text here..." rows={7} style={{ ...s.input, fontFamily: "'Courier New', monospace", resize: "vertical" }} />
                <button onClick={runOCR} disabled={!ocrText.trim() || busy} style={{ ...s.btn(ocrText.trim() ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "#1e293b", ocrText.trim() ? "#fff" : "#475569"), marginTop: "10px", cursor: ocrText.trim() && !busy ? "pointer" : "default" }}>
                  {busy ? "⏳ Processing..." : "🔬 Extract Prescription Data"}
                </button>
              </div>
            )}
            {mode === "manual" && (
              <div style={s.section}>
                <div style={s.label}>Search & Select Medications</div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or category..." style={{ ...s.input, marginBottom: "10px" }} />
                <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {filtered.map((p) => {
                    const isSel = selected.includes(p.product_id);
                    return (<div key={p.product_id} onClick={() => toggleSel(p.product_id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "7px", border: isSel ? "1px solid #8b5cf6" : "1px solid #1e293b", background: isSel ? "#1e1b4b" : "#0f172a", cursor: "pointer" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: isSel ? "2px solid #8b5cf6" : "2px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", background: isSel ? "#8b5cf6" : "transparent", color: "#fff", fontSize: "11px", fontWeight: 800, flexShrink: 0 }}>{isSel && "✓"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}{p.age_restricted && <span style={s.tag("#dc262622", "#f87171")}>18+ ID</span>}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{p.category} · Stock: {p.stock_count} · ${p.price}</div>
                      </div>
                      {isSel && <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>Qty:</span>
                        <input type="number" min={1} max={p.stock_count} value={qty[p.product_id] || 1} onChange={(e) => setQty((q) => ({ ...q, [p.product_id]: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: "48px", padding: "3px 5px", borderRadius: "4px", border: "1px solid #334155", background: "#0a0f1c", color: "#e2e8f0", fontSize: "12px", textAlign: "center", outline: "none" }} />
                      </div>}
                    </div>);
                  })}
                </div>
                {selected.length > 0 && <button onClick={manualProceed} style={{ ...s.btn("linear-gradient(135deg,#7c3aed,#8b5cf6)", "#fff"), marginTop: "12px" }}>Proceed with {selected.length} item{selected.length > 1 ? "s" : ""} →</button>}
              </div>
            )}
          </div>)}

          {/* Step 1: Review */}
          {step === 1 && ocrResult && (<div>
            <div style={s.section}>
              <div style={s.label}>Extracted Prescription Data</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                {[["Doctor", ocrResult.doctor_name], ["Clinic", ocrResult.clinic], ["Patient", ocrResult.patient_name], ["Date", ocrResult.date_issued]].map(([l, v]) => (
                  <div key={l} style={{ background: "#0a0f1c", padding: "8px 12px", borderRadius: "7px", border: "1px solid #1e293b" }}>
                    <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>{l}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "1px" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={s.section}>
              <div style={s.label}>Matched Medications</div>
              {matched.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "7px", background: "#0a0f1c", border: `1px solid ${item.matched ? (item.requires_id ? "#dc262644" : "#1e293b") : "#ef444444"}`, marginBottom: "5px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.matched ? (item.stock_sufficient ? "#22c55e" : "#eab308") : "#ef4444", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.medication_name}{item.requires_id && <span style={s.tag("#dc262622", "#f87171")}>⚠ ID REQUIRED</span>}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{item.matched ? `Qty: ${item.quantity_requested} · $${item.price}/unit · Stock: ${item.in_stock}` : "❌ Not in database"}</div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: item.matched ? "#e2e8f0" : "#ef4444" }}>{item.matched ? `$${(item.price * item.quantity_requested).toFixed(2)}` : "—"}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", padding: "10px 12px", borderRadius: "7px", background: "#1e293b" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>ORDER TOTAL</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#22c55e" }}>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
            {needsId && <div style={{ background: "#dc262612", border: "1px solid #dc262644", borderRadius: "9px", padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>🛡️</span>
              <div><div style={{ fontSize: "12px", fontWeight: 700, color: "#f87171" }}>COMPLIANCE GATE — ID Required</div><div style={{ fontSize: "11px", color: "#fca5a5" }}>Controlled substances detected. Patient ID must be verified.</div></div>
            </div>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={reset} style={s.btnOutline}>← Back</button>
              <button onClick={() => setStep(needsId ? 2 : 3)} style={s.btn("linear-gradient(135deg,#2563eb,#3b82f6)", "#fff")}>{needsId ? "Proceed to ID Verification →" : "Proceed to Confirmation →"}</button>
            </div>
          </div>)}

          {/* Step 2: Verify ID */}
          {step === 2 && (<div style={{ maxWidth: "460px" }}>
            <div style={{ ...s.section, border: "1px solid #dc262644" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "7px", background: "#dc262622", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🛡️</div>
                <div><div style={{ fontSize: "14px", fontWeight: 700 }}>Patient ID Verification</div><div style={{ fontSize: "11px", color: "#f87171" }}>Required for controlled substances</div></div>
              </div>
              {!idOk ? (<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="text" placeholder="Patient Full Name" value={idForm.name} onChange={(e) => setIdForm((f) => ({ ...f, name: e.target.value }))} style={s.input} />
                <input type="text" placeholder="Government ID Number" value={idForm.id} onChange={(e) => setIdForm((f) => ({ ...f, id: e.target.value }))} style={s.input} />
                <input type="date" value={idForm.dob} onChange={(e) => setIdForm((f) => ({ ...f, dob: e.target.value }))} style={s.input} />
                <button onClick={verifyId} disabled={!idForm.name || !idForm.id || busy} style={{ ...s.btn(idForm.name && idForm.id ? "#dc2626" : "#1e293b", idForm.name && idForm.id ? "#fff" : "#475569"), marginTop: "4px", cursor: idForm.name && idForm.id && !busy ? "pointer" : "default" }}>{busy ? "Verifying..." : "🔐 Verify Patient Identity"}</button>
              </div>) : (<div style={{ background: "#22c55e12", border: "1px solid #22c55e44", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>✅</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>Identity Verified</div>
              </div>)}
            </div>
          </div>)}

          {/* Step 3: Confirm */}
          {step === 3 && (<div>
            <div style={s.section}>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "3px" }}>⚡ Ready to Dispense</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                Confirm to broadcast LED signal{isConnected() ? ` to ${deviceCount} connected device${deviceCount !== 1 ? "s" : ""}` : " (simulation mode)"}.
              </div>
              <div style={{ background: "#0a0f1c", borderRadius: "7px", padding: "12px", border: "1px solid #1e293b", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>Patient: <strong style={{ color: "#e2e8f0" }}>{ocrResult?.patient_name}</strong> · Doctor: <strong style={{ color: "#e2e8f0" }}>{ocrResult?.doctor_name}</strong></div>
                {matched.filter((i) => i.matched).map((item, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: i ? "1px solid #1e293b" : "none", fontSize: "12px" }}><span>{item.medication_name} × {item.quantity_requested}</span><span style={{ color: "#94a3b8", fontWeight: 600 }}>${(item.price * item.quantity_requested).toFixed(2)}</span></div>))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "2px solid #334155", marginTop: "6px", fontWeight: 800 }}><span style={{ color: "#94a3b8" }}>TOTAL</span><span style={{ color: "#22c55e", fontSize: "15px" }}>${orderTotal.toFixed(2)}</span></div>
              </div>
              {idOk && <div style={{ fontSize: "11px", color: "#22c55e", marginBottom: "12px" }}>✅ Patient ID verified</div>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setStep(1)} style={s.btnOutline}>← Back</button>
                <button onClick={confirmOrder} disabled={busy} style={{ ...s.btn("linear-gradient(135deg,#16a34a,#22c55e)", "#fff"), flex: 1, fontSize: "14px", cursor: busy ? "default" : "pointer" }}>
                  {busy ? "⏳ Processing..." : "✅ CONFIRM & ACTIVATE LEDs"}
                </button>
              </div>
            </div>
          </div>)}

          {/* Step 4: Dispense */}
          {step === 4 && (<div>
            <div style={{ background: "#22c55e10", border: "1px solid #22c55e33", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>💡</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>
                  LEDs ACTIVATED {isConnected() ? `— Signal sent to ${deviceCount} device${deviceCount !== 1 ? "s" : ""}` : "— Simulation Mode"}
                </div>
                <div style={{ fontSize: "11px", color: "#86efac" }}>
                  {isConnected() ? "Shelf device is now blinking. Open it on a second screen to see." : "Simulated shelf below. Connect backend to broadcast to real shelf device."}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {SHELF_LAYOUT.map((shelf) => (
                <div key={shelf.label} style={s.section}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: shelf.color, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{shelf.label}</div>
                  {shelf.addrs.map((row, ri) => (
                    <div key={ri} style={{ display: "flex", gap: "5px", marginBottom: ri < shelf.addrs.length - 1 ? "5px" : 0 }}>
                      {row.map((addr) => {
                        const prod = products.find((p) => p.led_address === addr);
                        const on = activeLeds.includes(addr);
                        const glow = on && blink;
                        return (<div key={addr} style={{ flex: 1, padding: "12px 10px", borderRadius: "8px", textAlign: "center", position: "relative", background: glow ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#0a0f1c", border: on ? "2px solid #22c55e" : "1px solid #1e293b", boxShadow: glow ? "0 0 20px #22c55e55" : "none", transition: "all 0.2s" }}>
                          {on && <div style={{ position: "absolute", top: 5, right: 7, width: 7, height: 7, borderRadius: "50%", background: glow ? "#fff" : "#22c55e", boxShadow: glow ? "0 0 5px #fff" : "none" }} />}
                          <div style={{ fontSize: "12px", fontWeight: 700, color: glow ? "#052e16" : "#e2e8f0" }}>{prod?.name || "Empty"}</div>
                          <div style={{ fontSize: "9px", color: glow ? "#065f46" : "#475569", marginTop: "3px" }}>Stock: {prod?.stock_count ?? "—"}</div>
                        </div>);
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {lowAlerts.length > 0 && <div style={{ background: "#eab30810", border: "1px solid #eab30833", borderRadius: "8px", padding: "12px 16px", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#eab308", marginBottom: "6px" }}>⚠ Low Stock Alerts</div>
              {lowAlerts.map((a, i) => <div key={i} style={{ fontSize: "11px", color: "#fde68a" }}>{a.medication_name || a.name}: <strong>{a.remaining_stock || a.stock_count}</strong> left</div>)}
            </div>}
            <button onClick={reset} style={s.btnOutline}>🔄 New Order</button>
          </div>)}
        </div>)}

        {/* ══ INVENTORY ══ */}
        {tab === "inventory" && (<div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>Inventory Dashboard</div>
            <button onClick={fullReset} style={{ ...s.btnOutline, fontSize: "10px", padding: "6px 12px" }}>Reset All Data</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "8px" }}>
            {products.map((p) => {
              const low = p.stock_count <= (p.reorder_threshold || 20);
              return (<div key={p.product_id} style={{ background: "#111827", borderRadius: "9px", padding: "12px", border: low ? "1px solid #eab30844" : "1px solid #1e293b" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: "12px", fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: "10px", color: "#64748b", marginTop: "1px" }}>{p.category} · ${p.price}</div></div>
                  {p.age_restricted && <span style={s.tag("#dc262622", "#f87171")}>CTRL</span>}
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginBottom: "3px" }}><span>Stock</span><span style={{ color: low ? "#eab308" : "#22c55e", fontWeight: 700 }}>{p.stock_count}</span></div>
                  <div style={{ height: "3px", background: "#1e293b", borderRadius: "2px", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (p.stock_count / 200) * 100)}%`, background: low ? "#eab308" : "#22c55e", borderRadius: "2px" }} /></div>
                </div>
              </div>);
            })}
          </div>
        </div>)}

        {/* ══ ORDERS ══ */}
        {tab === "orders" && (<div>
          <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>Order History</div>
          {!orders.length ? <div style={{ textAlign: "center", padding: "36px", color: "#475569", fontSize: "13px" }}>No orders yet.</div> : orders.map((o) => (
            <div key={o.id} style={{ ...s.section, marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div><span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{o.id}</span><div style={{ fontSize: "13px", fontWeight: 700, marginTop: "1px" }}>{o.patient} — Dr. {o.doctor}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: "15px", fontWeight: 800, color: "#22c55e" }}>${o.total.toFixed(2)}</div><div style={{ fontSize: "9px", color: "#475569" }}>{o.timestamp}</div></div>
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{o.items.map((it, i) => <span key={i} style={{ fontSize: "10px", background: "#1e293b", color: "#94a3b8", padding: "2px 7px", borderRadius: "4px" }}>{it.medication_name} ×{it.quantity_requested}</span>)}</div>
            </div>
          ))}
        </div>)}

        {/* ══ JSON LOG ══ */}
        {tab === "json" && (<div>
          <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "3px" }}>API Payloads</div>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}>Every payload between Dashboard ↔ Backend ↔ Shelf Device.</div>
          {!jsonLog.length ? <div style={{ textAlign: "center", padding: "36px", color: "#475569", fontSize: "13px" }}>Run a workflow to see payloads.</div> : jsonLog.map((e, i) => (
            <div key={i} style={{ background: "#111827", borderRadius: "9px", border: "1px solid #1e293b", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ padding: "8px 12px", background: "#1e293b", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "11px", fontWeight: 700, color: "#93c5fd" }}>{e.label}</span><span style={{ fontSize: "9px", color: "#475569", fontFamily: "monospace" }}>{e.ts}</span></div>
              <pre style={{ padding: "10px 12px", margin: 0, fontSize: "10px", color: "#94a3b8", fontFamily: "'Courier New', monospace", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "220px", overflowY: "auto" }}>{JSON.stringify(e.data, null, 2)}</pre>
            </div>
          ))}
        </div>)}
      </div>
    </div>
  );
}
