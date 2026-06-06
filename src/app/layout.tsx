import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saman Digital POS",
  description: "Sistema de gestión integral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
