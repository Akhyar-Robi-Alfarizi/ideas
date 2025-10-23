import { Link } from "react-router-dom";

export default function IdeaCard({ idea }) {
  return (
    <article className="card p-4">
      <div className="flex items-center justify-between">
        <Link to={`/ideas/${idea.slug || idea.id}`} className="font-semibold hover:underline">
          {idea.title}
        </Link>
        <span className="text-sm text-slate-500">{new Date(idea.created_at).toLocaleString()}</span>
      </div>
      <div className="mt-1 text-sm text-slate-600">
        oleh {idea.author} {idea.category ? `• ${idea.category}` : ""}
      </div>
      <div className="mt-3 text-slate-700 line-clamp-2">{idea.description?.slice(0,160)}…</div>
      <div className="mt-3 text-sm text-slate-600">👍 {idea.total_likes ?? 0}</div>
    </article>
  );
}
