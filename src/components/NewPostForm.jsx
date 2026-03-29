import { useState } from "react";
import { apiFetch, inputStyle, btnStyle } from "../utils";
import { toast } from "../toastBus";

export default function NewPostForm({ onCreated }) {
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
            background: "rgba(8, 101, 1, 0.08)",
            border: "0.5px dashed rgba(35, 179, 71, 0.4)",
            borderRadius: 12, color: "#15ff00",
            marginBottom: 20,
            cursor: "pointer", fontSize: 15,
            width: "100%", padding: "15px", marginLeft: 12, flexShrink: 0,
            letterSpacing: "0.05em",
            boxShadow: "0 0 8px rgba(7, 73, 22, 0.25)",
        }}>+ New post</button>
    );

    return (
        <div style={{ background: "#0f0f0f", border: "0.5px solid #2a2a2a", borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} autoFocus />
            <textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)}
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