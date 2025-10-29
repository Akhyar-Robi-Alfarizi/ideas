import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import IdeaCard from "../components/IdeaCard";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 8;

export default function Home() {
  const [items, setItems] = useState([]);
  const [sp, setSp] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  const q = sp.get("q") || "";
  const sort = sp.get("sort") || "new";
  const page = Number(sp.get("page") || 1);
  const [search, setSearch] = useState(q);

  async function load() {
    setLoading(true);
    try {
  const { data } = await api.get("/ideas", { params: { q, sort, page, limit: PAGE_SIZE } });
      setItems(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [q, sort, page]);

  useEffect(() => { setSearch(q); }, [q]);

  useEffect(() => {
    let active = true;
    async function fetchProfile() {
      try {
        const { data } = await api.get("/auth/me");
        if (active) setProfile(data);
      } catch {
        if (active) setProfile(null);
      }
    }
    if (user) fetchProfile(); else setProfile(null);
    return () => { active = false; };
  }, [user?.id]);

  function absUrl(p) {
    if (!p || p === "null" || p === "undefined") return null;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";
    const normalized = p.startsWith("/") ? p : `/${p.replace(/^\/+/g, "")}`;
    return base + normalized;
  }

  const defaultAvatar = absUrl("/uploads/default-gambar.webp") || "/default-gambar.webp";
  const avatarSource = profile?.avatar ?? user?.avatar;
  const avatarUrl = absUrl(avatarSource) || defaultAvatar;
  const welcomeName = profile?.display_name || user?.display_name || user?.username || "Guest";
  const welcomeSubtitle = useMemo(() => {
    if (profile?.bio) return profile.bio;
    if (!user) return "Silakan masuk untuk membagikan ide terbaikmu";
    return "Your creativity keeps the community growing";
  }, [profile?.bio, user]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((idea) => {
      const title = idea.title ? idea.title.toLowerCase() : "";
      const summary = idea.summary ? idea.summary.toLowerCase() : "";
      const author = idea.author ? idea.author.toLowerCase() : "";
      return `${title} ${summary} ${author}`.includes(term);
    });
  }, [items, search]);

  const hasPrev = page > 1;
  const hasNext = items.length === PAGE_SIZE;

  return (
  <div className="space-y-8 pb-10 xl:space-y-10">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-400 to-sky-400 text-white shadow-xl">
          <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-36 -right-24 h-72 w-72 rounded-full bg-indigo-900/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 px-8 py-10 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/80">Ruang Inovator</p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Welcome {welcomeName}</h1>
            <p className="text-white/80 text-sm md:text-base">{welcomeSubtitle}</p>
            <div className="flex gap-4 text-indigo-50/90">
              <div>
                <p className="text-xs uppercase tracking-wide">Total Ide</p>
                <p className="text-2xl font-semibold">{filteredItems.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Filter</p>
                <p className="text-2xl font-semibold">{sort === "new" ? "Terbaru" : sort === "popular7d" ? "Populer 7D" : "Populer"}</p>
              </div>
            </div>
          </div>
            <div className="flex flex-col items-center gap-3">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white/80 shadow-lg">
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              </div>
              {user ? (
                <span className="rounded-full bg-white/20 px-4 py-1 text-xs font-medium uppercase tracking-wider">Logged in</span>
              ) : (
                <Link to="/login" className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-indigo-600 shadow">Masuk</Link>
              )}
            </div>
          </div>
        </div>
        <aside className="rounded-3xl bg-white p-6 shadow-lg shadow-indigo-100 ring-1 ring-indigo-100/70 xl:p-8">
          <h2 className="text-lg font-semibold text-slate-800">Aktivitas Terbaru</h2>
          <p className="mt-2 text-sm text-slate-500">Pantau ide terbaru dari komunitas tanpa ketinggalan.</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-600">
            {filteredItems.slice(0, 4).map((it) => (
              <li key={it.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="max-w-[60%] truncate font-medium text-slate-700">{it.title}</span>
                <Link to={`/ideas/${it.id}`} className="text-xs font-semibold text-indigo-500 hover:underline">Lihat</Link>
              </li>
            ))}
            {!filteredItems.length && <li className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-400">Belum ada aktivitas.</li>}
          </ul>
        </aside>
      </div>

      <div className="mt-10">
        <section className="space-y-8 xl:space-y-10">
          <div className="rounded-[2.75rem] bg-white shadow-xl shadow-indigo-100/70 ring-1 ring-indigo-100/80">
            <div className="flex flex-col gap-8 border-b border-indigo-50/80 px-8 py-8 md:flex-row md:items-center md:justify-between xl:px-12">
              <div className="max-w-xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" /> Sorotan
                </span>
                <h2 className="text-3xl font-semibold text-slate-800">Sorotan Ide Terbaru</h2>
                <p className="text-sm leading-relaxed text-slate-500">
                  Jelajahi inspirasi segar dari komunitas. Gunakan filter untuk menemukan ide paling relevan buatmu.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <div className="relative md:w-72">
                  <input
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-5 text-sm text-slate-700 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    placeholder="Cari ide inovatif…"
                    value={search}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearch(value);
                      setSp({ q: value, sort, page: 1 });
                    }}
                  />
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-indigo-400">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M13.786 12.379 17.5 16.09 16.09 17.5l-3.711-3.714a6 6 0 1 1 1.407-1.407ZM8.5 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                    </svg>
                  </span>
                </div>
                <select
                  className="rounded-3xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-600 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={sort}
                  onChange={(e) => setSp({ q, sort: e.target.value, page: 1 })}
                >
                  <option value="new">Terbaru</option>
                  <option value="popular7d">Terpopuler 7 hari</option>
                  <option value="popularAll">Terpopuler semua</option>
                </select>
                <span className="rounded-full bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-600">
                  Halaman {page}
                </span>
              </div>
            </div>

            <div className="space-y-6 px-8 py-8 xl:px-12 xl:py-10">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : filteredItems.length ? (
                <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredItems.map((it) => (
                    <IdeaCard key={it.id} idea={it} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-10 text-center text-sm text-indigo-500">
                  Belum ada ide sesuai pencarian.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Link
              aria-disabled={!hasPrev}
              className={`flex-1 rounded-2xl border border-indigo-100 bg-white py-3 text-center text-sm font-medium text-indigo-500 shadow transition ${hasPrev ? "hover:bg-indigo-50" : "pointer-events-none opacity-40"}`}
              to={`/?q=${encodeURIComponent(q)}&sort=${sort}&page=${Math.max(1, page - 1)}`}
            >
              Prev
            </Link>
            <Link
              aria-disabled={!hasNext}
              className={`flex-1 rounded-2xl bg-indigo-500 py-3 text-center text-sm font-semibold text-white shadow transition ${hasNext ? "hover:bg-indigo-600" : "pointer-events-none opacity-60"}`}
              to={`/?q=${encodeURIComponent(q)}&sort=${sort}&page=${page + 1}`}
            >
              Next
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
