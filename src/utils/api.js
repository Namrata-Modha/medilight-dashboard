// src/utils/api.js — All backend HTTP calls

const API_URL = "https://medilight-backend.onrender.com";

export const isConnected = () => API_URL.length > 0;

export async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Retry wrapper for Neon free tier cold starts (~2.5s delay).
 */
export async function retryApi(path, opts) {
  try {
    return await api(path, opts);
  } catch (e) {
    await new Promise((r) => setTimeout(r, 2500));
    return api(path, opts);
  }
}
