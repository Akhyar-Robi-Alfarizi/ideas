import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { register: doRegister, loading } = useAuth();
  const { register, handleSubmit } = useForm();
  const nav = useNavigate();
  const [error, setError] = useState("");

  async function onSubmit(values) {
    setError("");
    try {
      await doRegister(values);
      nav("/login");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Gagal mendaftar";
      setError(msg);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#6c75f5]">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#dee4ff] via-[#b8c2ff] to-[#6c75f5]" aria-hidden="true" />
      <div className="absolute inset-0 -z-10">
        <div className="pointer-events-none absolute -top-[45%] left-1/2 h-[70%] w-[140%] -translate-x-1/2 rounded-[45%] bg-gradient-to-r from-[#eef1ff] via-[#d5dcff] to-[#b6c1ff] opacity-80" />
        <div className="pointer-events-none absolute -bottom-[50%] right-1/2 h-[70%] w-[140%] translate-x-1/2 rounded-[45%] bg-gradient-to-r from-[#8a93ff] via-[#717af7] to-[#5963f2] opacity-85" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 w-full max-w-sm space-y-6 rounded-3xl bg-white/90 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-md"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-500">Please fill in the form below</p>
        </div>

        {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}

        <div className="space-y-4">
          <label className="block text-left">
            <span className="sr-only">Nama tampilan</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 7c2.761 0 5 1.79 5 4v1H5v-1c0-2.21 2.239-4 5-4Z" />
                </svg>
              </span>
              <input
                className="w-full rounded-xl border border-indigo-100 bg-white/70 py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                placeholder="Nama tampilan"
                {...register("display_name", { required: true, onChange: () => setError("") })}
              />
            </div>
          </label>

          <label className="block text-left">
            <span className="sr-only">Email</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2.5 4.75A2.75 2.75 0 0 1 5.25 2h9.5A2.75 2.75 0 0 1 17.5 4.75v10.5A2.75 2.75 0 0 1 14.75 18h-9.5A2.75 2.75 0 0 1 2.5 15.25V4.75Zm1.5.027v.11l5.68 4.095a1 1 0 0 0 1.14 0l5.68-4.096v-.11a1.25 1.25 0 0 0-1.25-1.25h-9.5a1.25 1.25 0 0 0-1.25 1.25Zm11 2.673-4.48 3.233a3 3 0 0 1-3.54 0L3.5 7.45v7.8a1.25 1.25 0 0 0 1.25 1.25h9.5a1.25 1.25 0 0 0 1.25-1.25V7.45Z" />
                </svg>
              </span>
              <input
                className="w-full rounded-xl border border-indigo-100 bg-white/70 py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                placeholder="nama@email.com"
                type="email"
                {...register("email", { required: true, onChange: () => setError("") })}
              />
            </div>
          </label>

          <label className="block text-left">
            <span className="sr-only">Username</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h6.5A2.75 2.75 0 0 1 16 6.75v6.5A2.75 2.75 0 0 1 13.25 16h-6.5A2.75 2.75 0 0 1 4 13.25v-6.5Zm2-.25a.75.75 0 0 0 0 1.5h1.75v1.75a.75.75 0 1 0 1.5 0V8h1.75a.75.75 0 1 0 0-1.5H9.25V4.75a.75.75 0 0 0-1.5 0V6.5H6Z" />
                </svg>
              </span>
              <input
                className="w-full rounded-xl border border-indigo-100 bg-white/70 py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                placeholder="Username (opsional)"
                {...register("username", { onChange: () => setError("") })}
              />
            </div>
          </label>

          <label className="block text-left">
            <span className="sr-only">Password</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 2a4 4 0 0 1 4 4v2h1.25A1.75 1.75 0 0 1 17 9.75v6.5A1.75 1.75 0 0 1 15.25 18h-10.5A1.75 1.75 0 0 1 3 16.25v-6.5A1.75 1.75 0 0 1 4.75 8H6V6a4 4 0 0 1 4-4Zm0 1.5A2.5 2.5 0 0 0 7.5 6v2h5V6A2.5 2.5 0 0 0 10 3.5Z" />
                </svg>
              </span>
              <input
                className="w-full rounded-xl border border-indigo-100 bg-white/70 py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                placeholder="Minimal 6 karakter"
                type="password"
                {...register("password", { required: true, minLength: 6, onChange: () => setError("") })}
              />
            </div>
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          disabled={loading}
        >
          {loading ? "Mengirim…" : "Sign Up"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Sudah punya akun? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
