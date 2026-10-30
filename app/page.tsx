"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PostCard from "@/components/PostCard";
import { useData } from "@/lib/useData";
import { CATEGORIES, Category } from "@/lib/types";
import { onNewPost } from "@/lib/api";
import { getFollows, matches } from "@/lib/follow";

export default function Feed() {
  const [showOld, setShowOld] = useState(false);
  const { islands, posts, me, loading, error, reload } = useData({ includeOld: showOld });
  const [island, setIsland] = useState<string>("all");
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const f = getFollows();
    if (f.islands.length === 1) setIsland(f.islands[0]);
    return onNewPost((p) => {
      reload();
      const fl = getFollows();
      if (fl.notify && matches(fl, p) && "Notification" in window && Notification.permission === "granted")
        new Notification("IslandSignal: " + p.title, { body: p.body.slice(0, 120) });
    });
  }, [reload]);

  const shown = useMemo(() => posts.filter((p) =>
    (island === "all" || p.island_id === island) && (cat === "all" || p.category === cat) &&
    (!q || (p.title + " " + p.body + " " + (p.area || "")).toLowerCase().includes(q.toLowerCase()))
  ), [posts, island, cat, q]);
  const byId = Object.fromEntries(islands.map((i) => [i.id, i]));

  return (
    <div className="md:grid md:grid-cols-[1fr_300px] md:gap-6">
      <section className="min-w-0">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-widest text-blurple-400">COMMUNITY UPDATES · TODAY</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">What’s happening near you?</h1>
        </div>
        <div className="flex gap-2 mb-3">
          <select aria-label="Island" className="input max-w-[55%]" value={island} onChange={(e) => setIsland(e.target.value)}>
            <option value="all">All islands</option>
            {islands.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-3 no-scrollbar">
          <button onClick={() => setCat("all")} className={`chip ${cat === "all" ? "bg-blurple border-blurple text-white" : "border-navy-700 text-slate-300"}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`chip ${cat === c.id ? "bg-blurple border-blurple text-white" : "border-navy-700 text-slate-300"}`}>{c.icon} {c.label}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <input type="checkbox" checked={showOld} onChange={(e) => setShowOld(e.target.checked)} /> Show resolved & expired reports
        </label>
        {error && <p className="card p-4 text-red-300">{error}</p>}
        {loading ? <p className="text-slate-400">Loading…</p> : shown.length === 0 ? (
          <div className="card p-6 text-center text-slate-400">No reports here yet. <Link className="text-blurple-400" href="/report/">Be the first to report</Link>.</div>
        ) : (
          <div className="grid gap-3">{shown.map((p) => <PostCard key={p.id} post={p} island={byId[p.island_id]} me={me} onChange={reload} />)}</div>
        )}
      </section>
      <aside className="hidden md:flex flex-col gap-4">
        <div className="card p-5 sticky top-20">
          <h2 className="font-bold text-lg">+ Report something</h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">Help your community stay informed.</p>
          <Link href="/report/" className="btn-primary w-full">Report</Link>
          <div className="mt-5 text-xs text-slate-400 space-y-2">
            <p><span className="text-emerald-300 font-semibold">Verified source</span> — approved official accounts.</p>
            <p><span className="text-blurple-400 font-semibold">Trusted contributor</span> — reliable members.</p>
            <p><span className="text-amber-300 font-semibold">Unconfirmed</span> — community report; tap “Still happening” to confirm.</p>
            <p>Reports expire automatically.</p>
          </div>
        </div>
      </aside>
      <Link href="/report/" className="md:hidden fixed right-4 bottom-20 z-30 btn-primary rounded-full shadow-lg shadow-blurple/30 px-5 py-3">+ Report</Link>
    </div>
  );
}
