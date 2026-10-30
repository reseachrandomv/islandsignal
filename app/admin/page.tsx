"use client";
import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/useData";
import { catOf, Post } from "@/lib/types";
import { setStatus, setTrust } from "@/lib/api";
import { timeAgo } from "@/components/PostCard";

export default function Admin() {
  const { posts, islands, me, loading, reload } = useData({ admin: true });
  const [tab, setTab] = useState<"flagged" | "all" | "removed">("flagged");
  const [err, setErr] = useState<string | null>(null);
  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (!me || me.role !== "admin") return (
    <div className="card p-6 max-w-md mx-auto text-center">
      <h1 className="text-xl font-bold mb-2">Admins only</h1>
      <p className="text-sm text-slate-400 mb-4">Sign in with an admin account to moderate reports.</p>
      <Link className="btn-primary" href="/login/">Sign in</Link>
    </div>
  );
  const name = (id: string) => islands.find((i) => i.id === id)?.name ?? id;
  const list = posts.filter((p) => tab === "flagged" ? p.flag_count > 0 && p.status !== "removed" : tab === "removed" ? p.status === "removed" : p.status !== "removed")
    .sort((a, b) => b.flag_count - a.flag_count);
  const act = async (f: () => Promise<void>) => { try { await f(); setErr(null); reload(); } catch (e: any) { setErr(e.message); } };
  const stats = { active: posts.filter((p) => p.status === "active").length, flagged: posts.filter((p) => p.flag_count > 0 && p.status !== "removed").length, removed: posts.filter((p) => p.status === "removed").length };
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Admin dashboard</h1>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(stats).map(([k, v]) => <div key={k} className="card p-4"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-slate-400 capitalize">{k}</p></div>)}
      </div>
      <div className="flex gap-2">{(["flagged", "all", "removed"] as const).map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`chip capitalize ${tab === t ? "bg-blurple border-blurple text-white" : "border-navy-700"}`}>{t}</button>))}</div>
      {err && <p className="text-red-300 text-sm">{err}</p>}
      {list.length === 0 && <p className="card p-5 text-slate-400">Nothing here.</p>}
      <div className="grid gap-3">{list.map((p: Post) => (
        <div key={p.id} className="card p-4 flex flex-col gap-2">
          <div className="flex justify-between gap-2"><b>{catOf(p.category).icon} {p.title}</b><span className="text-xs text-red-300 shrink-0">🚩 {p.flag_count}</span></div>
          <p className="text-xs text-slate-400">{name(p.island_id)} · {p.author_name ?? "unknown"} · {timeAgo(p.created_at)} · {p.trust} · {p.status}</p>
          <p className="text-sm text-slate-300 line-clamp-2">{p.body}</p>
          <div className="flex flex-wrap gap-2">
            {p.status !== "removed" ? <button className="btn-ghost text-sm py-1.5 !text-red-300" onClick={() => act(() => setStatus(p.id, "removed"))}>Remove</button>
              : <button className="btn-ghost text-sm py-1.5" onClick={() => act(() => setStatus(p.id, "active"))}>Restore</button>}
            {p.status === "active" && <button className="btn-ghost text-sm py-1.5" onClick={() => act(() => setStatus(p.id, "resolved"))}>Resolve</button>}
            <select className="input !w-auto py-1.5 text-sm" value={p.trust} onChange={(e) => act(() => setTrust(p.id, e.target.value as Post["trust"]))}>
              <option value="community">Unconfirmed</option><option value="trusted">Trusted</option><option value="official">Verified source</option>
            </select>
          </div>
        </div>))}</div>
      <p className="text-xs text-slate-500">To promote a user to trusted / official / admin in live mode, run the SQL in README (“Roles”).</p>
    </div>
  );
}
