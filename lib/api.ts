"use client";
import { supabase, isLive } from "./supabase";
import * as demo from "./demo";
import { Island, Me, NewPost, Post, Role, Status } from "./types";
import { validatePost } from "./validate";

export { isLive };

export async function getIslands(): Promise<Island[]> {
  if (!supabase) return demo.DEMO_ISLANDS;
  const { data, error } = await supabase.from("islands").select("id,name,atoll").order("name");
  if (error) throw error;
  return data as Island[];
}

/** Feed: active (non-expired) posts; includeOld adds resolved/expired. */
export async function getPosts(opts: { includeOld?: boolean; admin?: boolean } = {}): Promise<Post[]> {
  const now = Date.now();
  if (!supabase) {
    let ps = demo.load().posts;
    if (!opts.admin) ps = ps.filter((p) => p.status !== "removed");
    if (!opts.includeOld && !opts.admin) ps = ps.filter((p) => p.status === "active" && Date.parse(p.expires_at) > now);
    return ps.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  let q = supabase.from("posts_view").select("*").order("created_at", { ascending: false }).limit(200);
  if (!opts.admin) q = q.neq("status", "removed");
  if (!opts.includeOld && !opts.admin) q = q.eq("status", "active").gt("expires_at", new Date().toISOString());
  const { data, error } = await q;
  if (error) throw error;
  return data as Post[];
}

export async function getMe(): Promise<Me | null> {
  if (!supabase) return demo.load().me;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("display_name,role").eq("id", user.id).single();
  return { id: user.id, email: user.email, name: data?.display_name || user.email!.split("@")[0], role: (data?.role as Role) || "user" };
}

export async function signIn(emailOrName: string, demoRole: Role = "user"): Promise<string> {
  if (!supabase) {
    const s = demo.load();
    s.me = { id: "demo-" + emailOrName.toLowerCase().replace(/\W+/g, "-"), name: emailOrName.trim(), role: demoRole };
    demo.save(s); return "Signed in (demo mode, saved in this browser only).";
  }
  const redirect = window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/";
  const { error } = await supabase.auth.signInWithOtp({ email: emailOrName.trim(), options: { emailRedirectTo: redirect } });
  if (error) throw error;
  return "Check your email for a sign-in link.";
}

export async function signOut() {
  if (!supabase) { const s = demo.load(); s.me = null; demo.save(s); return; }
  await supabase.auth.signOut();
}

export async function updateName(name: string) {
  if (!supabase) { const s = demo.load(); if (s.me) s.me.name = name; demo.save(s); return; }
  const me = await getMe(); if (!me) return;
  await supabase.from("profiles").update({ display_name: name }).eq("id", me.id);
}

export async function createPost(p: NewPost): Promise<Post> {
  const err = validatePost(p); if (err) throw new Error(err);
  const me = await getMe(); if (!me) throw new Error("Please sign in to report.");
  if (!supabase) return demo.demoCreate(p, me);
  let image_url: string | null = null;
  if (p.image) {
    const path = `${me.id}/${crypto.randomUUID()}.${p.image.type.split("/")[1]}`;
    const up = await supabase.storage.from("report-images").upload(path, p.image, { contentType: p.image.type });
    if (up.error) throw up.error;
    image_url = supabase.storage.from("report-images").getPublicUrl(path).data.publicUrl;
  }
  const { data, error } = await supabase.from("posts").insert({
    island_id: p.island_id, category: p.category, title: p.title.trim(), body: p.body.trim(),
    area: p.area?.trim() || null, lat: p.lat, lng: p.lng, image_url, author_id: me.id,
  }).select().single();
  if (error) throw error;
  return data as Post;
}

export async function hasConfirmed(id: string): Promise<boolean> {
  if (!supabase) return demo.load().confirmed.includes(id);
  return false;
}

/** "Still happening" confirmation; one per user per post. */
export async function confirmPost(id: string) {
  const me = await getMe(); if (!me) throw new Error("Sign in to confirm reports.");
  if (!supabase) {
    const s = demo.load(); if (s.confirmed.includes(id)) throw new Error("You already confirmed this.");
    s.confirmed.push(id); const p = s.posts.find((x) => x.id === id); if (p) p.confirm_count++; demo.save(s); return;
  }
  const { error } = await supabase.from("confirmations").insert({ post_id: id, user_id: me.id });
  if (error) throw new Error(error.code === "23505" ? "You already confirmed this." : error.message);
}

export async function flagPost(id: string, reason: string) {
  const me = await getMe(); if (!me) throw new Error("Sign in to flag reports.");
  if (!supabase) {
    const s = demo.load(); if (s.flagged.includes(id)) throw new Error("You already flagged this.");
    s.flagged.push(id); const p = s.posts.find((x) => x.id === id); if (p) p.flag_count++; demo.save(s); return;
  }
  const { error } = await supabase.from("flags").insert({ post_id: id, user_id: me.id, reason: reason.slice(0, 200) });
  if (error) throw new Error(error.code === "23505" ? "You already flagged this." : error.message);
}

/** Author or admin: resolve; admin: remove / restore / set trust. */
export async function setStatus(id: string, status: Status) {
  if (!supabase) { const s = demo.load(); const p = s.posts.find((x) => x.id === id); if (p) p.status = status; demo.save(s); return; }
  const { error } = await supabase.from("posts").update({ status }).eq("id", id);
  if (error) throw error;
}
export async function setTrust(id: string, trust: Post["trust"]) {
  if (!supabase) { const s = demo.load(); const p = s.posts.find((x) => x.id === id); if (p) p.trust = trust; demo.save(s); return; }
  const { error } = await supabase.rpc("admin_set_trust", { p_id: id, p_trust: trust });
  if (error) throw error;
}
export async function setUserRole(userId: string, role: Role) {
  if (!supabase) throw new Error("User roles need Supabase connected.");
  const { error } = await supabase.rpc("admin_set_role", { p_user: userId, p_role: role });
  if (error) throw error;
}
export function resetDemo() { demo.reset(); }

/** Subscribe to new posts (realtime in live mode, polling-free storage events in demo). */
export function onNewPost(cb: (p: Post) => void): () => void {
  if (!supabase) {
    const h = (e: StorageEvent) => { if (e.key === "islandsignal-demo-v1") { const p = demo.load().posts[0]; if (p) cb(p); } };
    window.addEventListener("storage", h); return () => window.removeEventListener("storage", h);
  }
  const ch = supabase.channel("posts-new").on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (pl) => cb(pl.new as Post)).subscribe();
  return () => { supabase!.removeChannel(ch); };
}
