import slugify from "slugify";
import { query } from "../db.js";

export function toSlug(title) {
  return slugify(title, { lower: true, strict: true, locale: "id" }).slice(0, 180);
}

export async function uniqueIdeaSlug(title, excludeId = null) {
  const base = toSlug(title) || "ide";
  const like = base + "%";
  const rows = await query(
    excludeId
      ? "SELECT slug FROM ideas WHERE slug LIKE ? AND id <> ?"
      : "SELECT slug FROM ideas WHERE slug LIKE ?",
    excludeId ? [like, excludeId] : [like]
  );
  const exist = new Set(rows.map(r => r.slug));
  if (!exist.has(base)) return base;
  let n = 2;
  while (exist.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
