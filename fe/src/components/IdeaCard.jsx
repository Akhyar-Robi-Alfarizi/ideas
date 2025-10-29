import { Link } from "react-router-dom";

export default function IdeaCard({ idea }) {
  const thumbnail = toAbsoluteUrl(idea.thumbnail);
  const hasThumbnail = Boolean(thumbnail);
  const createdAt = idea.created_at ? new Date(idea.created_at) : null;

  const commentsCount = idea.total_comments ?? idea.comments_count ?? 0;
  const likesCount = idea.total_likes ?? idea.likes ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2.25rem] border border-slate-100 bg-white shadow-lg shadow-indigo-100/60 transition hover:-translate-y-1 hover:shadow-2xl">
      {hasThumbnail ? (
        <figure className="relative h-40 w-full overflow-hidden">
          <img src={thumbnail} alt={idea.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
          {idea.category && (
            <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-white/90 px-4 py-1 text-xs font-semibold text-indigo-500 shadow">
              {idea.category}
            </span>
          )}
        </figure>
      ) : (
        <div className="h-32 w-full bg-gradient-to-r from-indigo-100 via-slate-100 to-white" />
      )}

      <div className="flex flex-1 flex-col gap-6 px-6 pb-6 pt-7 xl:px-8 xl:pb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
            <span>{idea.category ? idea.category : "Posting"}</span>
            {createdAt && <span>{createdAt.toLocaleDateString()}</span>}
          </div>

          <Link
            to={`/ideas/${idea.slug || idea.id}`}
            className="text-lg font-semibold leading-tight text-slate-800 transition hover:text-indigo-600"
          >
            {idea.title}
          </Link>

          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {idea.description || idea.summary || "Tidak ada deskripsi."}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          <span>oleh {idea.author || "Anonim"}</span>
        </div>

        <footer className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <Stat icon={<HeartIcon />} value={likesCount} label="Likes" highlight={likesCount > 0} />
            <Stat icon={<CommentIcon />} value={commentsCount} label="Comments" />
          </div>
          <Link to={`/ideas/${idea.slug || idea.id}`} className="flex items-center gap-2 text-xs font-semibold text-indigo-500">
            <span>Lihat Detail</span>
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </footer>
      </div>
    </article>
  );
}

function Stat({ icon, value, label, highlight }) {
  const iconClasses = highlight ? "bg-rose-100 text-rose-500" : "bg-slate-100 text-slate-500";
  const textClasses = highlight ? "text-rose-500" : "text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${textClasses}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${iconClasses}`}>
        {icon}
      </span>
      <span>
        {value}
        <span className="ml-1 text-xs font-normal text-slate-400">{label}</span>
      </span>
    </span>
  );
}

function HeartIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 17.25a.75.75 0 0 1-.53-.22l-6.1-6.1A4.52 4.52 0 0 1 2 7.63 4.63 4.63 0 0 1 6.63 3a4.37 4.37 0 0 1 3.37 1.53A4.36 4.36 0 0 1 13.37 3 4.63 4.63 0 0 1 18 7.63a4.52 4.52 0 0 1-1.37 3.3l-6.1 6.1a.75.75 0 0 1-.53.22Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4.5 5h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4.5A1.5 1.5 0 0 1 3 12.5v-6A1.5 1.5 0 0 1 4.5 5Z" />
    </svg>
  );
}

function toAbsoluteUrl(path) {
  if (!path || path === "null" || path === "undefined") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";
  const normalized = path.startsWith("/") ? path : `/${path.replace(/^\/+/g, "")}`;
  return `${base}${normalized}`;
}
