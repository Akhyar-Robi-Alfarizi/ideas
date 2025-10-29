import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { validate } from "../utils/validator.js";
import { requireAuth, maybeAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { uniqueIdeaSlug } from "../utils/slug.js";

const router = Router();

/** LIST + search sederhana */
router.get("/", maybeAuth, async (req, res, next) => {
  try {
    const { q, categoryId, sort = "new", page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = ["i.status='published'"];
    const params = [];
    if (categoryId) { where.push("i.category_id=?"); params.push(Number(categoryId)); }
    if (q) { where.push("MATCH(i.title,i.description) AGAINST (? IN NATURAL LANGUAGE MODE)"); params.push(q); }

    let order = "i.created_at DESC";
    if (sort === "popular7d") order = "likes_7d DESC, i.created_at DESC";
    if (sort === "popularAll") order = "total_likes DESC, i.created_at DESC";

    const rows = await query(
      `SELECT i.id,i.title,i.slug,i.created_at,
        u.display_name AS author,c.name AS category,
        (SELECT COUNT(*) FROM idea_likes l WHERE l.idea_id=i.id) AS total_likes,
        (SELECT COUNT(*) FROM comments cm WHERE cm.idea_id=i.id AND cm.status='visible') AS total_comments,
        (SELECT COUNT(*) FROM idea_likes l WHERE l.idea_id=i.id AND l.created_at >= (UTC_TIMESTAMP() - INTERVAL 7 DAY)) AS likes_7d
       FROM ideas i
       JOIN users u ON u.id=i.user_id
       LEFT JOIN categories c ON c.id=i.category_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category_id: z.number().int().nullable().optional()
});

router.post("/", requireAuth, validate(createSchema), async (req, res, next) => {
  try {
    const { title, description, category_id } = req.body;
    const slug = await uniqueIdeaSlug(title);
    const r = await query(
      "INSERT INTO ideas(user_id,category_id,title,slug,description) VALUES (?,?,?,?,?)",
      [req.user.id, category_id ?? null, title, slug, description]
    );
    const [idea] = await query("SELECT * FROM ideas WHERE id=?", [r.insertId]);
    res.status(201).json(idea);
  } catch (e) { next(e); }
});

/** Detail by id atau slug */
router.get("/:idOrSlug", maybeAuth, async (req, res) => {
  const key = req.params.idOrSlug;
  const baseSelect =
    `SELECT i.*, u.display_name AS author,
            (SELECT COUNT(*) FROM idea_likes l WHERE l.idea_id=i.id) AS total_likes,
            (SELECT COUNT(*) FROM comments c WHERE c.idea_id=i.id AND c.status='visible') AS total_comments
     FROM ideas i JOIN users u ON u.id=i.user_id`;
  const rows = /^\d+$/.test(key)
    ? await query(`${baseSelect} WHERE i.id=?`, [Number(key)])
    : await query(`${baseSelect} WHERE i.slug=?`, [key]);
  if (!rows.length) return res.status(404).json({ error: "Not Found" });

  const idea = rows[0];
  // optionally include whether current user liked this idea
  if (req.user?.id) {
    const likedRows = await query(
      `SELECT 1 FROM idea_likes WHERE idea_id=? AND user_id=? LIMIT 1`,
      [idea.id, req.user.id]
    );
    idea.liked = likedRows.length > 0;
  } else {
    idea.liked = false;
  }
  res.json(idea);
});

/**
 * GET /ideas/user/:id
 * Mengembalikan daftar ide milik user (public)
 */
router.get("/user/:userId", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    // try to include optional image/thumbnail columns if present
    try {
      const rows = await query(
  `SELECT i.id,i.title,i.slug,i.created_at,i.image,i.thumbnail,
    (SELECT COUNT(*) FROM idea_likes l WHERE l.idea_id=i.id) AS total_likes,
    (SELECT COUNT(*) FROM comments cm WHERE cm.idea_id=i.id AND cm.status='visible') AS total_comments
         FROM ideas i
         WHERE i.user_id=?
         ORDER BY i.created_at DESC`,
        [userId]
      );
      return res.json(rows);
    } catch (err) {
      if (err?.code === "ER_BAD_FIELD_ERROR") {
        // fallback when image/thumbnail columns missing
        const rows = await query(
    `SELECT i.id,i.title,i.slug,i.created_at,
      (SELECT COUNT(*) FROM idea_likes l WHERE l.idea_id=i.id) AS total_likes,
      (SELECT COUNT(*) FROM comments cm WHERE cm.idea_id=i.id AND cm.status='visible') AS total_comments
           FROM ideas i
           WHERE i.user_id=?
           ORDER BY i.created_at DESC`,
          [userId]
        );
        return res.json(rows);
      }
      throw err;
    }
  } catch (e) { next(e); }
});

/** Update & Delete (owner / admin/moderator) */
const editSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category_id: z.number().int().nullable().optional(),
  status: z.enum(["published", "draft", "hidden"]).optional()
});

router.patch("/:id", requireAuth, validate(editSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [idea] = await query("SELECT user_id FROM ideas WHERE id=?", [id]);
    if (!idea) return res.status(404).json({ error: "Not Found" });
    const isOwner = idea.user_id === req.user.id;
    const isStaff = ["admin", "moderator"].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: "Forbidden" });

    let slug;
    if (req.body.title) slug = await uniqueIdeaSlug(req.body.title, id);

    await query(
      `UPDATE ideas SET
         title = COALESCE(?, title),
         slug = COALESCE(?, slug),
         description = COALESCE(?, description),
         category_id = ?,
         status = COALESCE(?, status)
       WHERE id=?`,
      [
        req.body.title ?? null,
        slug ?? null,
        req.body.description ?? null,
        req.body.category_id ?? null,
        req.body.status ?? null,
        id
      ]
    );
    const [updated] = await query("SELECT * FROM ideas WHERE id=?", [id]);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [idea] = await query("SELECT user_id FROM ideas WHERE id=?", [id]);
    if (!idea) return res.status(404).json({ error: "Not Found" });
    const isOwner = idea.user_id === req.user.id;
    const isStaff = ["admin", "moderator"].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: "Forbidden" });
    await query("DELETE FROM ideas WHERE id=?", [id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** Like / Unlike */
router.post("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await query("INSERT IGNORE INTO idea_likes (idea_id,user_id) VALUES (?,?)", [id, req.user.id]);
    const [{ count }] = await query("SELECT COUNT(*) AS count FROM idea_likes WHERE idea_id=?", [id]);
    res.json({ liked: true, likes: count });
  } catch (e) { next(e); }
});

router.delete("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await query("DELETE FROM idea_likes WHERE idea_id=? AND user_id=?", [id, req.user.id]);
    const [{ count }] = await query("SELECT COUNT(*) AS count FROM idea_likes WHERE idea_id=?", [id]);
    res.json({ liked: false, likes: count });
  } catch (e) { next(e); }
});

export default router;
