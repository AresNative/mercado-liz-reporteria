// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  env: {
    // Variables de entorno de Vercel/plataforma
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,

    // Tu aplicación
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_HUBS_URL: process.env.NEXT_PUBLIC_HUBS_URL,
    NEXT_PUBLIC_API_URL_INT: process.env.NEXT_PUBLIC_API_URL_INT,
    NEXT_PUBLIC_TEST_API_URL: process.env.NEXT_PUBLIC_TEST_API_URL,

    // Configuración
    NEXT_PUBLIC_ITEMS_PER_PAGE: process.env.NEXT_PUBLIC_ITEMS_PER_PAGE || "8",

    // Solo la clave ANÓNIMA de Supabase (NO la contraseña)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Puedes agregar más si necesitas
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID:
      process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  },

  experimental: {
    useCache: true,
  },

  typescript: {
    ignoreBuildErrors: true, // Temporal para parallel routes
  },
};

export default nextConfig;
