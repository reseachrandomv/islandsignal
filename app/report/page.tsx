"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPost } from "@/lib/api";
import { useData } from "@/lib/useData";
import { CATEGORIES, Category } from "@/lib/types";

export default function Report() {
  const { islands, me, loading } = useData();
  const r = useRouter();
  const [f, setF] = useState({ island_id: "", category: "" as Category | "", title: "", body: "", area: "" });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (!me) return (
    <div className="card p-6 max-w-md mx-auto text-center">
      <h1 className="text-xl font-bold mb-2">Sign in to report</h1>
      <p className="text-slate-400 text-sm mb-4">Reports are linked to an account so moderators can stop spam.</p>
      <Link href="/login/" className="btn-primary">Sign in</Link>
    </div>
  );

  const locate = () => {
    if (!navigator.geolocation) return setErr("Location isn't available on this device.");
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      () => setErr("Couldn't get your location. You can still type the area."), { enableHighAccuracy: true, timeout: 10000 });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      await createPost({ ...f, category: f.category as Category, area: f.area || null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, image });
      r.push("/");
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="max-w-xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Report something</h1>
      <div>
        <p className="text-sm font-semibold mb-2">What is it?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} onClick={() => setF({ ...f, category: c.id })}
              className={`card px-3 py-2.5 text-sm text-left ${f.category === c.id ? "!border-blurple bg-blurple/15" : ""}`}>{c.icon} {c.label}</button>
          ))}
        </div>
      </div>
      <label className="text-sm font-semibold">Island
        <select className="input mt-1" value={f.island_id} onChange={(e) => setF({ ...f, island_id: e.target.value })}>
          <option value="">Choose island…</option>
          {islands.map((i) => <option key={i.id} value={i.id}>{i.name}{i.atoll ? ` (${i.atoll})` : ""}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Area / landmark (optional)
        <input className="input mt-1" maxLength={80} placeholder="e.g. near the harbour" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
      </label>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" className="btn-ghost text-sm" onClick={locate}>📍 Use my location</button>
        {geo ? <span className="text-slate-400">{geo.lat}, {geo.lng} <button type="button" className="text-red-300 ml-1" onClick={() => setGeo(null)}>remove</button></span> : <span className="text-slate-500">optional</span>}
      </div>
      <label className="text-sm font-semibold">Title
        <input className="input mt-1" maxLength={90} required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">Description
        <textarea className="input mt-1 min-h-28" maxLength={1000} required value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">Photo (optional, max 5 MB)
        <input type="file" accept="image/jpeg,image/png,image/webp" className="block mt-1 text-sm text-slate-400" onChange={(e) => setImage(e.target.files?.[0] || null)} />
      </label>
      {err && <p className="text-red-300 text-sm">{err}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Posting…" : "Post report"}</button>
      <p className="text-xs text-slate-500">Your report shows as “Unconfirmed” until others confirm it or a verified source posts. It expires automatically.</p>
    </form>
  );
}
