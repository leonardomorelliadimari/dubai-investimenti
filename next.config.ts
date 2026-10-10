import type { NextConfig } from "next";

// Export statico per GitHub Pages. In CI NEXT_PUBLIC_BASE_PATH = "/<nome-repo>".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
