# MediLight Dashboard

Pharmacist-facing React dashboard for the MediLight Dispensing System.

## Features

- **Dual AI OCR** — Claude Vision + Tesseract.js for prescription reading
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
│   ├── api.js                ← Backend HTTP calls
│   ├── claude.js             ← Claude AI text + vision analysis
│   ├── constants.js          ← Config, styles, shelf layout
│   ├── parsers.js            ← Regex OCR + inventory matching
│   ├── privacy.js            ← PHI redaction + local extraction
│   └── tesseract.js          ← Tesseract.js lazy loader
├── components/
│   ├── StatusBar.jsx          ← Top bar with connection badges
│   ├── PrivacyModal.jsx       ← Consent gate before upload
│   ├── WorkflowTab.jsx        ← 5-step processing pipeline
│   ├── InventoryTab.jsx       ← Product grid with stock levels
│   ├── OrdersTab.jsx          ← Order history
│   └── JsonLog.jsx            ← API payload viewer
```

## Setup

```bash
npm install
npm run dev
```

## Connect to Backend

Open `src/utils/api.js` and change line 3:

```js
const API_URL = "https://YOUR-BACKEND.onrender.com";
```

## Deploy to Render

1. Connect this GitHub repo to Render as a **Static Site**
2. Build command: `npm run build`
3. Publish directory: `dist`
