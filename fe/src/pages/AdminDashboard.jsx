import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("ideas");
  const [ideas, setIdeas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);

  useEffect(() => {
    load();
  }, [tab]);

  async function load() {
    setLoading(true);
    try {
      if (tab === "ideas") {
        const { data } = await api.get("/admin/ideas-list", { params: { limit: 100 } });
        setIdeas(data?.data ?? data ?? []);
      } else if (tab === "reports") {
        const { data } = await api.get("/admin/logs");
        setLogs(data?.data ?? data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function doIdeaAction(ideaId, action) {
    let reason = null;
    if (action === "delete_idea") {
      reason = window.prompt("Alasan menghapus ide:");
      if (!reason) {
        toast.warning({
          title: "Aksi dibatalkan",
          description: "Kamu perlu memberikan alasan sebelum menghapus ide.",
        });
        return;
      }
    }
    try {
      await api.patch(`/admin/ideas/${ideaId}`, { action, reason });
      toast.success({
        title: "Tindakan berhasil",
        description: labelForAction(action),
      });
      await load();
    } catch (e) {
      toast.error({
        title: "Gagal menjalankan tindakan",
        description: e?.response?.data?.error || e.message || "Terjadi kesalahan pada server",
      });
    }
  }

  const isModerator = user?.role === "moderator";
  const filteredIdeas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ideas.filter((idea) => {
      if (showHiddenOnly && idea.status !== "hidden") return false;
      if (!term) return true;
      const target = `${idea.title ?? ""} ${idea.author ?? ""}`.toLowerCase();
      return target.includes(term);
    });
  }, [ideas, search, showHiddenOnly]);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 px-8 py-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Ruang Inovator</p>
            <h1 className="mt-1 text-3xl font-semibold">
              {isModerator ? "Moderator Workspace" : "Admin Dashboard"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              {isModerator
                ? "Kelola ide yang dilaporkan, sembunyikan konten bermasalah, dan jaga kualitas komunitas."
                : "Pantau aktivitas platform dan lakukan tindakan administratif secara cepat."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm font-semibold">
            <StatCard label="Total Ide" value={ideas.length} />
            <StatCard label="Hidden" value={ideas.filter((i) => i.status === "hidden").length} subtle />
            <StatCard label="Moderation Logs" value={logs.length} subtle />
          </div>
        </div>
      </header>

      <nav className="flex gap-3 text-sm font-semibold">
        <FilterTab label="Ideas" active={tab === "ideas"} onClick={() => setTab("ideas")} />
        <FilterTab label="Reports" active={tab === "reports"} onClick={() => setTab("reports")} />
      </nav>

      {loading && (
        <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-100/50">
          <p className="text-sm text-slate-500">Memuat…</p>
        </div>
      )}

      {!loading && tab === "ideas" && (
        <section className="space-y-6 rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-100/50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-indigo-100 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/60 md:w-80"
                  placeholder="Cari judul atau author"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-indigo-400">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M13.786 12.379 17.5 16.09 16.09 17.5l-3.711-3.714a6 6 0 1 1 1.407-1.407ZM8.5 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                  </svg>
                </span>
              </div>
              <div className="flex gap-2">
                <Pill label="All" active={!search && !showHiddenOnly} onClick={() => { setSearch(""); setShowHiddenOnly(false); }} />
                <Pill label="Hidden" active={showHiddenOnly} onClick={() => setShowHiddenOnly((prev) => !prev)} />
              </div>
            </div>
            <span className="text-sm text-slate-500">
              Menampilkan {filteredIdeas.length} dari {ideas.length} ide
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-4">Judul</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Dibuat</th>
                  <th className="px-6 py-4">Likes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredIdeas.map((idea) => (
                  <tr key={idea.id} className="transition hover:bg-indigo-50/40">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{idea.title}</span>
                        <span className="text-xs text-slate-400">ID #{idea.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-600">{idea.author}</span>
                        <span className="text-xs text-slate-400">{idea.author_role || "user"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(idea.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{idea.total_likes ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(idea.status)}`}>
                        {idea.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isModerator ? (
                        <div className="flex justify-end gap-2">
                          {idea.status === "hidden" ? (
                            <button
                              className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              onClick={() => doIdeaAction(idea.id, "unhide_idea")}
                            >
                              Unhide
                            </button>
                          ) : (
                            <button
                              className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              onClick={() => doIdeaAction(idea.id, "hide_idea")}
                            >
                              Hide
                            </button>
                          )}
                          <button
                            className="rounded-full bg-red-500 px-4 py-1 text-xs font-semibold text-white shadow hover:bg-red-600"
                            onClick={() => doIdeaAction(idea.id, "delete_idea")}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Tidak ada aksi</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!filteredIdeas.length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                      Tidak ada ide yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && tab === "reports" && (
        <section className="space-y-6 rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-100/50">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">Moderation Logs</h2>
            <p className="text-sm text-slate-500">{logs.length} catatan terbaru</p>
          </header>
          {logs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 py-10 text-center text-sm text-indigo-500">
              Belum ada aktivitas moderasi.
            </p>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {logs.map((entry) => (
                    <tr key={entry.id} className="transition hover:bg-indigo-50/40">
                      <td className="px-6 py-4 font-semibold text-slate-700">#{entry.id}</td>
                      <td className="px-6 py-4 text-slate-600">{entry.actor_name}</td>
                      <td className="px-6 py-4 text-slate-500">{entry.action}</td>
                      <td className="px-6 py-4 text-slate-500">{entry.target_type}#{entry.target_id}</td>
                      <td className="px-6 py-4 text-slate-500">{entry.reason || "-"}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(entry.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, subtle }) {
  return (
    <div className={`rounded-2xl px-5 py-4 shadow-lg ${subtle ? "bg-white/15" : "bg-white/25"}`}>
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function FilterTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-indigo-500 text-white shadow" : "bg-white text-slate-500 shadow-sm hover:bg-indigo-50"
      }`}
    >
      {label}
    </button>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
        active ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function statusBadge(status) {
  const normalized = (status || "active").toLowerCase();
  switch (normalized) {
    case "hidden":
      return "bg-red-50 text-red-500";
    case "pending":
      return "bg-amber-50 text-amber-500";
    default:
      return "bg-emerald-50 text-emerald-500";
  }
}

function labelForAction(action) {
  switch (action) {
    case "hide_idea":
      return "Ide berhasil disembunyikan.";
    case "unhide_idea":
      return "Ide berhasil ditampilkan kembali.";
    case "delete_idea":
      return "Ide dihapus dari sistem.";
    default:
      return "Tindakan selesai dijalankan.";
  }
}
