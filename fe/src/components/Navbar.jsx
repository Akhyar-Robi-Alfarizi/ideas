import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="border-b bg-white">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold text-indigo-700">Ruang Inovator</Link>
        <nav className="flex items-center gap-3">
          <NavLink to="/" className="btn-ghost">Home</NavLink>
          {user ? (
            <>
              <NavLink to="/ideas/new" className="btn-ghost">Unggah Ide</NavLink>
              <NavLink to="/me" className="btn-ghost">{user.display_name || "Me"}</NavLink>
              {["admin","moderator"].includes(user.role) && (
                <NavLink to="/admin" className="btn-ghost">Admin</NavLink>
              )}
              <button className="btn" onClick={() => { logout(); navigate("/"); }}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost">Masuk</NavLink>
              <NavLink to="/register" className="btn-primary">Daftar</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
