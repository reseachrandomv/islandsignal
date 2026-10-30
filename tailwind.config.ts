import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    navy: { 950: "#070d1f", 900: "#0b1530", 800: "#111e42", 700: "#1a2a57" },
    blurple: { DEFAULT: "#5865F2", 400: "#7983f5", 600: "#4752c4" },
  } } },
  plugins: [],
} satisfies Config;
