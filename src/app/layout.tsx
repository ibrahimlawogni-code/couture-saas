import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { BarreEtatReseau } from "./service-worker";

// Une seule famille pour toute l'application. Plus ronde et plus chaleureuse
// qu'une grotesque neutre, elle convient mieux a un public d'artisans.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TailorHub",
  description: "Gestion des clients, mesures et commandes pour ateliers de couture",
  appleWebApp: { capable: true, title: "TailorHub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0c3b2e",
  // Empeche le zoom automatique d'iOS a la mise au point d'un champ.
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BarreEtatReseau />
        {children}
      </body>
    </html>
  );
}
