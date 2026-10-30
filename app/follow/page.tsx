"use client";
import { useEffect, useState } from "react";
import { useData } from "@/lib/useData";
import { CATEGORIES } from "@/lib/types";
import { Follows, getFollows, setFollows } from "@/lib/follow";
import { isLive } from "@/lib/api";

export default function Follow() {
  const { islands } = useData();
  const [f, setF] = useState<Follows>({ islands: [], categories: [], notify: false });
  const [msg, setMsg] = useState("");
  useEffect(() => setF(getFollows()), []);
  const save = (n: Follows) => { setF(n); setFollows(n); };
  const tog = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const enable = async () => {
    if (!("Notification" in window)) return setMsg("This browser doesn't support notifications. On iPhone, add IslandSignal to your Home Screen first.");
    const p = await Notification.requestPermission();
    if (p === "granted") { save({ ...f, notify: true }); setMsg("Notifications on."); } else setMsg("Notifications were blocked in your browser settings.");
  };
  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">Follow islands & topics</h1>
      <section className="card p-4">
        <h2 className="font-semibold mb-3">Islands</h2>
        <div className="flex flex-wrap gap-2">{islands.map((i) => (
          <button key={i.id} onClick={() => save({ ...f, islands: tog(f.islands, i.id) })} className={`chip ${f.islands.includes(i.id) ? "bg-blurple border-blurple text-white" : "border-navy-700"}`}>{i.name}</button>
        ))}</div>
        <p className="text-xs text-slate-500 mt-2">None selected = all islands.</p>
      </section>
      <section className="card p-4">
        <h2 className="font-semibold mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => save({ ...f, categories: tog(f.categories, c.id) })} className={`chip ${f.categories.includes(c.id) ? "bg-blurple border-blurple text-white" : "border-navy-700"}`}>{c.icon} {c.label}</button>
        ))}</div>
        <p className="text-xs text-slate-500 mt-2">None selected = all categories.</p>
      </section>
      <section className="card p-4">
        <h2 className="font-semibold mb-2">Notifications</h2>
        {f.notify ? <button className="btn-ghost" onClick={() => save({ ...f, notify: false })}>🔕 Turn off</button> : <button className="btn-primary" onClick={enable}>🔔 Turn on notifications</button>}
        {msg && <p className="text-sm text-blurple-400 mt-2">{msg}</p>}
        <p className="text-xs text-slate-500 mt-3">
          {isLive ? "You'll get an alert for new matching reports while IslandSignal is open (live updates via Supabase Realtime). Background push when the app is closed is a later step — see README."
            : "Demo mode: alerts fire for new matching reports posted in another tab of this browser. Live alerts need Supabase connected."}
        </p>
      </section>
    </div>
  );
}
