import { useState } from "react";
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

  return (
    <form className="card p-4 space-y-3" onSubmit={submit}>
      <h2 className="text-lg font-semibold">Unggah Ide</h2>
      <input className="input" placeholder="Judul" value={title} onChange={e=>setTitle(e.target.value)} required />
      <textarea className="input min-h-[160px]" placeholder="Deskripsi"
        value={description} onChange={e=>setDesc(e.target.value)} required />
      <input className="input" placeholder="ID Kategori (opsional)" value={categoryId} onChange={e=>setCat(e.target.value)} />
      <button className="btn-primary" disabled={loading}>{loading ? "Menyimpan…" : "Simpan"}</button>
    </form>
  );
}
