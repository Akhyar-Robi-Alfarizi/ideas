import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function IdeaForm() {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [categoryId, setCat] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/ideas", {
        title, description, category_id: categoryId ? Number(categoryId) : null
      });
      nav(`/ideas/${data.slug || data.id}`);
    } finally { setLoading(false); }
  }

  const titleCount = title.trim().length;
  const descCount = description.trim().length;
  const categoryHint = useMemo(() => {
    if (!categoryId) return "Opsional, pilih jika sudah memiliki kategori";
    if (!Number.isInteger(Number(categoryId))) return "ID kategori harus angka";
    return "Tekan simpan untuk menggunakan kategori ini";
  }, [categoryId]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-xl shadow-indigo-100/60 lg:p-12">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Ruang Inovator</span>
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">Unggah ide baru</h1>
        <p className="text-sm text-slate-500">Bagikan gagasan terbaikmu untuk menginspirasi komunitas.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[ minmax(0,1fr)_minmax(260px,320px) ] lg:items-start">
        <form className="space-y-6" onSubmit={submit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Judul</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring focus:ring-indigo-100"
              placeholder="Ceritakan judul ide mu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="flex justify-end text-xs text-slate-400">{titleCount}/120</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Deskripsi</label>
            <textarea
              className="h-48 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring focus:ring-indigo-100"
              placeholder="Jelaskan ide, manfaat, dan bagaimana ide tersebut bisa diwujudkan."
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
            <div className="flex justify-end text-xs text-slate-400">{descCount}/1000</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">ID Kategori (opsional)</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring focus:ring-indigo-100"
              placeholder="Misal: 3"
              value={categoryId}
              onChange={(e) => setCat(e.target.value)}
            />
            <p className="text-xs text-slate-400">{categoryHint}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? "Menyimpan…" : "Simpan Ide"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              onClick={() => {
                setTitle("");
                setDesc("");
                setCat("");
              }}
            >
              Reset
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-indigo-100 bg-white p-6 text-sm text-slate-600 shadow-md shadow-indigo-100/40">
            <h2 className="text-base font-semibold text-slate-800">Tips penulisan</h2>
            <ul className="mt-3 space-y-2 list-disc pl-4">
              <li>Mulai dengan konteks masalah yang ingin diselesaikan.</li>
              <li>Sebutkan siapa yang akan merasakan manfaat dari ide ini.</li>
              <li>Jelaskan langkah awal atau sumber daya yang dibutuhkan.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Kenapa ide penting?</h3>
            <p className="mt-3 leading-relaxed">
              Unggahan ide yang jelas dan inspiratif akan memudahkan anggota lain untuk memahami,
              mendukung, bahkan membantu mewujudkannya. Gunakan bahasa yang ramah dan ringkas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
