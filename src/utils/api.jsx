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
  const { headers: extraHeaders, ...restOpts } = opts;

  const res = await fetch(`${API}${path}`, {
    ...restOpts,
    headers: {
      ...authHeaders(),
      ...extraHeaders,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

const LIKED_KEY = "autocrat_liked";
export function getLikedSet() {
  try { return new Set((JSON.parse(localStorage.getItem(LIKED_KEY)) || []).map(Number)); }
  catch { return new Set(); }
}
export function saveLiked(set) { localStorage.setItem(LIKED_KEY, JSON.stringify([...set])); }
export const clearLiked = () => localStorage.removeItem(LIKED_KEY);