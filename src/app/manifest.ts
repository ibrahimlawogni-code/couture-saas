import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Couture SaaS",
    short_name: "Couture",
    description:
      "Gestion des clients, mesures et commandes pour ateliers de couture",
    start_url: "/commandes",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#18181b",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
