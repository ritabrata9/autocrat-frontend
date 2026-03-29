import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../utils";

export default function PostCard({ post, onEmailClick }) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => apiFetch(`/posts/${post.id}/like`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(["posts"]),
  });

  return (
    <div style={{ background: "#000", border: "1px solid #1a1a1a", padding: "20px", borderRadius: "12px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <span 
          onClick={() => onEmailClick(post.owner.email)} 
          style={{ color: "#3498db", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
        >
          {post.owner.email}
        </span>
        <span style={{ color: "#444", fontSize: "12px" }}>{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <p style={{ margin: "0 0 15px 0", color: "#e1e1e1", lineHeight: "1.5" }}>{post.content}</p>
      <button 
        onClick={() => likeMutation.mutate()} 
        style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "14px" }}
      >
        ❤️ {post.likes || 0}
      </button>
    </div>
  );
}