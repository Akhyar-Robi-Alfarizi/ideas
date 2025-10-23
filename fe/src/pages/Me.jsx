import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Me() {
  const [me, setMe] = useState(null);
  useEffect(() => { api.get("/auth/me").then(r => setMe(r.data)); }, []);
  if (!me) return <p>Memuat…</p>;
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold">Profil</h2>
      <div>Email: {me.email}</div>
      <div>Nama: {me.display_name}</div>
      <div>Peran: {me.role}</div>
    </div>
  );
}
