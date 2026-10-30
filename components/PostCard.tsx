"use client";
import { useState } from "react";
import { catOf, Island, Me, Post } from "@/lib/types";
import { confirmPost, flagPost, setStatus } from "@/lib/api";

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
const TRUST = {
  official: { label: "Verified source", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40", who: "Official source" },
  trusted: { label: "Trusted contributor", cls: "bg-blurple/15 text-blurple-400 border-blurple/40", who: "Trusted contributor" },
  community: { label: "Unconfirmed", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40", who: "Community report" },
};

export default function PostCard({ post, island, me, onChange }: { post: Post; island?: Island; me: Me | null; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const c = catOf(post.category); const t = TRUST[post.trust];
  const expired = Date.parse(post.expires_at) < Date.now();
  const run = async (f: () => Promise<void>, ok: string) => {
    try { await f(); setMsg(ok); onChange(); } catch (e: any) { setMsg(e.message); }
  };
  return (
    <article className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="text-2xl grid place-items-center w-11 h-11 rounded-xl bg-navy-800 shrink-0">{c.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${t.cls}`}>{t.label}</span>
            {post.is_sample && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-navy-950">SAMPLE</span>}
            {post.status === "resolved" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-600/40 text-slate-300">Resolved</span>}
            {post.status === "removed" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-600/30 text-red-300">Removed</span>}
            {expired && post.status === "active" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-600/40 text-slate-300">Expired</span>}
          </div>
          <h3 className="font-bold leading-snug">{post.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{c.label} · {island?.name ?? post.island_id}{post.area ? ` · ${post.area}` : ""}</p>
        </div>
      </div>
      <p className="text-sm text-slate-300 whitespace-pre-line">{post.body}</p>
      {post.image_url && <img src={post.image_url} alt="" className="rounded-xl max-h-64 object-cover w-full" />}
      {post.lat != null && post.lng != null && (
        <a className="text-xs text-blurple-400 hover:underline" target="_blank" rel="noopener" href={`https://www.openstreetmap.org/?mlat=${post.lat}&mlon=${post.lng}#map=17/${post.lat}/${post.lng}`}>📍 View location on map</a>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{t.who}{post.author_name ? ` · ${post.author_name}` : ""} · {timeAgo(post.created_at)}</span>
        <span>✅ {post.confirm_count} confirmed</span>
      </div>
      {post.status === "active" && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost text-sm py-1.5" onClick={() => run(() => confirmPost(post.id), "Thanks, confirmed.")}>✅ Still happening</button>
          <button className="btn-ghost text-sm py-1.5" onClick={() => { const r = prompt("Why are you flagging this? (spam, false, offensive…)"); if (r !== null) run(() => flagPost(post.id, r), "Flagged for moderators."); }}>🚩 Flag</button>
          {me && (me.id === post.author_id || me.role === "admin") && (
            <button className="btn-ghost text-sm py-1.5" onClick={() => run(() => setStatus(post.id, "resolved"), "Marked resolved.")}>✔ Mark resolved</button>
          )}
        </div>
      )}
      {msg && <p className="text-xs text-blurple-400">{msg}</p>}
    </article>
  );
}
