import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospection Incendie",
  description: "Tableau de bord des immeubles à risque incendie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
