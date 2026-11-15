import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export plain static files to out/ (no server needed).
  output: "export",
  // The default image optimizer needs a server, so turn it off.
  images: { unoptimized: true },
};

export default nextConfig;
