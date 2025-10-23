// src/routes/likes.js
import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/**
 * Helper hitung total like sebuah ide/komentar
 */
async function countIdeaLikes(ideaId) {
  const rows = await query("SELECT COUNT(*) AS n FROM idea_likes WHERE idea_id = ?", [ideaId]);
  return Number(rows[0]?.n || 0);
}
async function countCommentLikes(commentId) {
  const rows = await query("SELECT COUNT(*) AS n FROM comment_likes WHERE comment_id = ?", [commentId]);
  return Number(rows[0]?.n || 0);
}

/**
 * ===== IDEAS =====
 * POST /likes/ideas/:id      -> like
 * DELETE /likes/ideas/:id    -> unlike
 */
router.post("/ideas/:id", requireAuth, async (req, res, next) => {
  try {
    const ideaId = Number(req.params.id);
    const userId = req.user.id;

    // pastikan ide ada (opsional tapi bagus)
    const exists = await query("SELECT id FROM ideas WHERE id = ?", [ideaId]);
    if (exists.length === 0) return res.status(404).json({ error: "Idea not found" });

    // INSERT IGNORE mencegah duplicate unique (user_id, idea_id)
    await query("INSERT IGNORE INTO idea_likes (idea_id, user_id) VALUES (?, ?)", [ideaId, userId]);
    const likes = await countIdeaLikes(ideaId);
    return res.status(201).json({ liked: true, likes });
  } catch (e) {
    next(e);
  }
});

router.delete("/ideas/:id", requireAuth, async (req, res, next) => {
  try {
    const ideaId = Number(req.params.id);
    const userId = req.user.id;

    await query("DELETE FROM idea_likes WHERE idea_id = ? AND user_id = ?", [ideaId, userId]);
    const likes = await countIdeaLikes(ideaId);
    return res.json({ liked: false, likes });
  } catch (e) {
    next(e);
  }
});

/**
 * ===== COMMENTS =====
 * POST /likes/comments/:id   -> like
 * DELETE /likes/comments/:id -> unlike
 */
router.post("/comments/:id", requireAuth, async (req, res, next) => {
  try {
    const commentId = Number(req.params.id);
    const userId = req.user.id;

    const exists = await query("SELECT id FROM comments WHERE id = ?", [commentId]);
    if (exists.length === 0) return res.status(404).json({ error: "Comment not found" });

    await query("INSERT IGNORE INTO comment_likes (comment_id, user_id) VALUES (?, ?)", [commentId, userId]);
    const likes = await countCommentLikes(commentId);
    return res.status(201).json({ liked: true, likes });
  } catch (e) {
    next(e);
  }
});

router.delete("/comments/:id", requireAuth, async (req, res, next) => {
  try {
    const commentId = Number(req.params.id);
    const userId = req.user.id;

    await query("DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?", [commentId, userId]);
    const likes = await countCommentLikes(commentId);
    return res.json({ liked: false, likes });
  } catch (e) {
    next(e);
  }
});

export default router;
