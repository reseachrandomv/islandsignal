"use client";
import { useState } from "react";
import { isLive, signIn, signOut, updateName, resetDemo } from "@/lib/api";
import { useData } from "@/lib/useData";
import { Role } from "@/lib/types";

export default function Login() {
  const { me, reload, loading } = useData();
  const [v, setV] = useState(""); const [role, setRole] = useState<Role>("user");
  const [msg, setMsg] = useState<string | null>(null); const [name, setName] = useState("");
  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (me) return (
    <div className="card p-6 max-w-md mx-auto flex flex-col gap-3">
      <h1 className="text-xl font-bold">Hi, {me.name}</h1>
      <p className="text-sm text-slate-400">Role: <b className="text-slate-200">{me.role}</b>{me.email ? ` · ${me.email}` : ""}</p>
      <div className="flex gap-2"><input className="input" placeholder="Change display name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-ghost" onClick={async () => { if (name.trim()) { await updateName(name.trim().slice(0, 40)); reload(); } }}>Save</button></div>
      <button className="btn-ghost" onClick={async () => { await signOut(); reload(); }}>Sign out</button>
      {!isLive && <button className="text-xs text-slate-500 underline" onClick={() => { resetDemo(); location.reload(); }}>Reset demo data</button>}
    </div>
  );
  return (
    <form className="card p-6 max-w-md mx-auto flex flex-col gap-3" onSubmit={async (e) => { e.preventDefault(); setMsg(null);
      try { setMsg(await signIn(v, role)); reload(); } catch (er: any) { setMsg(er.message); } }}>
      <h1 className="text-xl font-bold">Sign in</h1>
      {isLive ? (
        <><p className="text-sm text-slate-400">We'll email you a one-time sign-in link. No password needed.</p>
          <input className="input" type="email" required placeholder="you@example.com" value={v} onChange={(e) => setV(e.target.value)} /></>
      ) : (
        <><p className="text-sm text-slate-400">Demo mode: just type a name. Nothing leaves this browser. Pick a role to try verification and the admin dashboard.</p>
          <input className="input" required maxLength={40} placeholder="Your name" value={v} onChange={(e) => setV(e.target.value)} />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="user">Community member</option><option value="trusted">Trusted contributor</option>
            <option value="official">Official source</option><option value="admin">Admin / moderator</option>
          </select></>
      )}
      <button className="btn-primary">{isLive ? "Email me a link" : "Continue"}</button>
      {msg && <p className="text-sm text-blurple-400">{msg}</p>}
    </form>
  );
}
