import { useState, useCallback } from "react";
import { apiFetch } from "../utils/api";
import { toast, ConfirmDialog } from "./Shared";

export function CommentSection({ postId, currentUserId, currentUserRole }) {
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
    } catch (e) {
      toast(e.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  function toggle() {
    if (!open && !loaded) fetchComments();
    setOpen((o) => !o);
  }

  async function submitComment() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await apiFetch(`/comments/${postId}`, {
        method: "POST",
        body: JSON.stringify({ content: text.trim() }),
      });
      setComments((prev) => [...prev, comment]);
      setCount((c) => c + 1);
      setText("");
    } catch (e) {
      toast(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function doDelete(commentId) {
    setConfirmDeleteId(null);
    try {
      await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCount((c) => Math.max(0, c - 1));
      toast("Comment deleted");
    } catch (e) {
      toast(e.message);
    }
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

      <button
        onClick={toggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? "#aaa" : "#555"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: 14, color: open ? "#aaa" : "#555" }}>
          {loaded
            ? `${count} ${count === 1 ? "comment" : "comments"}`
            : "Comments"}
        </span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "0.5px solid #1e1e1e",
          }}
        >
          {loading ? (
            <div style={{ color: "#333", fontSize: 14, paddingBottom: 12 }}>
              Loading…
            </div>
          ) : comments.length === 0 ? (
            <div style={{ color: "#FFFFFF", fontSize: 14, paddingBottom: 12 }}>
              No comments yet. Be the first!
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "#0a0a0a",
                    border: "0.5px solid #1e1e1e",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: "#bbb",
                      lineHeight: 1.55,
                      flex: 1,
                    }}
                  >
                    {c.content}
                    {c.created_at && (
                      <span
                        style={{ fontSize: 12, color: "#444", marginLeft: 10 }}
                      >
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {(currentUserRole === "ADMIN" || uid === c.user_id) && (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      title="Delete comment"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#3a3a3a",
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
              style={{
                fontSize: 14,
                padding: "10px 14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                outline: "none",
                width: "100%",
              }}
            />
            <button
              onClick={submitComment}
              disabled={submitting || !text.trim()}
              style={{
                flexShrink: 0,
                padding: "10px 20px",
                borderRadius: 8,
                background: text.trim() ? "#333" : "#161616",
                border: "0.5px solid #2a2a2a",
                color: text.trim() ? "#00FF00" : "#444",
                fontSize: 14,
                fontWeight: 500,
                cursor: text.trim() ? "pointer" : "default",
              }}
            >
              {submitting ? "…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
