export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem("autocrat_token");
export const setToken = (t) => localStorage.setItem("autocrat_token", t);
export const clearToken = () => {
  localStorage.removeItem("autocrat_token");
  localStorage.removeItem("autocrat_uid");
};
export const getUserId = () => localStorage.getItem("autocrat_uid");
export const setUserId = (id) => localStorage.setItem("autocrat_uid", id);

export function authHeaders() {
  const token = getToken();
  return { 
    "Authorization": token ? `Bearer ${token}` : "", 
    "Content-Type": "application/json" 
  };
}

export async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { 
    ...opts, 
    headers: { ...authHeaders(), ...opts.headers } 
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

// Global Styles for Re-use
export const inputStyle = {
  width: "100%", background: "#111", border: "1px solid #222",
  borderRadius: 8, padding: "12px", color: "#fff", marginBottom: "10px",
  outline: "none"
};

export const btnStyle = {
  width: "100%", padding: "12px", borderRadius: 8,
  background: "#fff", color: "#000", fontWeight: "bold", cursor: "pointer",
  border: "none"
};