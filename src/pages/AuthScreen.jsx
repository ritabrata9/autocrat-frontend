import { useState } from "react";
import { API, apiFetch, setToken, setUserId, setUserRole } from "../utils/api";
import { toast } from "../components/Shared";

export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const body = new URLSearchParams({ username: email, password });
        const res = await fetch(`${API}/login`, { method: "POST", body });
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Login failed"); }
        const data = await res.json();
        setToken(data.access_token);
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        setUserId(payload.user_id);
        setUserRole(payload.role ?? "USER");
        onAuth();
      } else {
        await apiFetch("/users/", { method: "POST", body: JSON.stringify({ email, password }) });
        toast("Account created — log in now");
        setMode("login");
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <span className="auth-title">Autocrat</span>
          <div className="auth-subtitle">
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </div>
        </div>
        
        <div className="auth-form">
          <input 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            type="email" 
            className="autocrat-input" 
          />
          <input 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            type="password" 
            className="autocrat-input" 
            onKeyDown={e => e.key === "Enter" && submit()} 
          />
          {err && <div className="auth-error">{err}</div>}
          
          <button onClick={submit} disabled={loading} className="autocrat-btn">
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </div>
        
        <div className="auth-footer">
          <button 
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
            className="auth-toggle-btn"
          >
            {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}