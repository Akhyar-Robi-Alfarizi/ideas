import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { validate } from "../utils/validator.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
const schema = z.object({
  target_type: z.enum(["idea", "comment"]),
  target_id: z.number().int(),
  reason: z.enum(["spam", "plagiarism", "abuse", "other"]),
  note: z.string().max(255).optional()
});

router.post("/", requireAuth, validate(schema), async (req, res, next) => {
  try {
    const { target_type, target_id, reason, note } = req.body;
    await query(
      "INSERT INTO reports(reporter_id,target_type,target_id,reason,note) VALUES (?,?,?,?,?)",
      [req.user.id, target_type, target_id, reason, note ?? null]
    );
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
