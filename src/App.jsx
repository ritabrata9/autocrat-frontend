import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://0.0.0.0:8000" || "http://127.0.0.1:8000";

const getToken = () => localStorage.getItem("autocrat_token");
const setToken = (t) => localStorage.setItem("autocrat_token", t);
const clearToken = () => localStorage.removeItem("autocrat_token");
const getUserId = () => localStorage.getItem("autocrat_uid");
const setUserId = (id) => localStorage.setItem("autocrat_uid", id);

const getUserRole = () => localStorage.getItem("autocrat_role");
const setUserRole = (r) => localStorage.setItem("autocrat_role", r);

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

// ─── TOAST ───────────────────────────────────────────────────────────────────

let _setToast = null;
function Toast() {
  const [msg, setMsg] = useState(null);
  _setToast = (m) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
      background: "#120505", color: "#ff4d4d", padding: "18px 36px", borderRadius: 16,
      fontSize: 17, zIndex: 9999, border: "1px solid #e74c3c", letterSpacing: "0.02em",
      fontWeight: "600", boxShadow: "0 0 25px rgba(231,76,60,0.45),0 0 50px rgba(231,76,60,0.15)",
      transition: "all 0.3s ease",
    }}>{msg}</div>
  );
}
const toast = (m) => _setToast && _setToast(m);

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────

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

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "#111", border: "0.5px solid #2a2a2a",
  borderRadius: 8, padding: "13px 16px",
  color: "#e8e8e8", fontSize: 16, outline: "none", fontFamily: "inherit",
};
const btnStyle = {
  width: "100%", padding: "13px", borderRadius: 8,
  background: "#e8e8e8", color: "#080808",
  border: "none", fontSize: 16, fontWeight: 500, cursor: "pointer", marginTop: 4,
};

// ─── LIKED PERSISTENCE ────────────────────────────────────────────────────────

const LIKED_KEY = "autocrat_liked";
function getLikedSet() {
  try { return new Set((JSON.parse(localStorage.getItem(LIKED_KEY)) || []).map(Number)); }
  catch { return new Set(); }
}
function saveLiked(set) { localStorage.setItem(LIKED_KEY, JSON.stringify([...set])); }

// ─── COMMENT SECTION ─────────────────────────────────────────────────────────

function CommentSection({ postId, currentUserId, currentUserRole }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/comments/${postId}`);
      setComments(data);
      setCount(data.length);
      setLoaded(true);
    } catch (e) { toast(e.message); }
    finally { setLoading(false); }
  }, [postId]);

  function toggle() {
    if (!open && !loaded) fetchComments();
    setOpen(o => !o);
  }

  async function submitComment() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await apiFetch(`/comments/${postId}`, {
        method: "POST",
        body: JSON.stringify({ content: text.trim() }),
      });
      setComments(prev => [...prev, comment]);
      setCount(c => c + 1);
      setText("");
    } catch (e) { toast(e.message); }
    finally { setSubmitting(false); }
  }

  async function doDelete(commentId) {
    setConfirmDeleteId(null);
    try {
      await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCount(c => Math.max(0, c - 1));
      toast("Comment deleted");
    } catch (e) { toast(e.message); }
  }

  const uid = parseInt(currentUserId);

  return (
    <div style={{ marginTop: 12 }}>
      {confirmDeleteId !== null && (
        <ConfirmDialog
          message="Delete this comment?"
          onConfirm={() => doDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Toggle button */}
      <button onClick={toggle} style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6, padding: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open ? "#aaa" : "#555"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "stroke 0.15s" }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: 14, color: open ? "#aaa" : "#555", transition: "color 0.15s" }}>
          {loaded ? `${count} ${count === 1 ? "comment" : "comments"}` : "Comments"}
        </span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "0.5px solid #1e1e1e" }}>

          {/* Comment list */}
          {loading ? (
            <div style={{ color: "#333", fontSize: 14, paddingBottom: 12 }}>Loading…</div>
          ) : comments.length === 0 ? (
            <div style={{ color: "#333", fontSize: 14, paddingBottom: 12 }}>No comments yet. Be the first!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {comments.map(c => (
                <div key={c.id} style={{
                  background: "#0a0a0a", border: "0.5px solid #1e1e1e",
                  borderRadius: 8, padding: "10px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{ fontSize: 14, color: "#bbb", lineHeight: 1.55, flex: 1 }}>
                    {c.content}
                    {c.created_at && (
                      <span style={{ fontSize: 12, color: "#444", marginLeft: 10 }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {(currentUserRole === "ADMIN" || uid === c.user_id )&& (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      title="Delete comment"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#3a3a3a", fontSize: 14, padding: 0, lineHeight: 1,
                        flexShrink: 0, transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#e74c3c"}
                      onMouseLeave={e => e.currentTarget.style.color = "#3a3a3a"}
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New comment input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Write a comment…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              style={{ ...inputStyle, fontSize: 14, padding: "10px 14px" }}
            />
            <button
              onClick={submitComment}
              disabled={submitting || !text.trim()}
              style={{
                flexShrink: 0, padding: "10px 20px", borderRadius: 8,
                background: text.trim() ? "#e8e8e8" : "#161616",
                border: "0.5px solid #2a2a2a",
                color: text.trim() ? "#080808" : "#444",
                fontSize: 14, fontWeight: 500,
                cursor: text.trim() ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >{submitting ? "…" : "Post"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

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

// ─── POST CARD ────────────────────────────────────────────────────────────────

function PostCard({ post, showDelete = false, onDelete, liked = false, onLike, onUnlike, currentUserId, currentUserRole }) {
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
        {post.user?.email && (
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
              background: "rgba(231,76,60,0.05)", border: "1px solid rgba(231,76,60,0.4)", borderRadius: 6,
              color: "#e74c3c", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "6px 12px", marginLeft: 12, flexShrink: 0,
              boxShadow: "0 0 10px rgba(231,76,60,0.15)", textShadow: "0 0 8px rgba(231,76,60,0.4)",
            }}>
              {deleting ? "..." : "Delete"}
            </button>
          )}
        </div>

        {/* Like row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
          <button onClick={toggleLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"
              fill={liked ? "#e74c3c" : "none"}
              stroke={liked ? "#e74c3c" : "#555"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: animating ? "scale(1.35)" : "scale(1)", transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1),fill 0.15s ease" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ fontSize: 15, color: liked ? "#e74c3c" : "#555", transition: "color 0.15s", minWidth: 16 }}>{likeCount}</span>
          </button>
          <span style={{ fontSize: 13, color: "#555", marginLeft: "auto" }}>
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
          </span>
        </div>

        {/* Comments */}
        <CommentSection postId={post.id} currentUserId={currentUserId} currentUserRole={currentUserRole} />
      </div>
    </>
  );
}

// ─── NEW POST FORM ────────────────────────────────────────────────────────────

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
      background: "rgba(46,204,113,0.05)", border: "1px dashed rgba(46,204,113,0.4)",
      color: "#2ecc71", fontSize: 15, fontWeight: 500, cursor: "pointer", marginBottom: 20,
      boxShadow: "0 0 12px rgba(46,204,113,0.15)", textShadow: "0 0 8px rgba(46,204,113,0.4)",
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

// ─── FEED ─────────────────────────────────────────────────────────────────────

function Feed({ currentUserId, currentUserRole }) {
  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(() => getLikedSet());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLikedIds = useCallback(async () => {
    try {
      const data = await apiFetch("/vote/me");
      const mappedIds = data.map(item => typeof item === "object" ? (item.post_id || item.id) : item);
      const s = new Set(mappedIds.map(Number));
      setLikedIds(s); saveLiked(s);
    } catch { setLikedIds(getLikedSet()); }
  }, []);

  // const fetchUserEmail = useCallback(async (userId, cache) => {
  //   if (cache[userId]) return;
  //   try {
  //     const u = await apiFetch(`/users/${userId}`);
  //     setUserCache(prev => ({ ...prev, [userId]: u.email }));
  //   } catch { /* ignore */ }
  // }, []);

  const fetchPosts = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const data = await apiFetch(`/posts/?limit=30&search=${encodeURIComponent(q)}`);

      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setPosts(sorted);
    } catch (e) {
      toast(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
        <div style={{ color: "#555", fontSize: 15, textAlign: "center", padding: 40 }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#555", fontSize: 15, textAlign: "center", padding: 40 }}>No posts yet</div>
      ) : posts.map(p => (
        <PostCard
          key={p.id}
          post={p}
          showDelete={currentUserRole === "ADMIN" || p.user_id === parseInt(currentUserId)}
          liked={likedIds.has(p.id)}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
          onLike={handleLike}
          onUnlike={handleUnlike}
        />
      ))}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

function Profile({ userId, currentUserRole }) {
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
        <div style={{ color: "#555", fontSize: 15, textAlign: "center", padding: 40 }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#555", fontSize: 15, textAlign: "center", padding: 40 }}>No posts yet</div>
      ) : posts.map(p => (
        <PostCard
          key={p.id}
          post={p}
          showDelete={currentUserRole === "ADMIN" || p.user_id === parseInt(userId)}
          liked={likedIds.has(p.id)}
          currentUserId={userId}
          currentUserRole={currentUserRole}
          onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
          onLike={handleLike}
          onUnlike={handleUnlike}
        />
      ))}
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────

function Shell({ onLogout }) {
  const [tab, setTab] = useState("feed");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const uid = getUserId();
  const role = getUserRole();

  const nav = [
    { id: "feed", label: "Feed" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#080808", color: "#e8e8e8", margin: 0, padding: 0 }}>
      {confirmLogout && (
        <ConfirmDialog
          message="Sign out?"
          onConfirm={() => { setConfirmLogout(false); toast("Signed out"); setTimeout(onLogout, 800); }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
      <div style={{
        borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center",
        padding: "0 40px", height: 80, position: "sticky", top: 0,
        background: "#080808", zIndex: 100, width: "100%", boxSizing: "border-box",
      }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 36, fontWeight: 400, color: "#e8e8e8", letterSpacing: "-0.02em", marginRight: "auto" }}>
          Autocrat
        </span>
        {nav.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: tab === n.id ? "#e8e8e8" : "#555",
            fontSize: 20, padding: "0 28px", height: "100%",
            transition: "all 0.2s ease",
            borderBottom: tab === n.id ? "3px solid #e8e8e8" : "3px solid transparent",
            letterSpacing: "0.02em",
          }}>{n.label}</button>
        ))}
        <button onClick={() => setConfirmLogout(true)} style={{
          background: "rgba(231,76,60,0.05)", border: "1px solid rgba(231,76,60,0.4)", borderRadius: 8,
          color: "#e74c3c", fontSize: 17, fontWeight: 600, padding: "12px 24px", cursor: "pointer", marginLeft: 24,
          boxShadow: "0 0 15px rgba(231,76,60,0.1)", textShadow: "0 0 8px rgba(231,76,60,0.4)",
        }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        {tab === "feed" && <Feed currentUserId={uid} currentUserRole={role} />}
        {tab === "profile" && <Profile userId={uid} currentUserRole={role} />}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());

  function logout() {
    clearToken();
    localStorage.removeItem("autocrat_uid");
    localStorage.removeItem("autocrat_role");
    localStorage.removeItem(LIKED_KEY);
    setAuthed(false);
  }

  return (
    <>
      <Toast />
      {authed ? <Shell onLogout={logout} /> : <AuthScreen onAuth={() => setAuthed(true)} />}
    </>
  );
}