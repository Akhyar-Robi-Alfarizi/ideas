import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((payload) => {
    toastId += 1;
    const id = toastId;
    const config = {
      id,
      type: payload?.type || "info",
      title: payload?.title || "",
      description: payload?.description || "",
      duration: typeof payload?.duration === "number" ? payload.duration : 4000,
    };
    setToasts((prev) => [...prev, config]);
    return id;
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) => {
      if (toast.duration === Infinity) return null;
      return setTimeout(() => removeToast(toast.id), toast.duration);
    });
    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [toasts, removeToast]);

  const value = useMemo(() => {
    const build = (type) => (payload) => showToast({ ...payload, type });
    return {
      showToast,
      success: build("success"),
      error: build("error"),
      info: build("info"),
      warning: build("warning"),
      removeToast,
    };
  }, [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-6 right-6 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastItem({ toast, onClose }) {
  const style = toastStyles[toast.type] || toastStyles.info;
  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg transition ${style.container}`}
    >
      <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${style.icon}`}>
        {style.symbol}
      </span>
      <div className="flex-1 text-sm text-slate-700">
        {toast.title && <p className="font-semibold text-slate-800">{toast.title}</p>}
        {toast.description && <p className="mt-1 text-slate-600">{toast.description}</p>}
      </div>
      <button
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        onClick={() => onClose(toast.id)}
        type="button"
      >
        <span className="sr-only">Close</span>
        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3 3l8 8m0-8L3 11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

const toastStyles = {
  success: {
    container: "border-emerald-100 bg-emerald-50",
    icon: "bg-emerald-500/10 text-emerald-600",
    symbol: "✓",
  },
  error: {
    container: "border-rose-100 bg-rose-50",
    icon: "bg-rose-500/10 text-rose-500",
    symbol: "!",
  },
  warning: {
    container: "border-amber-100 bg-amber-50",
    icon: "bg-amber-500/10 text-amber-600",
    symbol: "!",
  },
  info: {
    container: "border-indigo-100 bg-indigo-50",
    icon: "bg-indigo-500/10 text-indigo-500",
    symbol: "i",
  },
};
