import { useState } from "react";
import { getToken, clearToken, clearLiked } from "./utils/api";
import { Toast } from "./components/Shared";
import { AuthScreen } from "./pages/AuthScreen";
import { Shell } from "./components/Shell";
import "./styles/main.css";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());

  function logout() {
    clearToken();
    localStorage.removeItem("autocrat_uid");
    localStorage.removeItem("autocrat_role");
    clearLiked();
    setAuthed(false);
  }

  return (
    <>
      <Toast />
      {authed ? <Shell onLogout={logout} /> : <AuthScreen onAuth={() => setAuthed(true)} />}
    </>
  );
}