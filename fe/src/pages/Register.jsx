import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { register: doRegister, loading } = useAuth();
  const { register, handleSubmit } = useForm();
  const nav = useNavigate();

  async function onSubmit(v) {
    await doRegister(v);
    nav("/login");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 space-y-3 max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Daftar</h2>
      <input className="input" placeholder="Nama tampilan" {...register("display_name", { required:true })} />
      <input className="input" placeholder="Email" type="email" {...register("email", { required:true })} />
      <input className="input" placeholder="Username (opsional)" {...register("username")} />
      <input className="input" placeholder="Password" type="password" {...register("password", { required:true, minLength:6 })} />
      <button className="btn-primary" disabled={loading}>{loading ? "Mengirim…" : "Daftar"}</button>
    </form>
  );
}
