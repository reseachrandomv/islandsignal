import { EXPIRY_HOURS, Island, Me, NewPost, Post } from "./types";

const KEY = "islandsignal-demo-v1";
const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const inH = (h: number) => new Date(Date.now() + h * 3600000).toISOString();

export const DEMO_ISLANDS: Island[] = [
  { id: "sample-a", name: "Sample Island A", atoll: "Demo atoll" },
  { id: "sample-b", name: "Sample Island B", atoll: "Demo atoll" },
  { id: "sample-c", name: "Sample Island C", atoll: "Demo atoll" },
];

function seed(): Post[] {
  const base = { lat: null, lng: null, image_url: null, author_id: "sample", flag_count: 0, is_sample: true, status: "active" as const };
  return [
    { ...base, id: "s1", island_id: "sample-a", category: "water", title: "[Sample] Possible water interruption", body: "SAMPLE POST for demonstration only. Residents are reporting a possible water interruption in this area.", area: "Sample ward 1", trust: "community", author_name: "Sample user", created_at: ago(12), expires_at: inH(20), confirm_count: 3 },
    { ...base, id: "s2", island_id: "sample-a", category: "lost_found", title: "[Sample] Black wallet reported missing", body: "SAMPLE POST for demonstration only. Owner is looking for help finding a black wallet.", area: "Near sample harbour", trust: "community", author_name: "Sample user", created_at: ago(35), expires_at: inH(300), confirm_count: 0 },
    { ...base, id: "s3", island_id: "sample-b", category: "ferry", title: "[Sample] Ferry service update", body: "SAMPLE POST for demonstration only. A transport notice has been shared by an approved source.", area: null, trust: "official", author_name: "Sample official source", created_at: ago(60), expires_at: inH(10), confirm_count: 5 },
    { ...base, id: "s4", island_id: "sample-c", category: "event", title: "[Sample] Beach clean-up on Saturday", body: "SAMPLE POST for demonstration only. Bring gloves and water. Everyone welcome.", area: "Sample beach", trust: "trusted", author_name: "Sample trusted contributor", created_at: ago(180), expires_at: inH(100), confirm_count: 2 },
    { ...base, id: "s5", island_id: "sample-b", category: "internet", title: "[Sample] Slow internet reported", body: "SAMPLE POST for demonstration only. A few people say mobile data is slow this evening.", area: "Sample ward 3", trust: "community", author_name: "Sample user", created_at: ago(1500), expires_at: ago(60), confirm_count: 1 },
    { ...base, id: "s6", island_id: "sample-c", category: "missing_pet", title: "[Sample] Grey cat missing", body: "SAMPLE POST for demonstration only. Small grey cat with a blue collar.", area: "Sample street", trust: "community", author_name: "Sample user", created_at: ago(400), expires_at: inH(200), confirm_count: 0 },
  ];
}

interface Store { posts: Post[]; me: Me | null; confirmed: string[]; flagged: string[] }
export function load(): Store {
  if (typeof window === "undefined") return { posts: [], me: null, confirmed: [], flagged: [] };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "");
    if (s && Array.isArray(s.posts)) return s;
  } catch {}
  const s: Store = { posts: seed(), me: null, confirmed: [], flagged: [] };
  save(s);
  return s;
}
export function save(s: Store) { localStorage.setItem(KEY, JSON.stringify(s)); }
export function reset() { localStorage.removeItem(KEY); }

const fileToDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f);
});

export async function demoCreate(p: NewPost, me: Me): Promise<Post> {
  const s = load();
  const trust = me.role === "official" || me.role === "admin" ? "official" : me.role === "trusted" ? "trusted" : "community";
  const post: Post = {
    id: crypto.randomUUID(), island_id: p.island_id, category: p.category, title: p.title.trim(), body: p.body.trim(),
    area: p.area?.trim() || null, lat: p.lat, lng: p.lng, image_url: p.image ? await fileToDataUrl(p.image) : null,
    trust, status: "active", author_id: me.id, author_name: me.name, created_at: new Date().toISOString(),
    expires_at: inH(EXPIRY_HOURS[p.category]), confirm_count: 0, flag_count: 0,
  };
  s.posts.unshift(post); save(s); return post;
}
