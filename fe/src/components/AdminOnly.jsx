import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminOnly() {
  const { user } = useAuth();
  const isStaff = user && ["admin", "moderator"].includes(user.role);
  if (!isStaff) return <Navigate to="/" replace />;
  return <Outlet />;
}
