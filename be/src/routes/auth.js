import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { validate } from "../utils/validator.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

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

router.get("/me", requireAuth, async (req, res) => {
  const rows = await query(
    "SELECT u.id,u.display_name,u.email,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?",
    [req.user.id]
  );
  res.json(rows[0]);
});

export default router;
