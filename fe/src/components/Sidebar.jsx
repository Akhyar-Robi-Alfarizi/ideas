import { NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = useMemo(() => {
    if (user) {
      const items = [
        { to: "/", label: "Home" },
        { to: "/ideas/new", label: "Unggah Ide" },
        { to: "/me", label: "Profil" },
      ];
      if (user.role && ["admin", "moderator"].includes(user.role)) {
        items.push({ to: "/admin", label: user.role === "admin" ? "Admin" : "Moderator" });
      }
      return items;
    }
    return [
      { to: "/", label: "Home" },
      { to: "/login", label: "Login" },
      { to: "/register", label: "Register" },
    ];
  }, [user]);

  return (
    <aside className="sticky top-0 flex h-screen w-52 flex-col gap-8 border-r border-slate-200 bg-white/80 px-6 py-8 shadow-lg shadow-indigo-100/40">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-semibold text-white">RI</span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Ruang Inovator</p>
          <p className="text-xs text-slate-400">Idea Sharing</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-500">
        {links.map((item) => (
          <SidebarLink key={item.to} to={item.to} label={item.label} />
        ))}
        {user && (
          <button
            type="button"
            onClick={() => { logout(); navigate("/login"); }}
            className="rounded-xl px-4 py-2 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            Logout
          </button>
        )}
      </nav>
    </aside>
  );
}

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `rounded-xl px-4 py-2 transition ${
          isActive ? "bg-indigo-500 text-white shadow" : "hover:bg-indigo-50 hover:text-indigo-600"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
