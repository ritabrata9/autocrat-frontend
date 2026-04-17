import { useState } from "react";
import { getUserId, getUserRole } from "../utils/api";
import { toast, ConfirmDialog } from "./Shared";
import { Feed } from "../pages/Feed";
import { Profile } from "../pages/Profile";

export function Shell({ onLogout }) {
  const [tab, setTab] = useState("feed");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const uid = getUserId();
  const role = getUserRole();

  const nav = [
    { id: "feed", label: "Feed" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div>
      {confirmLogout && (
        <ConfirmDialog
          message="Sign out?"
          onConfirm={() => { setConfirmLogout(false); toast("Signed out"); setTimeout(onLogout, 800); }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
      
      <div className="shell-nav-container">
        <span className="shell-title">Autocrat</span>
        
        {nav.map(n => (
          <button 
            key={n.id} 
            onClick={() => setTab(n.id)} 
            className={`shell-nav-btn ${tab === n.id ? "active" : "inactive"}`}
          >
            {n.label}
          </button>
        ))}
        
        <button onClick={() => setConfirmLogout(true)} className="btn-shell-logout">
          Sign out
        </button>
      </div>

      <div className="shell-content">
        {tab === "feed" && <Feed currentUserId={uid} currentUserRole={role} />}
        {tab === "profile" && <Profile userId={uid} currentUserRole={role} />}
      </div>
    </div>
  );
}