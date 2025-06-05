import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Background from "@/template/background";
import Providers from "@/hooks/provider";
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
  title: "Mercado Liz Administracion",
  description: "Gestion y control de supermercado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Background
        >
          {children}
        </Background>
        <Providers>
          <Alert />
        </Providers>
      </body>
    </html>
  );
}
