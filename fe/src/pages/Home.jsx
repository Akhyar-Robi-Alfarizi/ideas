import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import IdeaCard from "../components/IdeaCard";

export default function Home() {
  const [items, setItems] = useState([]);
  const [sp, setSp] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const q = sp.get("q") || "";
  const sort = sp.get("sort") || "new";
  const page = Number(sp.get("page") || 1);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/ideas", { params: { q, sort, page, limit: 10 } });
      setItems(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [q, sort, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="input"
          placeholder="Cari ide…"
          defaultValue={q}
          onKeyDown={(e) => e.key === "Enter" && setSp({ q: e.currentTarget.value })}
        />
        <select
          className="input max-w-[12rem]"
          value={sort}
          onChange={(e) => setSp({ q, sort: e.target.value })}
        >
          <option value="new">Terbaru</option>
          <option value="popular7d">Terpopuler 7 hari</option>
          <option value="popularAll">Terpopuler semua</option>
        </select>
      </div>

      {loading ? <p>Memuat…</p> : (
        <div className="grid gap-3">
          {items.map((it) => <IdeaCard key={it.id} idea={it} />)}
          {!items.length && <p>Tidak ada data.</p>}
        </div>
      )}

      <div className="flex gap-2">
        <Link className="btn-ghost" to={`/?q=${q}&sort=${sort}&page=${Math.max(1, page-1)}`}>Prev</Link>
        <Link className="btn-ghost" to={`/?q=${q}&sort=${sort}&page=${page+1}`}>Next</Link>
      </div>
    </div>
  );
}
