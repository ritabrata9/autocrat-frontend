import { useState } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { getUserId } from "./utils";
import { toast } from "./toastBus";
import ConfirmDialog from "./components/ConfirmDialog";
import Feed from "./screens/Feed";
import Profile from "./screens/Profile";

export function FeedPage() {
  const navigate = useNavigate();
  return <Feed onViewAuthorProfile={(id) => navigate(`/user/${id}`)} />;
}

export function ProfilePageMe() {
  const navigate = useNavigate();
  const uid = getUserId();
  return <Profile userId={uid} onViewAuthorProfile={(id) => navigate(`/user/${id}`)} />;
}

export function ProfilePageUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  return <Profile userId={userId} onViewAuthorProfile={(id) => navigate(`/user/${id}`)} />;
}

export default function Shell({ onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isFeed = pathname === "/feed";
  const isProfile = pathname === "/profile" || pathname.startsWith("/user/");

  const nav = [{ id: "feed", label: "Feed", active: isFeed }, { id: "profile", label: "Profile", active: isProfile }];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8" }}>
      {confirmLogout && (
        <ConfirmDialog
          message="Sign out?"
          onConfirm={() => { setConfirmLogout(false); toast("Signed out"); setTimeout(onLogout, 800); }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
      <div style={{
        borderBottom: "0.5px solid #1a1a1a", display: "flex", alignItems: "center",
        padding: "0 24px", height: 56, position: "sticky", top: 0, background: "#080808", zIndex: 100,
      }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 400, color: "#e8e8e8", letterSpacing: "-0.02em", marginRight: "auto" }}>
          Autocrat
        </span>
        {nav.map(n => (
          <button key={n.id} type="button" onClick={() => navigate(n.id === "profile" ? "/profile" : "/feed")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: n.active ? "#e8e8e8" : "#444",
            fontSize: 15, padding: "0 16px", height: "100%",
            borderBottom: n.active ? "1px solid #e8e8e8" : "1px solid transparent",
            letterSpacing: "0.02em",
          }}>{n.label}</button>
        ))}
        <button type="button" onClick={() => setConfirmLogout(true)} style={{
          background: "rgba(192, 57, 43, 0.08)",
          border: "0.5px solid rgba(192, 57, 43, 0.4)",
          borderRadius: 6, color: "#e74c3c",
          cursor: "pointer", fontSize: 12, fontWeight: 500,
          padding: "4px 10px", marginLeft: 12, flexShrink: 0,
          letterSpacing: "0.05em",
          boxShadow: "0 0 8px rgba(231, 76, 60, 0.25)",
        }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        <Outlet />
      </div>
    </div>
  );
}
