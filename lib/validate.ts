import { CATEGORIES, NewPost } from "./types";
export function validatePost(p: NewPost): string | null {
  if (!p.island_id) return "Choose an island.";
  if (!CATEGORIES.some((c) => c.id === p.category)) return "Choose a category.";
  const t = p.title.trim();
  if (t.length < 4 || t.length > 90) return "Title must be 4–90 characters.";
  const b = p.body.trim();
  if (b.length < 10 || b.length > 1000) return "Description must be 10–1000 characters.";
  if (p.area && p.area.length > 80) return "Area must be under 80 characters.";
  if (p.image) {
    if (!/^image\/(jpeg|png|webp)$/.test(p.image.type)) return "Photo must be JPG, PNG or WebP.";
    if (p.image.size > 5 * 1024 * 1024) return "Photo must be under 5 MB.";
  }
  return null;
}
