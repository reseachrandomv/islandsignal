import "./globals.css";
import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
const b = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const metadata: Metadata = {
  title: "IslandSignal — Your island, your live updates",
  description: "Community-powered local updates: outages, ferry delays, lost & found and notices.",
  manifest: `${b}/manifest.webmanifest`,
  icons: { icon: `${b}/icon-192.png`, apple: `${b}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "IslandSignal", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#0b1530", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
