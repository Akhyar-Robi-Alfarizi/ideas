import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("ideas");
  const [ideas, setIdeas] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    try {
      if (tab === "ideas") {
        const { data } = await api.get(`/admin/ideas-list`, { params: { limit: 100 } });
        setIdeas(data.data || data);
      } else if (tab === "users") {
        const { data } = await api.get(`/admin/users-list`).catch(()=>({ data: [] }));
        // If API not available, try /users (public) as fallback
        if (!data || data.length === 0) {
          const r = await api.get(`/users`).catch(()=>({ data: [] }));
          setUsers(r.data || []);
        } else setUsers(data);
      } else if (tab === "reports") {
        const { data } = await api.get(`/admin/logs`);
        setLogs(data.data || []);
      }
    } finally { setLoading(false); }
  }

  async function doBan(userId, ban = true) {
    const action = ban ? "ban_user" : "unban_user";
    const reason = window.prompt(`Masukkan alasan untuk ${action}:`);
    if (!ban || (ban && reason && reason.trim())) {
      try {
        await api.patch(`/admin/users/${userId}`, { action, reason });
        await load();
      } catch (e) {
        alert(e?.response?.data?.error || e.message || "Gagal");
      }
    }
  }

  async function doIdeaAction(ideaId, action) {
    let reason = null;
    if (action === "delete_idea") {
      reason = window.prompt("Alasan menghapus ide:");
      if (!reason) return alert("Alasan dibutuhkan untuk menghapus ide");
    }
    try {
      await api.patch(`/admin/ideas/${ideaId}`, { action, reason });
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Gagal");
    }
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="tabs">
        <button className={`tab ${tab==="ideas"?"tab-active":""}`} onClick={()=>setTab("ideas")}>Ideas</button>
        <button className={`tab ${tab==="users"?"tab-active":""}`} onClick={()=>setTab("users")}>Users</button>
        <button className={`tab ${tab==="reports"?"tab-active":""}`} onClick={()=>setTab("reports")}>Reports</button>
      </div>

      {loading && <p>Memuat…</p>}

      {tab === "ideas" && (
        <div className="card p-4">
          <h2 className="font-semibold mb-3">List Ideas</h2>
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th>Id</th>
                <th>Title</th>
                <th>Author</th>
                <th>Created</th>
                <th>Likes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ideas.map((i) => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td>{i.title}</td>
                  <td>{i.author}</td>
                  <td>{new Date(i.created_at).toLocaleString()}</td>
                  <td>{i.total_likes ?? 0}</td>
                  <td>{i.status}</td>
                  <td>
                    {user?.role === "moderator" ? (
                      <>
                        {i.status === 'hidden' ? (
                          <button className="btn-ghost mr-2" onClick={()=>doIdeaAction(i.id,'unhide_idea')}>Unhide</button>
                        ) : (
                          <button className="btn-ghost mr-2" onClick={()=>doIdeaAction(i.id,'hide_idea')}>Hide</button>
                        )}
                        <button className="btn-danger" onClick={()=>doIdeaAction(i.id,'delete_idea')}>Delete</button>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "users" && (
        <div className="card p-4">
          <h2 className="font-semibold mb-3">List Users</h2>
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th>Id</th>
                <th>Name</th>
                <th>Role</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.display_name || u.name || u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? 'Yes' : 'No'}</td>
                  <td>
                    {user?.role === "moderator" ? (
                      <>
                        <button className="btn-ghost mr-2" onClick={()=>doBan(u.id, !u.is_active)}>{u.is_active? 'Ban' : 'Unban'}</button>
                        <button className="btn-danger" onClick={()=>{
                          if (confirm('Hapus user ini? Ini tidak bisa dibatalkan')) {
                            // call delete user endpoint (not existing) - fallback to ban
                            doBan(u.id, true);
                          }
                        }}>Delete</button>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <div className="card p-4">
          <h2 className="font-semibold mb-3">Moderation Logs / Reports</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No logs</p>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th>Id</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.actor_name}</td>
                    <td>{l.action}</td>
                    <td>{l.target_type}#{l.target_id}</td>
                    <td>{l.reason}</td>
                    <td>{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
