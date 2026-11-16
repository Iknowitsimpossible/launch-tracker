import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export plain static files to out/ (no server needed).
  output: "export",
  // Empty locally; "/<repo>" on GitHub Pages (set by the deploy workflow).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // /launch/<slug>/ becomes launch/<slug>/index.html, which any static host serves.
  trailingSlash: true,
  // The default image optimizer needs a server, so turn it off.
  images: { unoptimized: true },
};

export default nextConfig;
