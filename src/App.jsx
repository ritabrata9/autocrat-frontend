import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

const getToken = () => localStorage.getItem("autocrat_token");
const setToken = (t) => localStorage.setItem("autocrat_token", t);
const clearToken = () => localStorage.removeItem("autocrat_token");
const getUserId = () => localStorage.getItem("autocrat_uid");
const setUserId = (id) => localStorage.setItem("autocrat_uid", id);

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// toast
let _setToast = null;
function Toast() {
  const [msg, setMsg] = useState(null);
  _setToast = (m) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };
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
const toast = (m) => _setToast && _setToast(m);

// confirm dialog
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000,
    }}>
      <div style={{
        background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 14,
        padding: "32px 28px", width: 320, textAlign: "center",
      }}>
        <div style={{ fontSize: 17, color: "#e8e8e8", marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={{
            padding: "10px 24px", borderRadius: 8, fontSize: 15,
            background: "none", border: "0.5px solid #2a2a2a", color: "#888", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "10px 24px", borderRadius: 8, fontSize: 15,
            background: "#c0392b", border: "none", color: "#fff", cursor: "pointer",
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "#111", border: "0.5px solid #2a2a2a",
  borderRadius: 8, padding: "13px 16px",
  color: "#e8e8e8", fontSize: 16, outline: "none",
  fontFamily: "inherit",
};
const btnStyle = {
  width: "100%", padding: "13px", borderRadius: 8,
  background: "#e8e8e8", color: "#080808",
  border: "none", fontSize: 16, fontWeight: 500,
  cursor: "pointer", marginTop: 4,
};

const LIKED_KEY = "autocrat_liked";
function getLikedSet() {
  try { return new Set((JSON.parse(localStorage.getItem(LIKED_KEY)) || []).map(Number)); }
  catch { return new Set(); }
}
function saveLiked(set) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
}

// AUTH SCREEN
function AuthScreen({ onAuth }) {
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
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, padding: "0 24px" }}>
        <div style={{ marginBottom: 52, textAlign: "center" }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 42, fontWeight: 400, color: "#e8e8e8", letterSpacing: "-0.03em" }}>Autocrat</span>
          <div style={{ color: "#444", fontSize: 13, marginTop: 6, letterSpacing: "0.12em" }}>
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} />
          <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" style={inputStyle} onKeyDown={e => e.key === "Enter" && submit()} />
          {err && <div style={{ color: "#c0392b", fontSize: 14 }}>{err}</div>}
          <button onClick={submit} disabled={loading} style={btnStyle}>
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
            style={{ background: "none", border: "none", color: "#555", fontSize: 15, cursor: "pointer" }}>
            {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// POST CARD
function PostCard({ post, showDelete = false, onDelete, liked = false, onLike, onUnlike }) {
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [animating, setAnimating] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setLikeCount(post.like_count ?? 0); }, [post.like_count]);

  async function toggleLike() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
    
    if (liked) {
      try {
        await apiFetch(`/vote/${post.id}`, { method: "DELETE" });
        setLikeCount(c => Math.max(0, c - 1));
        onUnlike?.(post.id);
      } catch (e) { 
        // SELF-HEALING UI: If backend says the vote doesn't exist,
        // it means we are out of sync. Force the UI to un-like it!
        if (e.message.toLowerCase().includes("not found")) {
          setLikeCount(c => Math.max(0, c - 1));
          onUnlike?.(post.id);
        } else {
          toast(e.message); 
        }
        setAnimating(false); 
      }
    } else {
      try {
        await apiFetch(`/vote/${post.id}`, { method: "POST" });
        setLikeCount(c => c + 1);
        onLike?.(post.id);
      } catch (e) { toast(e.message); setAnimating(false); }
    }
  }

  async function confirmDelete() {
    setDeleting(true); setConfirm(false);
    try {
      await apiFetch(`/posts/${post.id}`, { method: "DELETE" });
      toast("Post deleted");
      onDelete(post.id);
    } catch (e) { toast(e.message); setDeleting(false); }
  }

  return (
    <>
      {confirm && <ConfirmDialog message="Delete this post?" onConfirm={confirmDelete} onCancel={() => setConfirm(false)} />}
      <div style={{ background: "#0f0f0f", border: "0.5px solid #1e1e1e", borderRadius: 12, padding: "20px 22px", marginBottom: 14 }}>
        {post.author_email && (
          <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>{post.author_email}</div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: "#e8e8e8", marginBottom: 7 }}>{post.title}</div>
            {post.content && (
              <div style={{ fontSize: 15, color: "#888", lineHeight: 1.65 }}>{post.content}</div>
            )}
          </div>
          {showDelete && (
            <button onClick={() => setConfirm(true)} disabled={deleting} style={{
              background: "rgba(231, 76, 60, 0.05)", border: "1px solid rgba(231, 76, 60, 0.4)", borderRadius: 6,
              color: "#e74c3c", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "6px 12px", marginLeft: 12, flexShrink: 0,
              boxShadow: "0 0 10px rgba(231, 76, 60, 0.15)", textShadow: "0 0 8px rgba(231, 76, 60, 0.4)"
            }}>
              {deleting ? "..." : "Delete"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
          <button onClick={toggleLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"
              fill={liked ? "#e74c3c" : "none"}
              stroke={liked ? "#e74c3c" : "#555"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: animating ? "scale(1.35)" : "scale(1)", transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), fill 0.15s ease" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ fontSize: 15, color: liked ? "#e74c3c" : "#555", transition: "color 0.15s ease", minWidth: 16 }}>{likeCount}</span>
          </button>
          <span style={{ fontSize: 13, color: "#333", marginLeft: "auto" }}>
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
          </span>
        </div>
      </div>
    </>
  );
}

// NEW POST FORM
function NewPostForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const post = await apiFetch("/posts/", { method: "POST", body: JSON.stringify({ title, content }) });
      onCreated(post); setTitle(""); setContent(""); setOpen(false);
      toast("Post created");
    } catch (e) { toast(e.message); }
    finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      width: "100%", padding: "15px", borderRadius: 12,
      background: "rgba(46, 204, 113, 0.05)", border: "1px dashed rgba(46, 204, 113, 0.4)",
      color: "#2ecc71", fontSize: 15, fontWeight: 500, cursor: "pointer", marginBottom: 20,
      boxShadow: "0 0 12px rgba(46, 204, 113, 0.15)", textShadow: "0 0 8px rgba(46, 204, 113, 0.4)"
    }}>+ New post</button>
  );

  return (
    <div style={{ background: "#0f0f0f", border: "0.5px solid #2a2a2a", borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} autoFocus />
      <textarea placeholder="What's on your mind? (optional)" value={content} onChange={e => setContent(e.target.value)}
        rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} disabled={loading || !title.trim()} style={{ ...btnStyle, width: "auto", padding: "10px 24px" }}>
          {loading ? "..." : "Post"}
        </button>
        <button onClick={() => setOpen(false)} style={{
          padding: "10px 18px", borderRadius: 8, background: "none",
          border: "0.5px solid #2a2a2a", color: "#555", cursor: "pointer", fontSize: 15,
        }}>Cancel</button>
      </div>
    </div>
  );
}

// FEED
function Feed({ currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(() => getLikedSet());
  const [userCache, setUserCache] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLikedIds = useCallback(async () => {
    try {
      const data = await apiFetch("/vote/me");
      // This checks if the item is an object like {post_id: 12} and extracts the ID.
      // If it's already a number, it just uses the number.
      const mappedIds = data.map(item => typeof item === 'object' ? (item.post_id || item.id) : item);
      const s = new Set(mappedIds.map(Number));
      
      setLikedIds(s); 
      saveLiked(s);
    } catch { 
      setLikedIds(getLikedSet()); 
    }
  }, []);

  const fetchUserEmail = useCallback(async (userId, cache) => {
    if (cache[userId]) return;
    try {
      const u = await apiFetch(`/users/${userId}`);
      setUserCache(prev => ({ ...prev, [userId]: u.email }));
    } catch { /* ignore */ }
  }, []);

  const fetchPosts = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const data = await apiFetch(`/posts/?limit=30&search=${encodeURIComponent(q)}`);
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sorted);
      const uniqueIds = [...new Set(sorted.map(p => p.user_id))];
      setUserCache(prev => {
        uniqueIds.forEach(id => { if (!prev[id]) fetchUserEmail(id, prev); });
        return prev;
      });
    } catch (e) { toast(e.message); }
    finally { setLoading(false); }
  }, [fetchUserEmail]);

  useEffect(() => { fetchPosts(); fetchLikedIds(); }, [fetchPosts, fetchLikedIds]);

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchPosts]);

  function handleLike(postId) {
    setLikedIds(prev => { const s = new Set(prev); s.add(postId); saveLiked(s); return s; });
  }
  function handleUnlike(postId) {
    setLikedIds(prev => { const s = new Set(prev); s.delete(postId); saveLiked(s); return s; });
  }

  return (
    <div>
      <input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} />
      <NewPostForm onCreated={p => setPosts(prev => [{ like_count: 0, ...p }, ...prev])} />
      {loading ? (
        <div style={{ color: "#333", fontSize: 15, textAlign: "center", padding: 40 }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#333", fontSize: 15, textAlign: "center", padding: 40 }}>No posts yet</div>
      ) : posts.map(p => (
        <PostCard
          key={p.id}
          post={{ ...p, author_email: userCache[p.user_id] }}
          showDelete={false}
          liked={likedIds.has(p.id)}
          onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
          onLike={handleLike}
          onUnlike={handleUnlike}
        />
      ))}
    </div>
  );
}

// PROFILE
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likedIds, setLikedIds] = useState(() => getLikedSet());

  useEffect(() => {
    if (!userId) return;
    apiFetch(`/users/${userId}`).then(setUser).catch(e => toast(e.message));
    apiFetch(`/posts/?limit=100`).then(data => {
      const mine = data
        .filter(p => p.user_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(mine);
    }).catch(e => toast(e.message))
      .finally(() => setLoadingPosts(false));
    // fetch server-authoritative liked set
    apiFetch("/vote/me").then(ids => {
      const s = new Set(ids.map(Number));
      setLikedIds(s); saveLiked(s);
    }).catch(() => setLikedIds(getLikedSet()));
  }, [userId]);

  function handleLike(postId) {
    setLikedIds(prev => { const s = new Set(prev); s.add(postId); saveLiked(s); return s; });
  }
  function handleUnlike(postId) {
    setLikedIds(prev => { const s = new Set(prev); s.delete(postId); saveLiked(s); return s; });
  }

  if (!user) return <div style={{ color: "#333", padding: 40, textAlign: "center" }}>Loading...</div>;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div>
      <div style={{
        background: "#0f0f0f", border: "0.5px solid #1e1e1e",
        borderRadius: 16, padding: "28px 24px",
        display: "flex", alignItems: "center", gap: 20, marginBottom: 28,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "#1a1a1a", border: "0.5px solid #2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Georgia', serif", fontSize: 22, color: "#888",
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: "#e8e8e8" }}>{user.email}</div>
          <div style={{ fontSize: 14, color: "#444", marginTop: 4 }}>
            {user.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString()}` : `ID #${user.id}`}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#e8e8e8" }}>{posts.length}</div>
          <div style={{ fontSize: 13, color: "#444" }}>posts</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#444", marginBottom: 14, letterSpacing: "0.08em" }}>YOUR POSTS</div>
      {loadingPosts ? (
        <div style={{ color: "#333", fontSize: 15, textAlign: "center", padding: 40 }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#333", fontSize: 15, textAlign: "center", padding: 40 }}>No posts yet</div>
      ) : posts.map(p => (
        <PostCard
          key={p.id}
          post={p}
          showDelete={true}
          liked={likedIds.has(p.id)}
          onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
          onLike={handleLike}
          onUnlike={handleUnlike}
        />
      ))}
    </div>
  );
}

// SHELL
function Shell({ onLogout }) {
  const [tab, setTab] = useState("feed");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const uid = getUserId();

  const nav = [{ id: "feed", label: "Feed" }, { id: "profile", label: "Profile" }];

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
        padding: "0 24px", height: 64, /* Bumped height from 56 to 64 */
        position: "sticky", top: 0, background: "#080808", zIndex: 100,
      }}>
        <span style={{ 
          fontFamily: "'Georgia', serif", 
          fontSize: 28, /* Increased from 24 */
          fontWeight: 400, color: "#e8e8e8", letterSpacing: "-0.02em", marginRight: "auto" 
        }}>
          Autocrat
        </span>
        {nav.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: tab === n.id ? "#e8e8e8" : "#444",
            fontSize: 17, /* Increased from 15 */
            padding: "0 18px", height: "100%",
            borderBottom: tab === n.id ? "2px solid #e8e8e8" : "2px solid transparent", /* Made active underline slightly thicker */
            letterSpacing: "0.02em",
          }}>{n.label}</button>
        ))}
        <button onClick={() => setConfirmLogout(true)} style={{
          background: "rgba(231, 76, 60, 0.05)", border: "1px solid rgba(231, 76, 60, 0.4)", borderRadius: 6,
          color: "#e74c3c", 
          fontSize: 15, /* Increased from 14 */
          fontWeight: 500, 
          padding: "8px 18px", /* Slightly padded out to match larger text */
          cursor: "pointer", marginLeft: 16,
          boxShadow: "0 0 10px rgba(231, 76, 60, 0.15)", textShadow: "0 0 8px rgba(231, 76, 60, 0.4)"
        }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "feed" && <Feed currentUserId={uid} />}
        {tab === "profile" && <Profile userId={uid} />}
      </div>
    </div>
  );
}


// ROOT
export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  
  function logout() { 
    clearToken(); 
    localStorage.removeItem("autocrat_uid"); 
    localStorage.removeItem(LIKED_KEY); // <-- Add this line to clear the stale likes
    setAuthed(false); 
  }
  
  return (
    <>
      <Toast />
      {authed ? <Shell onLogout={logout} /> : <AuthScreen onAuth={() => setAuthed(true)} />}
    </>
  );
}