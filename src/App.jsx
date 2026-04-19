import { useState, useEffect } from "react";
import { isBackendAlive } from "./utils/api";
import { getToken, clearToken, clearLiked } from "./utils/api";
import { Toast } from "./components/Shared";
import { AuthScreen } from "./pages/AuthScreen";
import { Shell } from "./components/Shell";
import "./styles/main.css";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  function logout() {
    clearToken();
    localStorage.removeItem("autocrat_uid");
    localStorage.removeItem("autocrat_role");
    clearLiked();
    setAuthed(false);
  }

  useEffect(() => {
    let attempts = 0;

    const interval = setInterval(async () => {
      const ok = await isBackendAlive();

      if (ok) {
        setReady(true);
        clearInterval(interval);
      }

      attempts++;
      if (attempts > 30) {
        setError(true);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 🔴 BLOCK APP UNTIL BACKEND IS READY
  if (!ready && !error) {
    return (
      <div className="connecting-screen">
        <h2>
          Connecting to server<span className="dots"></span>
        </h2>
      </div>
    );
  }

  // 🔴 HANDLE FAILURE
  if (error) {
    return (
      <div className="connecting-screen">
        <h2>Server taking too long</h2>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // ✅ NORMAL APP
  return (
    <>
      <Toast />
      {authed ? (
        <Shell onLogout={logout} />
      ) : (
        <AuthScreen onAuth={() => setAuthed(true)} />
      )}
    </>
  );
}