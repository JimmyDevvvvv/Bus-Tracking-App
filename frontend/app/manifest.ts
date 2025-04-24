import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BusTracker",
    short_name: "BusTracker",
    description: "Real-time bus tracking for students",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#0070f3",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
