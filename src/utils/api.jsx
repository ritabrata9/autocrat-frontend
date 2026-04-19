export const API = import.meta.env.VITE_API_URL || "http://0.0.0.0:8000" || "http://127.0.0.1:8000";

export const getToken = () => localStorage.getItem("autocrat_token");
export const setToken = (t) => localStorage.setItem("autocrat_token", t);
export const clearToken = () => localStorage.removeItem("autocrat_token");
export const getUserId = () => localStorage.getItem("autocrat_uid");
export const setUserId = (id) => localStorage.setItem("autocrat_uid", id);

export const getUserRole = () => localStorage.getItem("autocrat_role");
export const setUserRole = (r) => localStorage.setItem("autocrat_role", r);

export function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

export async function apiFetch(path, opts = {}) {
  const { headers: extraHeaders = {}, body, ...restOpts } = opts;

  const isFormData = body instanceof FormData;

  const headers = {
    ...authHeaders(),
    ...extraHeaders,
  };

  if (isFormData) {
    delete headers["Content-Type"];
  } else {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API}${path}`;

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const res = await fetch(url, {
        ...restOpts,
        body,
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Request failed");
      }

      if (res.status === 204) return null;
      return await res.json();

    } catch (err) {
      attempts++;

      // wait before retry (important for Render wake-up)
      await new Promise(r => setTimeout(r, 2000));

      if (attempts === maxAttempts) {
        throw new Error("Backend not responding (possibly waking up)");
      }
    }
  }
}

export async function isBackendAlive() {
  try {
    const res = await fetch(`${API}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

const LIKED_KEY = "autocrat_liked";
export function getLikedSet() {
  try { return new Set((JSON.parse(localStorage.getItem(LIKED_KEY)) || []).map(Number)); }
  catch { return new Set(); }
}
export function saveLiked(set) { localStorage.setItem(LIKED_KEY, JSON.stringify([...set])); }
export const clearLiked = () => localStorage.removeItem(LIKED_KEY);