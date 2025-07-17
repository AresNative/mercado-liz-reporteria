import type { Metadata } from "next";
import { Geist, Geist_Mono, Lobster } from "next/font/google";

import "./globals.css";

import Background from "@/template/background";
import Providers from "@/hooks/provider";
import Alert from "@/components/alert";
import Header from "@/template/header";

import { Suspense } from 'react';
import { LoadingScreen } from "@/template/loading-screen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const lobsterSans = Lobster({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: "400",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mercado Liz Administración",
  description: "Gestión y control de supermercado",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${lobsterSans.variable}`} suppressHydrationWarning>
      <head>
        <title>Mercado Liz</title>
        <meta name="description"
          content="Mercado Liz - Tu pantalla de administracion general en supermercados | todal de sucursales | empleados | compras | ventas | reporteria" />

        <base href="/" />
        <meta name="theme-color" content="#00a63e" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lobster&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mercado Liz" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <Providers>
          <Background>
            {/* Cabecera con navegación */}
            <Header
              title="Liz"
              showBackButton={false}
              showMenuButton={true}
              className="fixed top-0 left-0 right-0 z-20"
            />

            {/* Contenido principal con suspense para loading */}
            <main className="pt-16">
              <Suspense fallback={<LoadingScreen />}>
                {children}
              </Suspense>
            </main>
          </Background>

          {/* Sistema de alertas */}
          <Alert />
        </Providers>
      </body>
    </html>
  );
}