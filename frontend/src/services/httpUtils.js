// Utility helpers for HTTP requests: retry, paginated get, error normalization
import api from "./api.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(fn, { retries = 2, backoff = 300 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const isNetwork = !err.response;
      const status = err.response?.status;
      // retry on network errors or server errors 5xx
      if (attempt > retries || (!isNetwork && !(status >= 500 && status < 600))) {
        throw err;
      }
      await sleep(backoff * attempt);
    }
  }
}

export function normalizeApiError(err) {
  if (!err) return { message: "Error desconocido" };
  if (err.response && err.response.data) {
    const payload = err.response.data;
    if (typeof payload === "string") return { message: payload };
    if (payload.detail) return { message: payload.detail };
    if (payload.error) return { message: payload.error };
    // assume a dict of field errors
    try {
      const msgs = Object.keys(payload).map((k) => `${k}: ${String(payload[k])}`).join('\n');
      return { message: msgs };
    } catch (e) {
      return { message: JSON.stringify(payload) };
    }
  }
  if (err.message) return { message: err.message };
  return { message: String(err) };
}

export async function paginatedGet(path, params = {}) {
  const res = await api.get(path, { params });
  // normalize to { results, count, next, previous }
  const data = res.data;
  if (data && Array.isArray(data)) return { results: data, count: data.length };
  if (data && data.results) return data;
  return { results: data, count: Array.isArray(data) ? data.length : 0 };
}

export function cachedGet(key, fn, ttl = 1000 * 60) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < ttl) {
        return Promise.resolve(parsed.data);
      }
    }
  } catch (e) {}
  return fn().then((data) => {
    try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
    return data;
  });
}

const defaultExport = {
  fetchWithRetry,
  normalizeApiError,
  paginatedGet,
  cachedGet,
  safeRequest,
};

export default defaultExport;

export async function safeRequest(fn, options = {}) {
  try {
    const res = await fetchWithRetry(fn, options);
    return { ok: true, data: res.data !== undefined ? res.data : res };
  } catch (err) {
    const e = normalizeApiError(err);
    return { ok: false, error: e.message };
  }
}
