import { useState, useEffect } from "react";
import { toastBus } from "../toastBus";

export function Toast() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    toastBus.current = (m) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 3000);
    };
    return () => {
      toastBus.current = null;
    };
  }, []);

  if (!msg) return null;

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: "#1a1a1a", color: "#e8e8e8", padding: "12px 24px",
      borderRadius: 10, fontSize: 15, zIndex: 9999,
      border: "0.5px solid #2a2a2a", letterSpacing: "0.01em",
    }}>{msg}</div>
  );
}
