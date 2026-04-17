import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { toast, ConfirmDialog } from "./Shared";
import { CommentSection } from "./Comments";

export function PostCard({ post, showDelete = false, onDelete, liked = false, onLike, onUnlike, currentUserId, currentUserRole }) {
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
      <div className="post-card">
        {post.user?.email && <div className="post-author">{post.author_email}</div>}
        <div className="post-header">
          <div style={{ flex: 1 }}>
            <div className="post-title">{post.title}</div>
            {post.content && <div className="post-content">{post.content}</div>}
          </div>
          {showDelete && (
            <button onClick={() => setConfirm(true)} disabled={deleting} className="btn-delete-post">
              {deleting ? "..." : "Delete"}
            </button>
          )}
        </div>

        <div className="post-footer">
          <button onClick={toggleLike} className="btn-like">
            <svg 
              width="20" height="20" viewBox="0 0 24 24" 
              fill={liked ? "#e74c3c" : "none"} 
              stroke={liked ? "#e74c3c" : "#555"} 
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className={`icon-like ${animating ? "animating" : ""}`}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className={`like-count ${liked ? "liked" : ""}`}>{likeCount}</span>
          </button>
          <span className="post-date">
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
          </span>
        </div>

        <CommentSection postId={post.id} currentUserId={currentUserId} currentUserRole={currentUserRole} />
      </div>
    </>
  );
}

export function NewPostForm({ onCreated }) {
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
    <button onClick={() => setOpen(true)} className="btn-new-post-trigger">
      + New post
    </button>
  );

  return (
    <div className="new-post-container">
      <input 
        placeholder="Title" 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        className="autocrat-input new-post-title-input" 
        autoFocus 
      />
      <textarea 
        placeholder="What's on your mind? (optional)" 
        value={content} 
        onChange={e => setContent(e.target.value)} 
        rows={3} 
        className="autocrat-input new-post-content-input" 
      />
      <div className="new-post-actions">
        <button 
          onClick={submit} 
          disabled={loading || !title.trim()} 
          className="autocrat-btn btn-submit-post"
        >
          {loading ? "..." : "Post"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-cancel-post">
          Cancel
        </button>
      </div>
    </div>
  );
}