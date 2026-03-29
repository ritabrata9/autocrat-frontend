import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, inputStyle, btnStyle } from "../utils";
import PostCard from "../components/PostCard";

export default function Feed() {
  const [content, setContent] = useState("");
  const [filterEmail, setFilterEmail] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => apiFetch("/posts/"),
  });

  const mutation = useMutation({
    mutationFn: (newPost) => apiFetch("/posts/", { method: "POST", body: JSON.stringify(newPost) }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries(["posts"]);
    },
  });

  const displayPosts = filterEmail 
    ? posts.filter(p => p.owner.email === filterEmail) 
    : posts;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
      <div style={{ background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #222" }}>
        <textarea 
          placeholder="What's happening?" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ ...inputStyle, height: "80px", resize: "none" }}
        />
        <button 
          onClick={() => mutation.mutate({ content })} 
          style={btnStyle}
          disabled={mutation.isPending || !content.trim()}
        >
          {mutation.isPending ? "Posting..." : "Post"}
        </button>
      </div>

      {filterEmail && (
        <div style={{ marginBottom: "15px", color: "#aaa", fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
          <span>Viewing posts by: <b>{filterEmail}</b></span>
          <span onClick={() => setFilterEmail(null)} style={{ color: "#3498db", cursor: "pointer" }}>Show All</span>
        </div>
      )}

      {isLoading ? <p style={{ color: "#444" }}>Loading feed...</p> : 
        displayPosts.map(post => (
          <PostCard key={post.id} post={post} onEmailClick={setFilterEmail} />
        ))
      }
    </div>
  );
}