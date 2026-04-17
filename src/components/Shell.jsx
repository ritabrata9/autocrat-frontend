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
  
  const [viewUserId, setViewUserId] = useState(uid);

  const nav = [
    { id: "feed", label: "Feed" },
    { id: "profile", label: "Profile" },
  ];

  function handleNavClick(targetTab) {
    if (targetTab === "profile") {
      setViewUserId(uid);
    }
    setTab(targetTab);
  }

  function navigateToUserProfile(targetUserId) {
    if (!targetUserId) return;
    setViewUserId(targetUserId);
    setTab("profile");
  }

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
            onClick={() => handleNavClick(n.id)} 
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
        {tab === "feed" && (
          <Feed 
            currentUserId={uid} 
            currentUserRole={role} 
            onNavigateToProfile={navigateToUserProfile} 
          />
        )}
        {tab === "profile" && (
          <Profile 
            userId={viewUserId} 
            currentUserId={uid} // <-- NEW: Now the profile knows who is looking at it
            currentUserRole={role} 
          />
        )}
      </div>
    </div>
  );
}