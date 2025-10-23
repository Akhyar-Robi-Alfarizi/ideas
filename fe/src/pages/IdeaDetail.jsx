import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function IdeaDetail() {
  const { idOrSlug } = useParams();
  const [idea, setIdea] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const { token } = useAuth();

  async function load() {
    const { data } = await api.get(`/ideas/${idOrSlug}`);
    setIdea(data);
    setLikes(Number(data.total_likes || 0));
    setLiked(Boolean(data.liked));
    if (data?.id) loadComments(data.id);
  }

  async function loadComments(ideaId) {
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/ideas/${ideaId}/comments`);
      setComments(data);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleLike() {
    if (!idea) return;
    // optimistic UI
    const prevLiked = liked;
    const prevLikes = likes;
    try {
      if (liked) {
        setLiked(false);
        setLikes(Math.max(0, likes - 1));
        const { data } = await api.delete(`/ideas/${idea.id}/like`);
        setLikes(data.likes);
        setLiked(Boolean(data.liked));
      } else {
        setLiked(true);
        setLikes(likes + 1);
        const { data } = await api.post(`/ideas/${idea.id}/like`);
        setLikes(data.likes);
        setLiked(Boolean(data.liked));
      }
    } catch (e) {
      // rollback on error
      setLiked(prevLiked);
      setLikes(prevLikes);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!idea || !commentText.trim()) return;
    const text = commentText.trim();
    try {
      await api.post(`/ideas/${idea.id}/comments`, { content: text });
      setCommentText("");
      await loadComments(idea.id);
    } catch (err) {
      // noop: you can show toast here
    }
  }

  useEffect(() => { load(); }, [idOrSlug]);

  if (!idea) return <p>Memuat…</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{idea.title}</h1>
      <div className="text-slate-600 text-sm">
        oleh {idea.author} • {new Date(idea.created_at).toLocaleString()}
      </div>
      <p className="whitespace-pre-wrap">{idea.description}</p>

      <div className="flex items-center gap-3">
        <span>👍 {likes}</span>
        {token ? (
          <button
            className={liked ? "btn-ghost" : "btn-primary"}
            onClick={handleLike}
          >
            {liked ? "Un-like" : "Like"}
          </button>
        ) : (
          <span className="text-sm text-slate-500">Masuk untuk menyukai</span>
        )}
      </div>

      <hr className="my-4" />
      <section>
        <h2 className="font-semibold mb-2">Komentar</h2>
        {token ? (
          <form onSubmit={submitComment} className="space-y-2 mb-4">
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Tulis komentar..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="text-right">
              <button className="btn-primary" type="submit" disabled={!commentText.trim()}>
                Kirim
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500 mb-2">Masuk untuk berkomentar</div>
        )}

        {loadingComments ? (
          <p>Memuat komentar…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada komentar.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="border rounded p-2">
                <div className="text-sm text-slate-600 mb-1">
                  <span className="font-medium">{c.display_name}</span>
                  <span> • {new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="whitespace-pre-wrap">{c.content}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
