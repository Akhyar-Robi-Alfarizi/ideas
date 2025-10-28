import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Me() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

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
      alert("Profile updated");
      // reset edit mode
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "Failed");
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
    const normalized = p.startsWith("/") ? p : `/${p.replace(/^\/+/g, "")}`;
    return base + normalized;
  }
  const fallbackAvatar = absUrl("/uploads/default-gambar.webp") || "/default-gambar.webp";
  const avatarUrl = absUrl(me.avatar) || fallbackAvatar;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-6">
        <div>
          <img src={avatarUrl} alt="avatar" className="w-40 h-40 rounded-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{me.display_name}</h1>
          <div className="text-sm text-slate-500">@{me.username || me.email.split("@")[0]}</div>
          <div className="mt-3">
            <div><span className="font-semibold">{userIdeas.length}</span> Posting</div>
          </div>
          <p className="mt-3 text-slate-700">{me.bio || "Belum ada biodata."}</p>
          <div className="mt-3">
            {!editMode ? (
              <button className="btn-primary mr-2" onClick={()=>setEditMode(true)}>Edit profil</button>
            ) : null}
          </div>
        </div>
      </header>

      {editMode && (
        <div className="card p-4 max-w-md">
          <h3 className="font-semibold mb-3">Edit profil</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm">Nama</label>
              <input className="w-full border rounded p-2" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
              {errors.display_name && <div className="text-red-600 text-sm">{errors.display_name}</div>}
            </div>

            <div>
              <label className="block text-sm">Bio</label>
              <textarea className="w-full border rounded p-2" rows={4} value={bio} onChange={e=>setBio(e.target.value)} />
              {errors.bio && <div className="text-red-600 text-sm">{errors.bio}</div>}
            </div>

            <div>
              <label className="block text-sm">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <img
                    src={avatarPreview || avatarUrl}
                    alt="preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={e=>{
                    const f = e.target.files?.[0] || null;
                    setAvatarFile(f);
                    setErrors((s)=>({ ...s, avatar: undefined }));
                    if (f) setAvatarPreview(URL.createObjectURL(f)); else setAvatarPreview(null);
                  }} />
                  {errors.avatar && <div className="text-red-600 text-sm">{errors.avatar}</div>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan'}</button>
              <button type="button" className="btn-ghost" onClick={()=>{ setEditMode(false); setErrors({}); setAvatarPreview(null); setAvatarFile(null); setDisplayName(me.display_name||""); setBio(me.bio||""); }}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Postingan</h2>
        {userIdeas.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada postingan.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {userIdeas.map((it) => (
              <div key={it.id} className="rounded overflow-hidden">
                {it.thumbnail ? (
                  <img src={absUrl(it.thumbnail)} alt={it.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 flex items-center justify-center">{it.title}</div>
                )}
                <div className="p-2">
                  <div className="text-sm font-medium">{it.title}</div>
                  <div className="text-xs text-slate-500">{it.total_likes ?? 0} suka • {new Date(it.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
