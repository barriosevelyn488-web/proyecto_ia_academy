import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campuslands CRM | Embudo y rendimiento",
  description: "CRM de seguimiento de prospectos, inscripciones y pagos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
