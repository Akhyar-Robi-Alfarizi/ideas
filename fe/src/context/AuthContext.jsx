import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/axios";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      return data.user;
    } finally { setLoading(false); }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      return data;
    } finally { setLoading(false); }
  }

  async function refreshMe() {
    if (!token) return;
    try {
      const { data } = await api.get("/auth/me");
      setUser((u) => ({ ...u, ...data }));
      localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
    } catch {}
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  useEffect(() => { if (token && !user) refreshMe(); }, []);

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
