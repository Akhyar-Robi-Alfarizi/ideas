import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { validate } from "../utils/validator.js";
import { requireAuth } from "../middlewares/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

let cachedUserColumns = null;
async function getUserColumns() {
  if (cachedUserColumns) return cachedUserColumns;
  try {
    const rows = await query("SHOW COLUMNS FROM users");
    cachedUserColumns = new Set(rows.map((r) => r.Field));
  } catch (err) {
    console.warn("[auth] gagal membaca struktur tabel users:", err.message);
    cachedUserColumns = new Set();
  }
  return cachedUserColumns;
}
function invalidateUserColumnsCache() {
  cachedUserColumns = null;
}
async function loadProfileRow(userId) {
  const columns = await getUserColumns();
  const avatarExpr = columns.has("avatar")
    ? "u.avatar"
    : columns.has("avatar_url")
      ? "u.avatar_url"
      : "NULL";
  const bioExpr = columns.has("bio") ? "u.bio" : "NULL";
  const rows = await query(
    `SELECT u.id,u.display_name,u.email,r.name AS role,
            ${avatarExpr} AS avatar,
            ${bioExpr} AS bio
       FROM users u JOIN roles r ON r.id=u.role_id
      WHERE u.id=?`,
    [userId]
  );
  const user = rows[0];
  if (user) {
    const rawAvatar = user.avatar || null;
    user.avatar = rawAvatar ? String(rawAvatar) : "/uploads/default-gambar.webp";
    user.bio = user.bio || null;
  }
  return user;
}

// setup multer for avatar upload
const uploadDir = path.resolve("uploads/avatars");
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g,'_')}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const registerSchema = z.object({
  display_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(40).optional()
});

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { display_name, email, password, username } = req.body;
    const dup = await query("SELECT id FROM users WHERE email=? OR username=?", [email, username ?? ""]);
    if (dup.length) return res.status(409).json({ error: "Email/username already used" });

    const hash = await bcrypt.hash(password, 10);
    const r = await query(
      "INSERT INTO users(display_name,email,password_hash,username,role_id) VALUES (?,?,?,?,1)",
      [display_name, email, hash, username ?? null]
    );
    res.status(201).json({ id: r.insertId, display_name, email });
  } catch (e) { next(e); }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const rows = await query(
      `SELECT u.id,u.display_name,u.email,u.password_hash,r.name AS role
       FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email=? AND u.is_active=1`,
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "1d" }
    );

    // opsional cookie httpOnly
    // res.cookie("access_token", token, { httpOnly: true, sameSite:"lax", secure:false });

    res.json({ accessToken: token, user: { id: user.id, display_name: user.display_name, role: user.role } });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await loadProfileRow(req.user.id);
    res.json(user);
  } catch (e) { next(e); }
});

// PATCH /auth/me -> update profile (display_name, bio) and optional avatar upload
const profileSchema = z.object({
  display_name: z.string().min(3).optional(),
  bio: z.string().max(500).nullable().optional(),
});

function removeUploadedFile(file) {
  if (!file) return;
  fs.unlink(file.path, (err) => {
    if (err && err.code !== "ENOENT") {
      console.warn("[auth] gagal menghapus file upload sementara:", err.message);
    }
  });
}

router.patch("/me", requireAuth, upload.single("avatar"), async (req, res, next) => {
  try {
    const parsed = profileSchema.parse(req.body || {});
    const initialColumns = await getUserColumns();
    const alters = [];

    let avatarColumn = initialColumns.has("avatar")
      ? "avatar"
      : initialColumns.has("avatar_url")
        ? "avatar_url"
        : null;
    let bioColumn = initialColumns.has("bio") ? "bio" : null;

    if (parsed.bio !== undefined && !bioColumn) {
      alters.push("ADD COLUMN bio TEXT NULL");
      bioColumn = "bio";
    }
    if (req.file && !avatarColumn) {
      alters.push("ADD COLUMN avatar_url VARCHAR(255) NULL");
      avatarColumn = "avatar_url";
    }

    if (alters.length) {
      try {
        await query(`ALTER TABLE users ${alters.join(", ")}`);
        invalidateUserColumnsCache();
      } catch (alterErr) {
        removeUploadedFile(req.file);
        console.error("[auth] gagal ALTER TABLE users:", alterErr);
        return res.status(500).json({ error: "Gagal menyiapkan kolom profil. Hubungi administrator." });
      }
    }

    const activeColumns = await getUserColumns();
    avatarColumn = activeColumns.has("avatar") ? "avatar" : activeColumns.has("avatar_url") ? "avatar_url" : avatarColumn;
    bioColumn = activeColumns.has("bio") ? "bio" : null;

    const fields = [];
    const params = [];
    if (parsed.display_name) {
      fields.push("display_name=?");
      params.push(parsed.display_name);
    }
    if (parsed.bio !== undefined) {
      if (!bioColumn) {
        removeUploadedFile(req.file);
        return res.status(500).json({ error: "Kolom bio belum tersedia di database." });
      }
      fields.push(`${bioColumn}=?`);
      params.push(parsed.bio ?? null);
    }
    if (req.file) {
      if (!avatarColumn) {
        removeUploadedFile(req.file);
        return res.status(500).json({ error: "Kolom avatar belum tersedia di database." });
      }
      const relPath = `/uploads/avatars/${req.file.filename}`;
      console.log(`[auth] avatar upload for user ${req.user.id}: ${relPath}`);
      fields.push(`${avatarColumn}=?`);
      params.push(relPath);
    }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    params.push(req.user.id);
    const sql = `UPDATE users SET ${fields.join(",")} WHERE id=?`;
    const r = await query(sql, params);
    if (r.affectedRows === 0) {
      removeUploadedFile(req.file);
      return res.status(404).json({ error: "User not found" });
    }

    const user = await loadProfileRow(req.user.id);
    res.json(user);
  } catch (e) {
    removeUploadedFile(req.file);
    next(e);
  }
});

export default router;
