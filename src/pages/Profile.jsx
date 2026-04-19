import { useState, useEffect } from "react";
import { apiFetch, getLikedSet, saveLiked, clearToken } from "../utils/api";
import { toast } from "../components/Shared";
import { PostCard } from "../components/Post";
import { ConfirmDialog } from "../components/Shared";

export function Profile({ userId, currentUserId, currentUserRole }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likedIds, setLikedIds] = useState(() => getLikedSet());
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);

  // Permission Checks
  const isOwner = parseInt(userId) === parseInt(currentUserId);
  const isAdmin = currentUserRole === "ADMIN";

  useEffect(() => {
    if (!userId) return;

    apiFetch(`/users/${userId}`)
      .then((u) => {
        setUser(u);
        setBio(u.bio ?? "");
      })
      .catch((e) => toast(e.message));

    apiFetch(`/posts/?limit=100`)
      .then((data) => {
        const mine = data
          .filter((p) => p.user_id === parseInt(userId))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(mine);
      })
      .catch((e) => toast(e.message))
      .finally(() => setLoadingPosts(false));

    apiFetch("/vote/me")
      .then((ids) => {
        const s = new Set(ids.map(Number));
        setLikedIds(s);
        saveLiked(s);
      })
      .catch(() => setLikedIds(getLikedSet()));
  }, [userId]);

  async function updateBio() {
    if (savingBio) return;
    setSavingBio(true);
    try {
      const updated = await apiFetch(`/users/updatebio/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput.trim() }),
      });
      setBio(updated.bio ?? bioInput.trim());
      setEditingBio(false);
      toast("Bio updated");
    } catch (e) {
      toast(e.message);
    } finally {
      setSavingBio(false);
    }
  }

  async function deleteAccount() {
    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" });

      if (isOwner) {
        clearToken();
        localStorage.clear();
        window.location.reload();
      } else {
        // If an admin deletes someone else, just notify and reload the page
        toast("Account deleted");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      toast(e.message);
    }
  }

  async function handleProfilePicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/users/profile-pic", {
        method: "POST",
        body: formData,
      });

      setUser((prev) => ({
        ...prev,
        profile_picture_url: res.url,
      }));

      toast("Profile photo updated");
    } catch (e) {
      toast(e.message);
    }
  }

  function handleLike(postId) {
    setLikedIds((prev) => {
      const s = new Set(prev);
      s.add(postId);
      saveLiked(s);
      return s;
    });
  }
  function handleUnlike(postId) {
    setLikedIds((prev) => {
      const s = new Set(prev);
      s.delete(postId);
      saveLiked(s);
      return s;
    });
  }

  if (!user) return <div className="profile-center">Loading...</div>;


  return (
    <div>
      {confirmDeleteUser && (
        <ConfirmDialog
          message={
            isOwner
              ? "Delete your account permanently?"
              : `Delete ${user.email}'s account?`
          }
          onConfirm={deleteAccount}
          onCancel={() => setConfirmDeleteUser(false)}
        />
      )}

      {/* PROFILE HEADER */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user.profile_picture_url ? (
            <img src={user.profile_picture_url} loading="lazy" alt="profile" />
          ) : (
            <span>Add Photo</span>
          )}

          {isOwner && (
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicUpload}
              className="profile-avatar-input"
            />
          )}
        </div>

        <div className="profile-info-container">
          <div className="profile-email-row">
            <span className="profile-email">{user.email}</span>
          </div>

          <div className="profile-meta">
            {user.created_at
              ? `Joined ${new Date(user.created_at).toLocaleDateString()}`
              : `ID #${user.id}`}
          </div>

          {/* BIO */}
          <div className="profile-bio-container">
            {editingBio ? (
              <div className="profile-bio-edit-row">
                <input
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && updateBio()}
                  autoFocus
                  placeholder="Write a short bio..."
                  className="profile-bio-input"
                />
                <button
                  onClick={updateBio}
                  disabled={savingBio}
                  className="btn-profile-save"
                >
                  {savingBio ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingBio(false)}
                  className="btn-profile-action"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-bio-view-row">
                <span className="profile-bio-text">{bio || "No bio yet"}</span>
                {isOwner && (
                  <button
                    onClick={() => {
                      setEditingBio(true);
                      setBioInput(bio);
                    }}
                    className="btn-profile-action"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-stats-container">
          <div className="profile-post-count">{posts.length}</div>
          <div className="profile-meta">posts</div>
        </div>
      </div>

      {/* DELETE BUTTON - Only visible to Owner or Admin */}
      {(isOwner || isAdmin) && (
        <div className="profile-actions-row">
          <button
            onClick={() => setConfirmDeleteUser(true)}
            className="btn-profile-danger"
          >
            Delete account
          </button>
        </div>
      )}

      {/* POSTS */}
      <div className="profile-section-label">
        {isOwner ? "YOUR POSTS" : "POSTS"}
      </div>

      {loadingPosts ? (
        <div className="profile-center">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="profile-center">No posts yet</div>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            showDelete={isAdmin || p.user_id === parseInt(currentUserId)} // Corrected permission logic
            liked={likedIds.has(p.id)}
            currentUserId={currentUserId} // Passing the actual logged-in user, not the viewed profile
            currentUserRole={currentUserRole}
            onDelete={(id) =>
              setPosts((prev) => prev.filter((x) => x.id !== id))
            }
            onLike={handleLike}
            onUnlike={handleUnlike}
          />
        ))
      )}
    </div>
  );
}
