"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isLive } from "@/lib/api";

const NAV = [
  { href: "/", label: "Feed", icon: "📡" },
  { href: "/report/", label: "Report", icon: "➕" },
  { href: "/follow/", label: "Follow", icon: "🔔" },
  { href: "/admin/", label: "Admin", icon: "🛡️" },
  { href: "/login/", label: "Account", icon: "👤" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register((process.env.NEXT_PUBLIC_BASE_PATH || "") + "/sw.js").catch(() => {});
  }, []);
  const active = (h: string) => (h === "/" ? path === "/" : path?.startsWith(h.replace(/\/$/, "")));
  return (
    <div className="min-h-screen flex flex-col">
      {!isLive && (
        <div className="bg-amber-400 text-navy-950 text-center text-xs sm:text-sm font-semibold px-3 py-1.5">
          DEMO MODE · sample posts only, saved in this browser · not a live service
        </div>
      )}
      <header className="sticky top-0 z-20 bg-navy-950/90 backdrop-blur border-b border-navy-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-lg">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-blurple">📡</span>
            Island<span className="text-blurple-400">Signal</span>
          </Link>
          <nav className="hidden md:flex gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-lg text-sm font-medium ${active(n.href) ? "bg-blurple text-white" : "text-slate-300 hover:bg-navy-800"}`}>{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 pb-28 md:pb-10">{children}</main>
      <footer className="text-center text-xs text-slate-500 pb-24 md:pb-6 px-4">
        <a href="https://reseachrandomv.github.io/cv/" className="hover:text-blurple-400 underline-offset-2 hover:underline">Design &amp; build by Fathimath Malaak Jaufar</a>
      </footer>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-navy-900/95 backdrop-blur border-t border-navy-700 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-col items-center py-2 text-[11px] ${active(n.href) ? "text-blurple-400" : "text-slate-400"}`}>
            <span className="text-lg leading-none mb-0.5">{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
