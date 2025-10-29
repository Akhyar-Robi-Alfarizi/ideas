import { useEffect, useState } from "react";
import { api } from "../api/axios";
import IdeaCard from "../components/IdeaCard";
import { useToast } from "../context/ToastContext";

export default function Me() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const toast = useToast();

  async function load() {
    const { data } = await api.get("/auth/me");
    setMe(data);
    setDisplayName(data.display_name || "");
    setBio(data.bio || "");
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    // client-side validation
    const newErrors = {};
    if (!displayName || displayName.trim().length < 3) newErrors.display_name = "Nama minimal 3 karakter";
    if (bio && bio.length > 500) newErrors.bio = "Bio maksimal 500 karakter";
    if (avatarFile) {
      if (!avatarFile.type.startsWith("image/")) newErrors.avatar = "Avatar harus berupa gambar";
      if (avatarFile.size > 2 * 1024 * 1024) newErrors.avatar = "Ukuran avatar maksimal 2MB";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    const fd = new FormData();
    fd.append("display_name", displayName);
    fd.append("bio", bio);
    if (avatarFile) fd.append("avatar", avatarFile);
    try {
      setLoading(true);
      // let axios set Content-Type with boundary
      const { data } = await api.patch("/auth/me", fd);
      setMe(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      toast.success({
        title: "Profil berhasil diperbarui",
        description: "Perubahan yang kamu simpan sudah diterapkan.",
      });
      // reset edit mode
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error({
        title: "Gagal memperbarui profil",
        description: err?.response?.data?.error || err.message || "Terjadi kesalahan tak terduga",
      });
    } finally { setLoading(false); }
  }

  const [userIdeas, setUserIdeas] = useState([]);

  useEffect(() => {
    if (me?.id) {
      api.get(`/ideas/user/${me.id}`).then(r => setUserIdeas(r.data)).catch(()=>setUserIdeas([]));
    }
  }, [me]);

  if (!me) return <p>Memuat…</p>;
  function absUrl(p) {
    if (!p) return null;
    if (p === "null" || p === "undefined") return null;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";
    const normalized = p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`;
    return base + normalized;
  }
  const fallbackAvatar = absUrl("/uploads/default-gambar.webp") || "/default-gambar.webp";
  const avatarUrl = absUrl(me.avatar) || fallbackAvatar;

  return (
    <div className="space-y-8 xl:space-y-10">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-sky-400 p-8 text-white shadow-xl xl:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between xl:gap-10">
          <div className="flex items-start gap-4">
            <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white/60 shadow-lg">
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Ruang Inovator</p>
              <h1 className="mt-2 text-3xl font-semibold">{me.display_name || me.username}</h1>
              <div className="mt-1 text-sm text-white/80">@{me.username || me.email.split("@")[0]}</div>
              <p className="mt-4 max-w-xl text-sm text-white/80">{me.bio || "Belum ada biodata."}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4 text-sm xl:items-start">
            <div className="grid grid-cols-2 gap-4 text-center text-white xl:grid-cols-3 xl:gap-6">
              <StatBox label="Posting" value={userIdeas.length} />
              <StatBox label="Email" value={me.email} subtle />
            </div>
            {!editMode && (
              <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-600 shadow" onClick={() => setEditMode(true)}>
                Edit Profil
              </button>
            )}
          </div>
        </div>
      </header>

      {editMode && (
        <div className="max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Edit profil</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Nama</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
              {errors.display_name && <div className="mt-1 text-xs font-medium text-rose-600">{errors.display_name}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">Bio</label>
              <textarea className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" rows={4} value={bio} onChange={e=>setBio(e.target.value)} />
              {errors.bio && <div className="mt-1 text-xs font-medium text-rose-600">{errors.bio}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">Avatar</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200">
                  <img
                    src={avatarPreview || avatarUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={e=>{
                    const f = e.target.files?.[0] || null;
                    setAvatarFile(f);
                    setErrors((s)=>({ ...s, avatar: undefined }));
                    if (f) setAvatarPreview(URL.createObjectURL(f)); else setAvatarPreview(null);
                  }} />
                  <p className="mt-1 text-xs text-slate-500">Format .JPG/.PNG maks 2MB</p>
                  {errors.avatar && <div className="mt-1 text-xs font-medium text-rose-600">{errors.avatar}</div>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Menyimpan…" : "Simpan"}</button>
              <button type="button" className="btn-ghost" onClick={()=>{
                setEditMode(false);
                setErrors({});
                setAvatarPreview(null);
                setAvatarFile(null);
                setDisplayName(me.display_name||"");
                setBio(me.bio||"");
              }}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <section className="space-y-4 xl:space-y-6">
        <header className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-indigo-400">My Ideas</p>
          <h2 className="text-xl font-semibold text-slate-800">Koleksi Karya Terbaik</h2>
          <p className="text-sm text-slate-500">Semua ide yang telah kamu bagikan ke komunitas.</p>
        </header>
        {userIdeas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/40 p-12 text-center text-sm text-indigo-500">
            Belum ada postingan. Bagikan ide pertamamu!
          </div>
        ) : (
          <div className="grid auto-rows-fr gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {userIdeas.map((it) => (
              <IdeaCard
                key={it.id}
                idea={{
                  ...it,
                  author: it.author || me.display_name || me.username,
                  thumbnail: it.thumbnail ? absUrl(it.thumbnail) : null,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatBox({ label, value, subtle }) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${subtle ? "bg-white/10" : "bg-white/20"}`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
