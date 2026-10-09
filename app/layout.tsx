import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff" };
export const metadata: Metadata = {
  title: "Oscar — Le squelette humain · ST2S",
  description:
    "Explore le squelette humain en 3D et révise les repères anatomiques de ST2S. Oscar relie exploration, exercices et progression.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
