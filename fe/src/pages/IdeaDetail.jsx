import { useEffect, useMemo, useState } from "react";
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
  const [submittingComment, setSubmittingComment] = useState(false);
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
    setSubmittingComment(true);
    try {
      await api.post(`/ideas/${idea.id}/comments`, { content: text });
      setCommentText("");
      await loadComments(idea.id);
    } catch (err) {
      // noop: you can show toast here
    } finally {
      setSubmittingComment(false);
    }
  }

  useEffect(() => { load(); }, [idOrSlug]);

  if (!idea) return <p>Memuat…</p>;
  const createdAt = idea.created_at ? new Date(idea.created_at) : null;
  const thumbnailUrl = toAbsoluteUrl(idea.thumbnail);
  const commentCount = comments.length;
  return (
    <div className="mx-auto max-w-6xl space-y-10 bg-slate-50/80 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <article className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl shadow-indigo-100/60">
        {thumbnailUrl && (
          <figure className="relative h-72 w-full overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={idea.title}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
            {idea.category && (
              <figcaption className="absolute left-8 top-8 inline-flex items-center rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500 shadow">
                {idea.category}
              </figcaption>
            )}
          </figure>
        )}

        <div className="space-y-7 px-8 pb-10 pt-9 lg:px-12">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            {idea.category && (
              <span className="rounded-full bg-slate-100 px-4 py-1 text-[11px]">{idea.category}</span>
            )}
            <span>oleh {idea.author || "Anonim"}</span>
            {createdAt && <span>{createdAt.toLocaleString()}</span>}
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-slate-900 lg:text-4xl">
            {idea.title}
          </h1>

          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-600 lg:text-lg">
            {idea.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="text-sm text-slate-400">
              Terakhir diperbarui {createdAt ? createdAt.toLocaleString() : "-"}
            </div>

            {token ? (
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring focus-visible:ring-rose-200 ${liked ? "bg-rose-500 text-white shadow-lg shadow-rose-200/60" : "bg-rose-50 text-rose-500 hover:bg-rose-100"}`}
              >
                <HeartIcon className="h-4 w-4" filled={liked} />
                {likes} suka
              </button>
            ) : (
              <span className="text-sm text-slate-500">Masuk untuk menyukai</span>
            )}
          </div>
        </div>
      </article>

      <section className="rounded-[2.25rem] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/70 lg:p-12">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Komentar</h2>
            <p className="text-sm text-slate-400">Apa pendapatmu tentang ide ini?</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {commentCount} {commentCount === 1 ? "Komentar" : "Komentar"}
          </span>
        </header>

        {token ? (
          <form onSubmit={submitComment} className="mb-10 space-y-3">
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring focus:ring-indigo-100"
              rows={4}
              placeholder="Tulis komentar yang membangun..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={submittingComment}
            />
            <div className="flex items-center justify-end gap-3">
              <button
                className="btn-primary"
                type="submit"
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
            Masuk untuk berkomentar dan bergabung dalam diskusi.
          </div>
        )}

        {loadingComments ? (
          <p className="text-sm text-slate-500">Memuat komentar…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => {
              const commentDate = c.created_at ? new Date(c.created_at).toLocaleString() : "";
              return (
                <li key={c.id} className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <CommentAvatar name={c.display_name} />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{c.display_name}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{commentDate}</span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{c.content}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function HeartIcon({ className, filled }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d="M10 17.25a.75.75 0 0 1-.53-.22l-6.1-6.1A4.52 4.52 0 0 1 2 7.63 4.63 4.63 0 0 1 6.63 3a4.37 4.37 0 0 1 3.37 1.53A4.36 4.36 0 0 1 13.37 3 4.63 4.63 0 0 1 18 7.63a4.52 4.52 0 0 1-1.37 3.3l-6.1 6.1a.75.75 0 0 1-.53.22Z" />
    </svg>
  );
}

function CommentAvatar({ name = "Anonim" }) {
  const initials = useMemo(() => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join("");
  }, [name]);

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-500">
      {initials || "?"}
    </span>
  );
}

function toAbsoluteUrl(path) {
  if (!path || path === "null" || path === "undefined") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";
  const normalized = path.startsWith("/") ? path : `/${path.replace(/^\/+/, "")}`;
  return `${base}${normalized}`;
}
