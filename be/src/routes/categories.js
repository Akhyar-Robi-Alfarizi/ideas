import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { validate } from "../utils/validator.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await query("SELECT id,name,slug FROM categories ORDER BY name");
  res.json(rows);
});

const catSchema = z.object({ name: z.string().min(2) });

router.post("/", requireAuth, requireRole("admin", "moderator"), validate(catSchema), async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    await query("INSERT INTO categories(name,slug) VALUES (?,?)", [name, slug]);
    res.status(201).json({ name, slug });
  } catch (e) { next(e); }
});

export default router;
