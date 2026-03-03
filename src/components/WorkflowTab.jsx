// src/components/WorkflowTab.jsx — 5-step prescription processing pipeline
// Step 0: Upload/Select → Step 1: Review OCR → Step 2: Verify ID
// Step 3: Confirm Order → Step 4: Dispense (LED activation)

import { useRef } from "react";
import { s, SAMPLE_RX, STEPS, SHELF_LAYOUT, CONFIDENCE_COLORS } from "../utils/constants";

export default function WorkflowTab({
  // State
  step, setStep,
  mode, setMode,
  ocrText, setOcrText,
  ocrResult, matched,
  idOk, idForm, setIdForm,
  activeLeds, blink,
  search, setSearch,
  selected, setSelected,
  qty, setQty,
  lowAlerts,
  busy,
  backendOk, deviceCount, dbConnected,
  uploadMode, setUploadMode,
  imagePreview, ocrProgress, processingStage, aiNotes,
  products,
  // Derived
  needsId, orderTotal,
  // Actions
  onRequireConsent, onClearImage, onProcessImage, onRunOCR,
  onToggleSel, onManualProceed, onVerifyId, onConfirmOrder, onReset,
  onImageSelect,
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onImageSelect} style={{ display: "none" }} />
      <input ref={galleryInputRef} type="file" accept="image/*,.pdf" onChange={onImageSelect} style={{ display: "none" }} />

      {/* Step progress bar */}
      <div style={{ display: "flex", gap: "3px", marginBottom: "24px" }}>
        {STEPS.map((label, i) => {
          const skip = i === 2 && !needsId && step > 2;
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: "3px", borderRadius: "2px", marginBottom: "6px", background: i < step ? "#22c55e" : i === step ? "#3b82f6" : skip ? "#475569" : "#1e293b", transition: "all 0.3s" }} />
              <div style={{ fontSize: "10px", fontWeight: i === step ? 700 : 500, color: i < step ? "#22c55e" : i === step ? "#93c5fd" : "#475569" }}>
                {skip ? "Skipped" : `${i + 1}. ${label}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 0: Input ── */}
      {step === 0 && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button onClick={() => setMode("ocr")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: mode === "ocr" ? "2px solid #3b82f6" : "2px solid #1e293b", background: mode === "ocr" ? "#1e293b" : "#0f172a", color: mode === "ocr" ? "#93c5fd" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
              📄 Upload Prescription
            </button>
            <button onClick={() => setMode("manual")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: mode === "manual" ? "2px solid #8b5cf6" : "2px solid #1e293b", background: mode === "manual" ? "#1e293b" : "#0f172a", color: mode === "manual" ? "#c4b5fd" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
              🔍 Manual Select
            </button>
          </div>

          {mode === "ocr" && (
            <div style={s.section}>
              <div style={s.label}>Scan or Upload Prescription</div>

              {/* Privacy notice */}
              <div style={{ background: "#dc262610", border: "1px solid #dc262633", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>🔒</span>
                <div style={{ fontSize: "11px", color: "#fca5a5", lineHeight: "1.5" }}>
                  <strong>Privacy Mode Active</strong> — Patient names & doctor details stay on your device. Only medication data is sent to AI.
                </div>
              </div>

              {/* Upload mode switcher */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "#0a0f1c", borderRadius: "8px", padding: "4px" }}>
                {[{ key: "scan", icon: "📷", label: "Camera" }, { key: "gallery", icon: "🖼️", label: "Gallery" }, { key: "paste", icon: "📋", label: "Paste Text" }].map((m) => (
                  <button key={m.key} onClick={() => setUploadMode(m.key)} style={{ flex: 1, padding: "10px 8px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: uploadMode === m.key ? "#334155" : "transparent", color: uploadMode === m.key ? "#f8fafc" : "#64748b" }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {/* Camera / Gallery */}
              {(uploadMode === "scan" || uploadMode === "gallery") && (
                <div>
                  {!imagePreview ? (
                    <div
                      onClick={() => onRequireConsent(() => uploadMode === "scan" ? cameraInputRef.current?.click() : galleryInputRef.current?.click())}
                      style={{ border: "2px dashed #334155", borderRadius: "12px", padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#0a0f1c" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#0f172a"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "#0a0f1c"; }}
                    >
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>{uploadMode === "scan" ? "📷" : "🖼️"}</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "4px" }}>
                        {uploadMode === "scan" ? "Tap to Open Camera" : "Tap to Choose Image"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Supports JPG, PNG, HEIC</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", padding: "5px 12px", borderRadius: "20px", background: "linear-gradient(135deg, #6366f115, #8b5cf615)", border: "1px solid #6366f133" }}>
                        <span style={{ fontSize: "11px" }}>✨</span>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#a5b4fc" }}>Gemini AI + Tesseract OCR · PHI Auto-Redacted</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid #334155", marginBottom: "12px" }}>
                        <img src={imagePreview} alt="Prescription" style={{ width: "100%", maxHeight: "300px", objectFit: "contain", display: "block", background: "#0a0f1c" }} />
                        {!busy && (
                          <button onClick={onClearImage} style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.7)", color: "#fff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Processing pipeline indicator */}
                      {busy && (
                        <div style={{ background: "#0f172a", borderRadius: "10px", padding: "16px", marginBottom: "12px", border: "1px solid #1e293b" }}>
                          <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
                            {[{ key: "ai_vision", label: "AI Vision", icon: "👁️" }, { key: "tesseract", label: "Local OCR", icon: "📸" }, { key: "ai_text", label: "AI (Redacted)", icon: "🤖" }, { key: "local", label: "Local Parse", icon: "⚙️" }].map((stg) => {
                              const isCurrent = processingStage === stg.key;
                              const stageOrder = ["ai_vision", "tesseract", "ai_text", "local"];
                              const isPast = stageOrder.indexOf(stg.key) < stageOrder.indexOf(processingStage);
                              return (
                                <div key={stg.key} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: "6px", background: isCurrent ? "#1e293b" : "transparent", border: isCurrent ? "1px solid #334155" : "1px solid transparent", opacity: isCurrent ? 1 : isPast ? 0.4 : 0.25 }}>
                                  <div style={{ fontSize: "14px", marginBottom: "2px" }}>{stg.icon}</div>
                                  <div style={{ fontSize: "9px", fontWeight: 700, color: isCurrent ? "#93c5fd" : "#475569" }}>{stg.label}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="spin-anim" style={{ width: "18px", height: "18px", border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", color: "#93c5fd", fontWeight: 600 }}>{ocrProgress}</span>
                          </div>
                        </div>
                      )}

                      {!busy && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={onProcessImage} style={{ ...s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)", "#fff"), flex: 1 }}>
                            ✨ Analyze (PHI Protected)
                          </button>
                          <button onClick={() => { onClearImage(); uploadMode === "scan" ? cameraInputRef.current?.click() : galleryInputRef.current?.click(); }} style={s.btnOutline}>
                            ↻ Retake
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Paste Text */}
              {uploadMode === "paste" && (
                <div>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "10px", flexWrap: "wrap" }}>
                    {SAMPLE_RX.map((rx, i) => (
                      <button key={i} onClick={() => setOcrText(rx.text)} style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", cursor: "pointer", fontSize: "10px" }}>
                        {rx.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} placeholder="Paste prescription text here..." rows={7} style={{ ...s.input, fontFamily: "'Courier New', monospace", resize: "vertical" }} />
                  {busy && ocrProgress && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", padding: "10px 14px", borderRadius: "8px", background: "#0f172a", border: "1px solid #1e293b" }}>
                      <div className="spin-anim" style={{ width: "16px", height: "16px", border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%" }} />
                      <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 600 }}>{ocrProgress}</span>
                    </div>
                  )}
                  <button onClick={onRunOCR} disabled={!ocrText.trim() || busy} style={{ ...s.btn(ocrText.trim() && !busy ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e293b", ocrText.trim() && !busy ? "#fff" : "#475569"), marginTop: "10px", cursor: ocrText.trim() && !busy ? "pointer" : "default" }}>
                    {busy ? "⏳ Processing..." : "✨ Extract with AI (PHI Redacted)"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual selection */}
          {mode === "manual" && (
            <div style={s.section}>
              <div style={s.label}>Search & Select Medications</div>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or category..." style={{ ...s.input, marginBottom: "10px" }} />
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                {filtered.map((p) => {
                  const isSel = selected.includes(p.product_id);
                  return (
                    <div key={p.product_id} onClick={() => onToggleSel(p.product_id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "7px", border: isSel ? "1px solid #8b5cf6" : "1px solid #1e293b", background: isSel ? "#1e1b4b" : "#0f172a", cursor: "pointer" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: isSel ? "2px solid #8b5cf6" : "2px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", background: isSel ? "#8b5cf6" : "transparent", color: "#fff", fontSize: "11px", fontWeight: 800, flexShrink: 0 }}>
                        {isSel && "✓"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>
                          {p.name}
                          {p.age_restricted && <span style={s.tag("#dc262622", "#f87171")}>18+ ID</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {p.category} · Stock: {p.stock_count} · ${p.price}
                        </div>
                      </div>
                      {isSel && (
                        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>Qty:</span>
                          <input type="number" min={1} max={p.stock_count} value={qty[p.product_id] || 1} onChange={(e) => setQty((q) => ({ ...q, [p.product_id]: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: "48px", padding: "3px 5px", borderRadius: "4px", border: "1px solid #334155", background: "#0a0f1c", color: "#e2e8f0", fontSize: "12px", textAlign: "center", outline: "none" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selected.length > 0 && (
                <button onClick={onManualProceed} style={{ ...s.btn("linear-gradient(135deg,#7c3aed,#8b5cf6)", "#fff"), marginTop: "12px" }}>
                  Proceed with {selected.length} item{selected.length > 1 ? "s" : ""} →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 1: Review ── */}
      {step === 1 && ocrResult && (
        <div>
          {aiNotes && (
            <div style={{ background: "#6366f112", border: "1px solid #6366f133", borderRadius: "9px", padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "14px", marginTop: "1px" }}>✨</span>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", marginBottom: "2px" }}>AI Analysis Notes</div>
                <div style={{ fontSize: "11px", color: "#c7d2fe", lineHeight: "1.5" }}>{aiNotes}</div>
              </div>
            </div>
          )}

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
            <div style={{ background: "#22c55e08", border: "1px solid #22c55e22", borderRadius: "6px", padding: "6px 10px", marginBottom: "12px", fontSize: "10px", color: "#86efac" }}>
              🔒 Patient details extracted locally — never sent to cloud AI
            </div>
          </div>

          <div style={s.section}>
            <div style={s.label}>Matched Medications</div>
            {matched.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "7px", background: "#0a0f1c", border: `1px solid ${item.matched ? (item.requires_id ? "#dc262644" : "#1e293b") : "#ef444444"}`, marginBottom: "5px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.matched ? (item.stock_sufficient ? "#22c55e" : "#eab308") : "#ef4444", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>
                    {item.medication_name}
                    {item.requires_id && <span style={s.tag("#dc262622", "#f87171")}>⚠ ID REQUIRED</span>}
                    {item.confidence && <span style={{ ...s.tag(CONFIDENCE_COLORS[item.confidence] + "18", CONFIDENCE_COLORS[item.confidence]), marginLeft: "4px" }}>{item.confidence === "high" ? "✓" : item.confidence === "medium" ? "~" : "?"} {item.confidence}</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {item.matched ? `Qty: ${item.quantity_requested} · $${item.price}/unit · Stock: ${item.in_stock}` : "❌ Not in database"}
                  </div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: item.matched ? "#e2e8f0" : "#ef4444" }}>
                  {item.matched ? `$${(item.price * item.quantity_requested).toFixed(2)}` : "—"}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", padding: "10px 12px", borderRadius: "7px", background: "#1e293b" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>ORDER TOTAL</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#22c55e" }}>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          {needsId && (
            <div style={{ background: "#dc262612", border: "1px solid #dc262644", borderRadius: "9px", padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>🛡️</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#f87171" }}>COMPLIANCE GATE — ID Required</div>
                <div style={{ fontSize: "11px", color: "#fca5a5" }}>Controlled substances detected.</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onReset} style={s.btnOutline}>← Back</button>
            <button onClick={() => setStep(needsId ? 2 : 3)} style={s.btn("linear-gradient(135deg,#2563eb,#3b82f6)", "#fff")}>
              {needsId ? "Proceed to ID Verification →" : "Proceed to Confirmation →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Verify ID ── */}
      {step === 2 && (
        <div style={{ maxWidth: "460px" }}>
          <div style={{ ...s.section, border: "1px solid #dc262644" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "7px", background: "#dc262622", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🛡️</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Patient ID Verification</div>
                <div style={{ fontSize: "11px", color: "#f87171" }}>Required for controlled substances</div>
              </div>
            </div>
            {!idOk ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="text" placeholder="Patient Full Name" value={idForm.name} onChange={(e) => setIdForm((f) => ({ ...f, name: e.target.value }))} style={s.input} />
                <input type="text" placeholder="Government ID Number" value={idForm.id} onChange={(e) => setIdForm((f) => ({ ...f, id: e.target.value }))} style={s.input} />
                <input type="date" value={idForm.dob} onChange={(e) => setIdForm((f) => ({ ...f, dob: e.target.value }))} style={s.input} />
                <button onClick={onVerifyId} disabled={!idForm.name || !idForm.id || busy} style={{ ...s.btn(idForm.name && idForm.id ? "#dc2626" : "#1e293b", idForm.name && idForm.id ? "#fff" : "#475569"), marginTop: "4px", cursor: idForm.name && idForm.id && !busy ? "pointer" : "default" }}>
                  {busy ? "Verifying..." : "🔐 Verify Patient Identity"}
                </button>
              </div>
            ) : (
              <div style={{ background: "#22c55e12", border: "1px solid #22c55e44", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>✅</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>Identity Verified</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirm ── */}
      {step === 3 && (
        <div>
          <div style={s.section}>
            <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "3px" }}>⚡ Ready to Dispense</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
              {backendOk ? `Confirm to save to database & broadcast LED signal to ${deviceCount} device${deviceCount !== 1 ? "s" : ""}.` : "⚠️ Backend is disconnected — cannot confirm orders."}
            </div>
            <div style={{ background: "#0a0f1c", borderRadius: "7px", padding: "12px", border: "1px solid #1e293b", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                Patient: <strong style={{ color: "#e2e8f0" }}>{ocrResult?.patient_name}</strong> · Doctor: <strong style={{ color: "#e2e8f0" }}>{ocrResult?.doctor_name}</strong>
              </div>
              {matched.filter((i) => i.matched).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: i ? "1px solid #1e293b" : "none", fontSize: "12px" }}>
                  <span>{item.medication_name} × {item.quantity_requested}</span>
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>${(item.price * item.quantity_requested).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "2px solid #334155", marginTop: "6px", fontWeight: 800 }}>
                <span style={{ color: "#94a3b8" }}>TOTAL</span>
                <span style={{ color: "#22c55e", fontSize: "15px" }}>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
            {idOk && <div style={{ fontSize: "11px", color: "#22c55e", marginBottom: "12px" }}>✅ Patient ID verified</div>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setStep(1)} style={s.btnOutline}>← Back</button>
              <button onClick={onConfirmOrder} disabled={busy || !backendOk} style={{ ...s.btn(backendOk && !busy ? "linear-gradient(135deg,#16a34a,#22c55e)" : "#1e293b", backendOk && !busy ? "#fff" : "#475569"), flex: 1, fontSize: "14px", cursor: busy || !backendOk ? "default" : "pointer" }}>
                {busy ? "⏳ Processing..." : !backendOk ? "❌ Backend Required" : "✅ CONFIRM & ACTIVATE LEDs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Dispense ── */}
      {step === 4 && (
        <div>
          <div style={{ background: "#22c55e10", border: "1px solid #22c55e33", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>💡</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>
                LEDs ACTIVATED — Signal sent to {deviceCount} device{deviceCount !== 1 ? "s" : ""} · Order saved to database
              </div>
              <div style={{ fontSize: "11px", color: "#86efac" }}>Shelf device is now blinking. Stock deducted in PostgreSQL.</div>
            </div>
          </div>

          {/* Shelf LED grid */}
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
                      return (
                        <div key={addr} style={{ flex: 1, padding: "12px 10px", borderRadius: "8px", textAlign: "center", position: "relative", background: glow ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#0a0f1c", border: on ? "2px solid #22c55e" : "1px solid #1e293b", boxShadow: glow ? "0 0 20px #22c55e55" : "none", transition: "all 0.2s" }}>
                          {on && <div style={{ position: "absolute", top: 5, right: 7, width: 7, height: 7, borderRadius: "50%", background: glow ? "#fff" : "#22c55e", boxShadow: glow ? "0 0 5px #fff" : "none" }} />}
                          <div style={{ fontSize: "12px", fontWeight: 700, color: glow ? "#052e16" : "#e2e8f0" }}>{prod?.name || "Empty"}</div>
                          <div style={{ fontSize: "9px", color: glow ? "#065f46" : "#475569", marginTop: "3px" }}>Stock: {prod?.stock_count ?? "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {lowAlerts.length > 0 && (
            <div style={{ background: "#eab30810", border: "1px solid #eab30833", borderRadius: "8px", padding: "12px 16px", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#eab308", marginBottom: "6px" }}>⚠ Low Stock Alerts</div>
              {lowAlerts.map((a, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#fde68a" }}>
                  {a.medication_name || a.name}: <strong>{a.remaining_stock || a.stock_count}</strong> left
                </div>
              ))}
            </div>
          )}

          <button onClick={onReset} style={s.btnOutline}>🔄 New Order</button>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-anim { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
}