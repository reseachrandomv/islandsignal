export type Category =
  | "water" | "electricity" | "internet" | "ferry" | "roads"
  | "lost_found" | "missing_pet" | "announcement" | "event" | "notice";

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "water", label: "Water", icon: "💧" },
  { id: "electricity", label: "Electricity", icon: "⚡" },
  { id: "internet", label: "Internet", icon: "📶" },
  { id: "ferry", label: "Ferry & transport", icon: "⛴️" },
  { id: "roads", label: "Roads & construction", icon: "🚧" },
  { id: "lost_found", label: "Lost & found", icon: "🔎" },
  { id: "missing_pet", label: "Missing pet", icon: "🐾" },
  { id: "announcement", label: "Announcement", icon: "📣" },
  { id: "event", label: "Community event", icon: "🎉" },
  { id: "notice", label: "Public notice", icon: "📌" },
];
export const catOf = (c: Category) => CATEGORIES.find((x) => x.id === c)!;

export type Trust = "official" | "trusted" | "community";
export type Status = "active" | "resolved" | "removed";
export type Role = "user" | "trusted" | "official" | "admin";

export interface Island { id: string; name: string; atoll?: string | null }

export interface Post {
  id: string;
  island_id: string;
  category: Category;
  title: string;
  body: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  trust: Trust;
  status: Status;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
  expires_at: string;
  confirm_count: number;
  flag_count: number;
  is_sample?: boolean;
}

export interface NewPost {
  island_id: string; category: Category; title: string; body: string;
  area: string | null; lat: number | null; lng: number | null; image: File | null;
}

export interface Me { id: string; name: string; email?: string; role: Role }

/** Default lifetime (hours) before a report auto-expires */
export const EXPIRY_HOURS: Record<Category, number> = {
  water: 24, electricity: 24, internet: 24, ferry: 12, roads: 72,
  lost_found: 24 * 14, missing_pet: 24 * 14, announcement: 24 * 7, event: 24 * 7, notice: 24 * 14,
};
