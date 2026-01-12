import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/hooks/provider";
import { cn } from "@/utils/functions/cn";
import Alert from "@/components/alert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solución integral de gestión empresarial | Administración, ventas y compras",
  description: "Plataforma integral para la gestión empresarial: control de empleados, administración de recursos, ventas, compras, mermas y proyectos en un solo sistema.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(`${geistSans.variable} ${geistMono.variable} antialiased`, `bg-[var(--background)]`)}>
        <Providers>
          {children}
          {/* Sistema de alertas */}
          <Alert />
        </Providers>
      </body>
    </html>
  );
}
