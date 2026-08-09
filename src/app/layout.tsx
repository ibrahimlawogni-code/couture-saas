import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "./service-worker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Couture SaaS",
  description: "Gestion des clients, mesures et commandes pour ateliers de couture",
  appleWebApp: { capable: true, title: "Couture", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  // Empeche le zoom automatique d'iOS a la mise au point d'un champ.
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
