// src/utils/tesseract.js — Lazy-load Tesseract.js for browser-based OCR

let tesseractLoaded = false;

/**
 * Load Tesseract.js from CDN (only once).
 */
function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (tesseractLoaded && window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => {
      tesseractLoaded = true;
      resolve(window.Tesseract);
    };
    script.onerror = () => reject(new Error("Failed to load Tesseract.js"));
    document.head.appendChild(script);
  });
}

/**
 * Run OCR on an image source (base64 data URL or blob URL).
 * Returns extracted text.
 */
export async function runOCROnImage(imageSource) {
  const Tesseract = await loadTesseract();
  const worker = await Tesseract.createWorker("eng");
  const { data } = await worker.recognize(imageSource);
  await worker.terminate();
  return data.text;
}
