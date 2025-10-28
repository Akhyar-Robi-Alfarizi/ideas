// src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path, { resolve } from "path";
import { dbHealthCheck } from "./db.js";
import { fileURLToPath, pathToFileURL } from "url";



const app = express();
const PORT = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";

// ========== Core & Security ==========
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

const ORIGINS = (process.env.ORIGIN || "*")
  .split(",")
  .map((s) => s.trim());
const corsOptions = {
  origin: ORIGINS.includes("*") ? true : ORIGINS,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// (opsional) serve berkas upload lokal
app.use("/uploads", express.static(path.resolve("uploads")));

// Rate limit khusus auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(["/auth/login", "/auth/register"], authLimiter);

// ========== Helper mount route ==========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamic import yang aman (pakai path absolut)
 * sehingga tidak tergantung working directory.
 */
async function tryMount(relPath, mountPoint) {
  try {
    const absUrl = pathToFileURL(resolve(__dirname, relPath)).href;
    const mod = await import(absUrl);
    const router = mod.default || mod.router;
    if (!router) {
      console.warn(`[route] loaded ${relPath} but no default export/router`);
      return;
    }
    app.use(mountPoint, router);
    console.log(`[route] mounted ${mountPoint} -> ${relPath}`);
  } catch (e) {
    // Jika nested import di dalam file route yang tidak ketemu,
    // Node tetap lempar ERR_MODULE_NOT_FOUND => tampilkan pesan lengkapnya.
    if (e.code === "ERR_MODULE_NOT_FOUND") {
      console.error(`[route] module not found while mounting ${relPath}: ${e.message}`);
    } else {
      console.error(`[route] error mounting ${relPath}:`, e);
    }
  }
}

// ========== Mount routes ==========
await tryMount("./routes/auth.js", "/auth");
await tryMount("./routes/categories.js", "/categories");
await tryMount("./routes/ideas.js", "/ideas");
// Mount comments under /ideas so routes inside can use ":id/comments"
await tryMount("./routes/comments.js", "/ideas");
await tryMount("./routes/likes.js", "/likes");           
await tryMount("./routes/reports.js", "/reports");
await tryMount("./routes/admin.js", "/admin");

// ========== Health & root ==========
app.get("/", (_req, res) => res.json({ name: "Ruang Inovator API", env: NODE_ENV }));
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ========== 404 & Error handler ==========
app.use((req, res) => res.status(404).json({ error: "Not Found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

// ========== Start server ==========
app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`);
  await dbHealthCheck();
});
