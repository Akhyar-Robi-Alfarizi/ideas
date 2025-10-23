// src/routes/admin.js
import { Router } from "express";
import { query, withTransaction } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { z } from "zod";

const router = Router();

// Semua rute admin butuh auth + role admin/moderator
router.use(requireAuth, requireRole("admin", "moderator"));

/**
 * GET /admin/overview
 * Mengambil metrik ringkas. Coba pakai VIEW admin_overview; kalau tak ada, fallback hitung manual.
 */
router.get("/overview", async (_req, res, next) => {
  try {
    try {
      const rows = await query("SELECT * FROM admin_overview");
      return res.json(rows[0] || {});
    } catch (e) {
      // Fallback jika view belum dibuat
      const [users] = await query("SELECT COUNT(*) AS c FROM users");
      const [ideas] = await query("SELECT COUNT(*) AS c FROM ideas WHERE status='published'");
      const [comments] = await query("SELECT COUNT(*) AS c FROM comments WHERE status='visible'");
      const [openReports] = await query("SELECT COUNT(*) AS c FROM reports WHERE status='open'");
      return res.json({
        total_users: users.c || 0,
        total_ideas: ideas.c || 0,
        total_comments: comments.c || 0,
        open_reports: openReports.c || 0,
      });
    }
  } catch (e) {
    next(e);
  }
});

/**
 * GET /admin/reports?status=open|reviewed|dismissed|removed&page=1&limit=20
 */
router.get("/reports", async (req, res, next) => {
  try {
    const status = String(req.query.status || "open");
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit ?? "20", 10)));
    const offset = (page - 1) * limit;

    const data = await query(
      `SELECT r.*, u.display_name AS reporter_name
         FROM reports r
         JOIN users u ON u.id = r.reporter_id
        WHERE r.status = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
    const totalRows = await query("SELECT COUNT(*) AS total FROM reports WHERE status = ?", [status]);
    res.json({ data, meta: { page, limit, total: Number(totalRows[0]?.total || 0) } });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /admin/reports/:id
 * Body: { "status": "reviewed" | "dismissed" | "removed" }
 */
router.patch("/reports/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const schema = z.object({
      status: z.enum(["open", "reviewed", "dismissed", "removed"]),
    });
    const body = schema.parse(req.body);

    const result = await query("UPDATE reports SET status=? WHERE id=?", [body.status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Report not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /admin/ideas/:id
 * Body: { "action": "hide_idea" | "unhide_idea" | "delete_idea", "reason": "..." }
 */
router.patch("/ideas/:id", async (req, res, next) => {
  const schema = z.object({
    action: z.enum(["hide_idea", "unhide_idea", "delete_idea"]),
    reason: z.string().max(255).optional(),
  });
  try {
    const ideaId = Number(req.params.id);
    const { action, reason } = schema.parse(req.body);
    const actorId = req.user.id;

    await withTransaction(async (conn) => {
      if (action === "hide_idea") {
        const r = await conn.execute("UPDATE ideas SET status='hidden' WHERE id=?", [ideaId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("Idea not found"), { status: 404 });
      } else if (action === "unhide_idea") {
        const r = await conn.execute("UPDATE ideas SET status='published' WHERE id=?", [ideaId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("Idea not found"), { status: 404 });
      } else if (action === "delete_idea") {
        const r = await conn.execute("DELETE FROM ideas WHERE id=?", [ideaId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("Idea not found"), { status: 404 });
      }
      await conn.execute(
        "INSERT INTO moderation_logs (actor_id, action, target_type, target_id, reason) VALUES (?,?,?,?,?)",
        [actorId, action, "idea", ideaId, reason ?? null]
      );
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /admin/comments/:id
 * Body: { "action": "hide_comment" | "delete_comment", "reason": "..." }
 */
router.patch("/comments/:id", async (req, res, next) => {
  const schema = z.object({
    action: z.enum(["hide_comment", "delete_comment"]),
    reason: z.string().max(255).optional(),
  });
  try {
    const commentId = Number(req.params.id);
    const { action, reason } = schema.parse(req.body);
    const actorId = req.user.id;

    await withTransaction(async (conn) => {
      if (action === "hide_comment") {
        const r = await conn.execute("UPDATE comments SET status='hidden' WHERE id=?", [commentId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("Comment not found"), { status: 404 });
      } else if (action === "delete_comment") {
        const r = await conn.execute("DELETE FROM comments WHERE id=?", [commentId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("Comment not found"), { status: 404 });
      }
      await conn.execute(
        "INSERT INTO moderation_logs (actor_id, action, target_type, target_id, reason) VALUES (?,?,?,?,?)",
        [actorId, action, "comment", commentId, reason ?? null]
      );
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /admin/users/:id
 * Body: { "action": "ban_user" | "unban_user", "reason": "..." }
 */
router.patch("/users/:id", async (req, res, next) => {
  const schema = z.object({
    action: z.enum(["ban_user", "unban_user"]),
    reason: z.string().max(255).optional(),
  });
  try {
    const userId = Number(req.params.id);
    const { action, reason } = schema.parse(req.body);
    const actorId = req.user.id;

    await withTransaction(async (conn) => {
      if (action === "ban_user") {
        const r = await conn.execute("UPDATE users SET is_active=0 WHERE id=?", [userId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("User not found"), { status: 404 });
      } else if (action === "unban_user") {
        const r = await conn.execute("UPDATE users SET is_active=1 WHERE id=?", [userId]);
        if (r[0].affectedRows === 0) throw Object.assign(new Error("User not found"), { status: 404 });
      }
      await conn.execute(
        "INSERT INTO moderation_logs (actor_id, action, target_type, target_id, reason) VALUES (?,?,?,?,?)",
        [actorId, action, "user", userId, reason ?? null]
      );
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /admin/logs?page=1&limit=20
 */
router.get("/logs", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit ?? "20", 10)));
    const offset = (page - 1) * limit;

    const data = await query(
      `SELECT ml.*, u.display_name AS actor_name
         FROM moderation_logs ml
         JOIN users u ON u.id = ml.actor_id
        ORDER BY ml.created_at DESC
        LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const totalRows = await query("SELECT COUNT(*) AS total FROM moderation_logs");
    res.json({ data, meta: { page, limit, total: Number(totalRows[0]?.total || 0) } });
  } catch (e) {
    next(e);
  }
});

export default router;
