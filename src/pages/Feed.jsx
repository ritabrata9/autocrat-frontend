import { useState, useEffect, useCallback } from "react";
import { apiFetch, getLikedSet, saveLiked } from "../utils/api";
import { toast } from "../components/Shared";
import { PostCard, NewPostForm } from "../components/Post";

// Add onNavigateToProfile to the props
export function Feed({ currentUserId, currentUserRole, onNavigateToProfile }) {
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

  const fetchPosts = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const data = await apiFetch(`/posts/?limit=30&search=${encodeURIComponent(q)}`);
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sorted);
    } catch (e) { toast(e.message); } 
    finally { setLoading(false); }
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
      <input 
        placeholder="Search posts..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
        className="autocrat-input feed-search-input" 
      />
      <NewPostForm onCreated={p => setPosts(prev => [{ like_count: 0, ...p }, ...prev])} />
      
      {loading ? (
        <div className="profile-center">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="profile-center">No posts yet</div>
      ) : posts.map(p => (
        <PostCard
          key={p.id} post={p}
          showDelete={currentUserRole === "ADMIN" || p.user_id === parseInt(currentUserId)}
          liked={likedIds.has(p.id)}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
          onLike={handleLike} onUnlike={handleUnlike}
          onUserClick={onNavigateToProfile} // Pass the function down here
        />
      ))}
    </div>
  );
}