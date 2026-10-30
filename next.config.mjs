const base = process.env.BASE_PATH || "";
/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STATIC_EXPORT ? { output: "export" } : {}),
  basePath: base,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: base },
};
export default nextConfig;
