import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_NAME } from "@/lib/site";

// Served as /manifest.webmanifest in the static export. It tells the browser
// the site can be installed as a standalone app.
// force-static: with output: 'export' the file must be built ahead of time.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Upcoming and recent rocket launches worldwide.",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#faf8f3",
    icons: [
      { src: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" },
      { src: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${BASE_PATH}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };
}
