import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TailorHub",
    short_name: "TailorHub",
    description:
      "Gestion des clients, mesures et commandes pour ateliers de couture",
    start_url: "/tableau-de-bord",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f9f8",
    theme_color: "#0c3b2e",
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
