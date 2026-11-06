/**
 * Static export: the whole app is client-side and keeps its data on the device,
 * so it can be served from anywhere (Vercel, any static host, a phone's home
 * screen) with no server of its own.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Lets the Android build compile somewhere other than .next, so it never
  // trips over a dev server that's running at the same time.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
