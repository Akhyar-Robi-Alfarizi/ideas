import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { validate } from "../utils/validator.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router({ mergeParams: true }); // supaya bisa baca :id dari parent

router.get("/:id/comments", async (req, res) => {
  const ideaId = Number(req.params.id);
  const rows = await query(
    `SELECT c.id,c.content,c.created_at,
            u.id AS user_id,u.display_name
     FROM comments c JOIN users u ON u.id=c.user_id
     WHERE c.idea_id=? AND c.status='visible'
     ORDER BY c.created_at ASC`,
    [ideaId]
  );
  res.json(rows);
});

const createSchema = z.object({ content: z.string().min(1), parent_id: z.number().int().nullable().optional() });

router.post("/:id/comments", requireAuth, validate(createSchema), async (req, res, next) => {
  try {
    const ideaId = Number(req.params.id);
    const { content, parent_id } = req.body;
    const r = await query(
      "INSERT INTO comments(idea_id,user_id,parent_id,content) VALUES (?,?,?,?)",
      [ideaId, req.user.id, parent_id ?? null, content]
    );
    const [row] = await query("SELECT * FROM comments WHERE id=?", [r.insertId]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

export default router;
