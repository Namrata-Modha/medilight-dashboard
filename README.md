# MediLight Dashboard

**Pharmacist-facing React dashboard for the MediLight Smart Dispensing System.**

> Upload a prescription → AI reads it → medications matched → LEDs activated on shelf

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite) ![Gemini](https://img.shields.io/badge/Gemini_AI-Vision-4285F4?logo=google) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)

## What This Does

This is the pharmacist's main interface. It handles the complete prescription-to-dispense workflow:

1. **Upload** a prescription image (camera, gallery, or paste text)
2. **AI analyzes** the image using Google Gemini Vision — patient data stays local, only medication names go to AI
3. **Medications matched** against live PostgreSQL inventory with prices, stock levels, and confidence scores
4. **ID verification** for controlled substances (age 18+ check, government ID validation)
5. **Order confirmed** → stock deducted in database → LED signal broadcast to shelf hardware

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + Vite |
| AI (Primary) | Google Gemini 2.5 Flash Vision via backend proxy |
| AI (Fallback) | Tesseract.js OCR running in-browser |
| Privacy | PHI auto-redacted before any cloud API call |
| Matching | 3-tier: AI product ID → exact name → fuzzy Levenshtein |
| Hosting | Vercel (free) |

## Project Structure

```
src/
├── main.jsx                  ← Entry point
├── MediLight.jsx             ← Main component (state + workflow logic)
├── utils/
│   ├── api.js                ← Backend HTTP calls
│   ├── ai.js                 ← Gemini AI text + vision (via backend proxy)
│   ├── constants.js          ← Config, styles, shelf layout, sample prescriptions
│   ├── parsers.js            ← Regex + fuzzy Levenshtein medication matching
│   ├── privacy.js            ← PHI redaction + local extraction
│   └── tesseract.js          ← Tesseract.js lazy loader from CDN
├── components/
│   ├── StatusBar.jsx          ← Top bar: connection badges, tab navigation
│   ├── PrivacyModal.jsx       ← Consent gate before image upload
│   ├── WorkflowTab.jsx        ← 5-step prescription processing pipeline
│   ├── InventoryTab.jsx       ← Product grid with Add / Edit / Delete
│   ├── OrdersTab.jsx          ← Order history from PostgreSQL
│   └── JsonLog.jsx            ← API payload debug viewer
```

## Setup

### Connect to your backend

Open `src/utils/api.js` and `src/utils/ai.js` — update the URL on line 3 / line 7:

```js
const API_URL = "https://YOUR-BACKEND.onrender.com";
```

### Run locally

```bash
npm install
npm run dev
```

### Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → Connect repo
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy — done

## Features at a Glance

- **Dual AI OCR** — Gemini Vision (primary) + Tesseract.js (fallback) + local regex (last resort)
- **PHI Protection** — Patient names, DOB, doctor info extracted locally, never sent to cloud
- **Fuzzy Matching** — Handles OCR typos: "Codiene"→Codeine, "Omprazole"→Omeprazole
- **Inventory CRUD** — Add, edit, delete medications with modal forms
- **ID Verification** — Full name + government ID format + age 18+ for controlled substances
- **LED Shelf Grid** — Visual representation of which shelf bins are active
- **Order History** — Persistent orders with line items from PostgreSQL
- **JSON Log** — Every API call logged for debugging

## Related Repos

- **Backend API** → [medilight-backend](https://github.com/YOUR_USERNAME/medilight-backend)
- **Shelf Device** → [medilight-shelf](https://github.com/YOUR_USERNAME/medilight-shelf)
- **Project Guide + Test Images** → [medilight-guide](https://github.com/YOUR_USERNAME/medilight-guide)
