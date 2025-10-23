import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const { login, loading } = useAuth();
  const { register, handleSubmit } = useForm();
  const nav = useNavigate();
  const loc = useLocation();
  async function onSubmit(v) {
    await login(v.email, v.password);
    const to = loc.state?.from?.pathname || "/";
    nav(to, { replace: true });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-3 max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Masuk</h2>
      <input className="input" placeholder="Email" type="email" {...register("email", { required:true })} />
      <input className="input" placeholder="Password" type="password" {...register("password", { required:true })} />
      <button className="btn-primary" disabled={loading}>{loading ? "Memproses…" : "Masuk"}</button>
    </form>
  );
}
