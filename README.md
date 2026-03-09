# MediLight Dashboard

Pharmacist-facing React dashboard for the MediLight Dispensing System.

## Features

- **Dual AI OCR** — Gemini AI Vision + Tesseract.js for prescription reading
- **PHI Protection** — Patient data extracted locally, never sent to cloud
- **5-Step Workflow** — Upload → Review → Verify ID → Confirm → Dispense
- **Live Inventory** — Real-time stock from PostgreSQL (Neon)
- **LED Shelf Grid** — Visual representation of shelf LED activation
- **Order History** — Persistent orders stored in database

## Project Structure

```
src/
├── main.jsx                  ← Entry point
├── MediLight.jsx             ← Main component (state + wiring)
├── utils/
│   ├── api.js                ← Backend HTTP calls (URL from env only)
│   ├── ai.js                 ← Gemini AI analysis via backend proxy (no key client-side)
│   ├── constants.js          ← Config, styles, shelf layout
│   ├── parsers.js            ← Regex OCR + inventory matching
│   ├── privacy.js            ← PHI redaction + local extraction
│   └── tesseract.js          ← Tesseract.js lazy loader
└── components/
    ├── StatusBar.jsx         ← Top bar with connection badges
    ├── PrivacyModal.jsx      ← Consent gate before upload
    ├── WorkflowTab.jsx       ← 5-step processing pipeline
    ├── InventoryTab.jsx      ← Product grid with stock levels
    ├── OrdersTab.jsx         ← Order history
    └── JsonLog.jsx           ← API payload viewer
```

## Setup (Local)

```bash
npm install
npm run dev
```

The dashboard connects to the backend URL set in `src/utils/api.js`:

```js
const API_URL = "https://YOUR-BACKEND.onrender.com";
```

> **No API keys belong in this file or anywhere else in the frontend.** All AI and database calls go through the backend proxy. The Gemini key lives only in the backend's environment variables.

## Deploy to Render

The dashboard is deployed as a **Static Site** on Render (not Vercel).

1. Connect the `medilight-dashboard` GitHub repo to Render
2. **Build command:** `npm run build`
3. **Publish directory:** `dist`
4. No environment variables needed — the backend URL is set in `src/utils/api.js`

After deploying, copy the dashboard's Render URL (e.g. `https://medilight-dashboard.onrender.com`) and add it to the **backend's** `ALLOWED_ORIGINS` environment variable so CORS allows requests from it.

## Security Notes

- The Gemini API key is **never** present in this codebase — all AI calls go to `/api/ai/*` on the backend, which holds the key server-side
- PHI redaction runs locally in `src/utils/privacy.js` before any text is sent over the network
- The dashboard communicates only with its paired backend — no direct calls to external APIs