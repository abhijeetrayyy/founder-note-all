/**
 * Static export: the whole app is client-side and keeps its data on the device,
 * so it can be served from anywhere (Vercel, any static host, a phone's home
 * screen) with no server of its own.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
