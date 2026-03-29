import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../utils";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function Profile() {
  const { id } = useParams(); // Grabs the ID from the URL (e.g., /profile/123 -> 123)
  const { userId: myId } = useAuth(); // Grabs YOUR logged-in ID
  
  // If there's an ID in the URL, view that user. Otherwise, view yourself.
  const targetUserId = id ? parseInt(id) : myId;
  const isMyProfile = targetUserId === myId;

  // 1. Fetch User Info
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', targetUserId],
    queryFn: () => apiFetch(`/users/${targetUserId}`),
    enabled: !!targetUserId // Only run if we have an ID
  });

  // 2. Fetch User's Posts
  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ['posts', 'user', targetUserId],
    queryFn: async () => {
      const data = await apiFetch(`/posts/?limit=100`);
      return data
        .filter(p => p.user_id === targetUserId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: !!targetUserId
  });

  if (loadingUser) return <div style={{ color: "#333", padding: 40, textAlign: "center" }}>Loading profile...</div>;
  if (!user) return <div style={{ color: "#333", padding: 40, textAlign: "center" }}>User not found</div>;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div>
      {/* Profile Header */}
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
          <div style={{ fontSize: 22, fontWeight: 500, color: "#e8e8e8" }}>{posts?.length || 0}</div>
          <div style={{ fontSize: 13, color: "#444" }}>posts</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#444", marginBottom: 14, letterSpacing: "0.08em" }}>
        {isMyProfile ? "YOUR POSTS" : "POSTS"}
      </div>
      
      {/* Posts List */}
      {loadingPosts ? (
        <div style={{ color: "#333", fontSize: 15, textAlign: "center", padding: 40 }}>Loading posts...</div>
      ) : posts?.length === 0 ? (
        <div style={{ color: "#333", fontSize: 15, textAlign: "center", padding: 40 }}>No posts yet</div>
      ) : posts?.map(p => (
        <PostCard
          key={p.id}
          post={{ ...p, author_email: user.email }} // Inject the email so the card displays it
          showDelete={isMyProfile} // Only show the delete button if it's YOUR profile!
          initialLiked={false} // Note: You might want to pass actual liked state here later
        />
      ))}
    </div>
  );
}