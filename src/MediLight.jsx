// src/MediLight.jsx — Main orchestrator
// All rendering delegated to components. This file manages state + actions.

import { useState, useEffect } from "react";
import { s } from "./utils/constants";
import { api, retryApi, isConnected } from "./utils/api";
import { extractPHILocally } from "./utils/privacy";
import { localParseOCR, localMatchItems, matchAIResultToProducts } from "./utils/parsers";
import { interpretWithAI, interpretImageWithAI } from "./utils/ai";
import { runOCROnImage } from "./utils/tesseract";

import StatusBar from "./components/StatusBar";
import PrivacyModal from "./components/PrivacyModal";
import WorkflowTab from "./components/WorkflowTab";
import InventoryTab from "./components/InventoryTab";
import OrdersTab from "./components/OrdersTab";
import JsonLog from "./components/JsonLog";

export default function MediLight() {
  // ─── Privacy ──────────────────────────────────────────────
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // ─── Core state ───────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
  const [dbConnected, setDbConnected] = useState(false);
  const [uploadMode, setUploadMode] = useState("scan");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [ocrProgress, setOcrProgress] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [processingStage, setProcessingStage] = useState("");

  // ─── Helpers ──────────────────────────────────────────────
  const log = (label, data) =>
    setJsonLog((p) => [{ label, data, ts: new Date().toLocaleTimeString() }, ...p]);

  const needsId = matched.some((i) => i.requires_id && i.matched);
  const orderTotal = matched
    .filter((i) => i.matched)
    .reduce((acc, i) => acc + i.price * i.quantity_requested, 0);

  // ─── Load from database on mount ─────────────────────────
  useEffect(() => {
    if (!isConnected()) {
      setLoading(false);
      setLoadError("No backend URL configured.");
      return;
    }
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const health = await retryApi("/api/health");
        setBackendOk(true);
        setDeviceCount(health.connected_devices || 0);
        setDbConnected(health.database === "connected");

        if (health.database !== "connected") {
          setLoadError("Backend online but database not connected. Check DATABASE_URL.");
          setLoading(false);
          return;
        }

        let inv = await api("/api/inventory");
        if (!inv.products?.length) {
          await api("/api/inventory/reset", { method: "POST" });
          inv = await api("/api/inventory");
        }

        if (inv.products?.length) {
          setProducts(inv.products.map((p) => ({ ...p, price: parseFloat(p.price) })));
        } else {
          setLoadError("Could not load inventory.");
        }

        const ordData = await api("/api/orders");
        if (ordData.orders?.length) {
          setOrders(
            ordData.orders.map((o) => ({
              id: o.transaction_id,
              patient: o.patient_name,
              doctor: o.doctor_name,
              items: (o.items || []).map((it) => ({
                medication_name: it.medication_name,
                quantity_requested: it.quantity,
              })),
              total: parseFloat(o.total),
              timestamp: new Date(o.created_at).toLocaleString(),
            }))
          );
        }
      } catch (err) {
        setBackendOk(false);
        setLoadError(`Cannot reach backend: ${err.message}`);
      }
      setLoading(false);
    })();
  }, []);

  // LED blink animation
  useEffect(() => {
    if (!activeLeds.length) return;
    const t = setInterval(() => setBlink((b) => !b), 480);
    return () => clearInterval(t);
  }, [activeLeds]);

  // ─── Actions ──────────────────────────────────────────────

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setOcrProgress("");
    setOcrText("");
    setProcessingStage("");
    setAiNotes("");
  };

  const requireConsent = (callback) => {
    if (privacyAccepted) { callback(); return; }
    setShowPrivacyModal(true);
    window._privacyCallback = callback;
  };

  const acceptPrivacy = () => {
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
    if (window._privacyCallback) {
      window._privacyCallback();
      window._privacyCallback = null;
    }
  };

  // Image processing pipeline (Gemini AI Vision → Tesseract → Gemini AI Text → Local regex)
  const processImage = async () => {
    if (!imagePreview) return;
    setBusy(true);
    try {
      const mediaTypeMatch = imagePreview.match(/^data:(image\/[^;]+);base64,/);
      const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : "image/jpeg";
      const base64Data = imagePreview.split(",")[1];

      // Step 1: Gemini AI Vision
      setProcessingStage("ai_vision");
      setOcrProgress("AI analyzing image (PHI protected)...");
      try {
        const aiResult = await interpretImageWithAI(base64Data, mediaType, products);
        log("Gemini AI Vision — Privacy-Safe Analysis", aiResult);
        setOcrProgress("AI analysis complete!");
        setAiNotes(aiResult.notes || "");

        let localPHI = { doctor_name: "See prescription", clinic: "See prescription", patient_name: "See prescription", date_issued: "See prescription" };
        try {
          const quickText = await runOCROnImage(imagePreview);
          localPHI = extractPHILocally(quickText);
        } catch { /* use defaults */ }

        const matchedItems = matchAIResultToProducts(aiResult, products);
        log("AI Medication Matching", { phi_kept_local: true, matched_items: matchedItems });
        setOcrResult(localPHI); setMatched(matchedItems); setProcessingStage(""); setOcrProgress(""); setBusy(false); setStep(1);
        return;
      } catch (visionErr) {
        console.warn("AI Vision failed, falling back:", visionErr);
        log("AI Vision Fallback", { error: visionErr.message });
      }

      // Step 2: Tesseract OCR
      setProcessingStage("tesseract");
      setOcrProgress("Extracting text locally with Tesseract...");
      const extractedText = await runOCROnImage(imagePreview);
      setOcrText(extractedText);
      log("Tesseract OCR (Local)", { text_length: extractedText.length });
      if (!extractedText.trim()) { setOcrProgress("No text detected."); setBusy(false); return; }

      const localPHI = extractPHILocally(extractedText);

      // Step 3: Gemini AI text (PHI redacted)
      setProcessingStage("ai_text");
      setOcrProgress("AI interpreting (PHI redacted)...");
      try {
        const aiResult = await interpretWithAI(extractedText, products);
        log("Gemini AI Text — PHI Redacted", { redacted_text_sent: true, result: aiResult });
        setAiNotes(aiResult.notes || "");
        const matchedItems = matchAIResultToProducts(aiResult, products);
        setOcrResult(localPHI); setMatched(matchedItems); setOcrProgress(""); setProcessingStage(""); setBusy(false); setStep(1);
        return;
      } catch (aiErr) {
        console.warn("Gemini AI text failed:", aiErr);
        log("Gemini AI Fallback", { error: aiErr.message });
      }

      // Step 4: Local regex
      setProcessingStage("local");
      setOcrProgress("Using local parser...");
      const localResult = localParseOCR(extractedText);
      const localMatched = localMatchItems(localResult.items, products);
      log("Local Parser Fallback", { prescription_data: localResult, matched_items: localMatched });
      setOcrResult(localResult); setMatched(localMatched); setOcrProgress(""); setProcessingStage(""); setBusy(false); setStep(1);
    } catch (err) {
      setOcrProgress("Processing failed: " + err.message);
      setProcessingStage(""); setBusy(false);
    }
  };

  // Text-mode OCR
  const runOCR = async () => {
    if (!ocrText.trim()) return;
    setBusy(true);
    try {
      const localPHI = extractPHILocally(ocrText);
      let items;
      setOcrProgress("AI analyzing (PHI redacted)...");
      try {
        const aiResult = await interpretWithAI(ocrText, products);
        log("Gemini AI — PHI Redacted", aiResult);
        setAiNotes(aiResult.notes || "");
        items = matchAIResultToProducts(aiResult, products);
      } catch (aiErr) {
        console.warn("Gemini AI failed:", aiErr);
        log("Gemini AI Fallback", { error: aiErr.message });
        if (isConnected() && backendOk) {
          const res = await api("/api/ocr/extract", { method: "POST", body: JSON.stringify({ ocr_text: ocrText }) });
          items = res.order_summary;
          log("OCR Extraction (Backend)", res);
        } else {
          const result = localParseOCR(ocrText);
          items = localMatchItems(result.items, products);
          log("OCR Extraction (Local)", { order_summary: items });
        }
      }
      setOcrProgress(""); setOcrResult(localPHI); setMatched(items); setStep(1);
    } catch (e) { alert("OCR Error: " + e.message); }
    setBusy(false);
  };

  const toggleSel = (id) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    if (!qty[id]) setQty((q) => ({ ...q, [id]: 1 }));
  };

  const manualProceed = () => {
    if (!selected.length) return;
    const items = selected.map((id) => {
      const p = products.find((pr) => pr.product_id === id);
      const q = qty[id] || 1;
      return { medication_name: p.name, quantity_requested: q, database_id: p.product_id, led_address: p.led_address, price: parseFloat(p.price), in_stock: p.stock_count, requires_id: p.age_restricted, category: p.category, stock_sufficient: p.stock_count >= q, matched: true };
    });
    setOcrResult({ doctor_name: "Manual Selection", clinic: "—", patient_name: "Walk-in", date_issued: new Date().toLocaleDateString() });
    setMatched(items); log("Manual Selection", { items }); setStep(1);
  };

  const verifyId = async () => {
    if (!idForm.name || !idForm.id) return;
    setBusy(true);
    try {
      if (isConnected() && backendOk) {
        const res = await api("/api/verify-id", { method: "POST", body: JSON.stringify({ patient_name: idForm.name, id_number: idForm.id, date_of_birth: idForm.dob }) });
        log("ID Verification (Backend)", res);
      } else {
        log("ID Verification (Offline)", { status: "verified_locally", patient_name: idForm.name });
      }
      setIdOk(true); setTimeout(() => setStep(3), 500);
    } catch (e) { alert("Verification Error: " + e.message); }
    setBusy(false);
  };

  const confirmOrder = async () => {
    if (!backendOk) { alert("Cannot confirm — backend not connected."); return; }
    setBusy(true);
    const confirmedItems = matched.filter((i) => i.matched);
    const txnId = `txn_${Date.now().toString(36)}`;
    try {
      const res = await api("/api/orders/confirm", {
        method: "POST",
        body: JSON.stringify({
          transaction_id: txnId,
          patient_name: ocrResult?.patient_name,
          doctor_name: ocrResult?.doctor_name,
          clinic: ocrResult?.clinic,
          items: confirmedItems.map((i) => ({ database_id: i.database_id, quantity_requested: i.quantity_requested })),
          id_verified: idOk,
        }),
      });
      log("Order Confirmed (Database)", res);
      log("LED Trigger Broadcast", res.hardware_payload);
      setDeviceCount(res.connected_devices || 0);
      if (res.low_stock_alerts?.length) setLowAlerts(res.low_stock_alerts);

      const inv = await api("/api/inventory");
      setProducts(inv.products.map((p) => ({ ...p, price: parseFloat(p.price) })));

      setActiveLeds(confirmedItems.map((i) => i.led_address));
      const total = confirmedItems.reduce((acc, i) => acc + i.price * i.quantity_requested, 0);
      setOrders((p) => [{ id: txnId, patient: ocrResult?.patient_name, doctor: ocrResult?.doctor_name, items: confirmedItems, total: parseFloat(total.toFixed(2)), timestamp: new Date().toLocaleString() }, ...p]);
      setStep(4);
    } catch (e) { alert("Confirm Error: " + e.message); }
    setBusy(false);
  };

  const reset = () => {
    setStep(0); setOcrText(""); setOcrResult(null); setMatched([]); setIdOk(false);
    setIdForm({ name: "", id: "", dob: "" }); setActiveLeds([]); setBlink(true);
    setSearch(""); setSelected([]); setQty({}); setLowAlerts([]); setBusy(false); setMode("ocr");
    setImageFile(null); setImagePreview(null); setOcrProgress(""); setUploadMode("scan");
    setAiNotes(""); setProcessingStage("");
  };

  const fullReset = async () => {
    reset();
    if (isConnected() && backendOk) {
      try {
        await api("/api/inventory/reset", { method: "POST" });
        const inv = await api("/api/inventory");
        setProducts(inv.products.map((p) => ({ ...p, price: parseFloat(p.price) })));
        setLoadError("");
      } catch (err) {
        setLoadError("Reset failed: " + err.message);
      }
    } else {
      setLoadError("Cannot reset — backend not connected.");
    }
    setOrders([]); setJsonLog([]);
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={s.root}>
      {showPrivacyModal && (
        <PrivacyModal
          onAccept={acceptPrivacy}
          onCancel={() => { setShowPrivacyModal(false); window._privacyCallback = null; }}
        />
      )}

      <StatusBar
        backendOk={backendOk}
        dbConnected={dbConnected}
        deviceCount={deviceCount}
        tab={tab}
        setTab={setTab}
      />

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "20px 16px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8" }}>Connecting to MediLight backend...</div>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Loading inventory from database</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && loadError && (
          <div style={{ background: "#dc262612", border: "1px solid #dc262644", borderRadius: "10px", padding: "16px 20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px", marginTop: "2px" }}>⚠️</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#f87171", marginBottom: "4px" }}>Connection Issue</div>
                <div style={{ fontSize: "12px", color: "#fca5a5", lineHeight: "1.6" }}>{loadError}</div>
                <button onClick={() => window.location.reload()} style={{ ...s.btn("#dc2626", "#fff"), marginTop: "10px", fontSize: "11px", padding: "7px 16px" }}>🔄 Retry Connection</button>
              </div>
            </div>
          </div>
        )}

        {!loading && !loadError && products.length === 0 && (
          <div style={{ background: "#eab30812", border: "1px solid #eab30833", borderRadius: "10px", padding: "16px 20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>📦</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#eab308", marginBottom: "4px" }}>Inventory Loading...</div>
                <div style={{ fontSize: "12px", color: "#fde68a", lineHeight: "1.6" }}>The database may still be initializing.</div>
                <button onClick={() => window.location.reload()} style={{ ...s.btn("#eab308", "#000"), marginTop: "10px", fontSize: "11px", padding: "7px 16px" }}>🔄 Retry</button>
              </div>
            </div>
          </div>
        )}

        {tab === "workflow" && !loading && (
          <WorkflowTab
            step={step} setStep={setStep}
            mode={mode} setMode={setMode}
            ocrText={ocrText} setOcrText={setOcrText}
            ocrResult={ocrResult} matched={matched}
            idOk={idOk} idForm={idForm} setIdForm={setIdForm}
            activeLeds={activeLeds} blink={blink}
            search={search} setSearch={setSearch}
            selected={selected} setSelected={setSelected}
            qty={qty} setQty={setQty}
            lowAlerts={lowAlerts}
            busy={busy}
            backendOk={backendOk} deviceCount={deviceCount} dbConnected={dbConnected}
            uploadMode={uploadMode} setUploadMode={setUploadMode}
            imagePreview={imagePreview} ocrProgress={ocrProgress}
            processingStage={processingStage} aiNotes={aiNotes}
            products={products}
            needsId={needsId} orderTotal={orderTotal}
            onRequireConsent={requireConsent}
            onClearImage={clearImage}
            onProcessImage={processImage}
            onRunOCR={runOCR}
            onToggleSel={toggleSel}
            onManualProceed={manualProceed}
            onVerifyId={verifyId}
            onConfirmOrder={confirmOrder}
            onReset={reset}
            onImageSelect={handleImageSelect}
          />
        )}

        {tab === "inventory" && !loading && (
          <InventoryTab products={products} dbConnected={dbConnected} onFullReset={fullReset} />
        )}

        {tab === "orders" && !loading && (
          <OrdersTab orders={orders} dbConnected={dbConnected} />
        )}

        {tab === "json" && !loading && (
          <JsonLog jsonLog={jsonLog} />
        )}
      </div>
    </div>
  );
}