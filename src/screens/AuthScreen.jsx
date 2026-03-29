import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, inputStyle, btnStyle } from "../utils";

export default function AuthScreen() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const path = isLogin ? "/login" : "/users/";
    
    try {
      const data = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      
      const token = isLogin ? data.access_token : data.token;
      const userId = data.user_id ?? data.id ?? data.user?.id;
      if (token) {
        login(token, userId);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
      <h2 style={{ color: "#fff", textAlign: "center" }}>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
        <button type="submit" style={btnStyle}>{isLogin ? "Enter" : "Create Account"}</button>
      </form>
      {error && <p style={{ color: "#ff4d4d", fontSize: 14 }}>{error}</p>}
      <p onClick={() => setIsLogin(!isLogin)} style={{ color: "#888", cursor: "pointer", textAlign: "center", marginTop: 20 }}>
        {isLogin ? "Need an account? Sign up" : "Have an account? Login"}
      </p>
    </div>
  );
}