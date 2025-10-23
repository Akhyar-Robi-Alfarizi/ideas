// src/db.js
import mysql from "mysql2/promise";

/* ========= ENV check + default dev ========= */
for (const k of ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"]) {
  if (!process.env[k]) console.warn(`[db] ENV ${k} belum di-set (pakai default dev)`);
}

/* ========= Pool config ========= */
const cfg = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASS ?? "",
  database: process.env.DB_NAME ?? "ideas_db",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL ?? 10),
  queueLimit: 0,
  namedPlaceholders: true, // dukung :param
  dateStrings: true,       // tanggal sebagai string (stabil di FE)
  timezone: "Z",           // simpan/ambil UTC
};

/* ========= Singleton pool (aman untuk nodemon/HMR) ========= */
let pool = globalThis.__dbPool ?? null;

function createPool() {
  pool = mysql.createPool(cfg);
  globalThis.__dbPool = pool;
  console.log("[db] pool created");
  return pool;
}

function isPoolClosed() {
  // mysql2 menyimpan flag closed di properti yang berbeda-beda
  return !pool || pool._closed || pool.pool?._closed;
}

function ensurePool() {
  if (isPoolClosed()) {
    console.warn("[db] detected closed/missing pool — recreating");
    return createPool();
  }
  return pool;
}

// buat pool pertama kali
ensurePool();

/* ========= Helper query (auto-recreate + retry sekali) ========= */
const CLOSED_RE = /(pool is closed|cannot enqueue .* after invoking quit|after end)/i;

export async function query(sql, params = []) {
  ensurePool();
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (e) {
    const msg = String(e?.message || "");
    if (CLOSED_RE.test(msg)) {
      console.warn("[db] closed pool detected — recreating & retrying once");
      ensurePool();
      const [rows] = await pool.execute(sql, params);
      return rows;
    }
    throw e;
  }
}

/* ========= Transaksi ========= */
export async function withTransaction(handler) {
  ensurePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const res = await handler(conn);
    await conn.commit();
    return res;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ========= Health check (panggil setelah app.listen) ========= */
export async function dbHealthCheck() {
  const [r] = await query("SELECT 1 AS ok");
  console.log(`[db] connected: ok=${r?.ok ?? 0}, db=${cfg.database}`);
}

/* ========= Shutdown: HANYA di production =========
   Di dev, JANGAN tutup pool agar tidak muncul “Pool is closed.” saat nodemon reload.
*/
async function shutdownProd() {
  try {
    if (!isPoolClosed()) {
      await pool.end();
      console.log("[db] pool closed");
    }
  } catch (e) {
    console.error("[db] close error:", e.message);
  } finally {
    pool = null;
    globalThis.__dbPool = null;
  }
}

if (process.env.NODE_ENV === "production") {
  process.on("SIGINT", shutdownProd);
  process.on("SIGTERM", shutdownProd);
}

/* Opsional: ekspor pool mentah jika perlu */
export { pool };
