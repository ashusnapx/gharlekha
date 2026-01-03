import { MetadataRoute } from "next";
import { CONFIG } from "@/config/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: CONFIG.app.name,
    short_name: "GharLekha",
    description: CONFIG.app.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
