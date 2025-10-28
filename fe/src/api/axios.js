import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3001",
  withCredentials: false, // pakai Bearer token
});

// sisipkan token dari localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  } else if (isFormData && config.headers["Content-Type"]) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// jika 401 → logout otomatis (opsional)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // window.location.href = "/login"; // optional hard redirect
    }
    return Promise.reject(err);
  }
);
