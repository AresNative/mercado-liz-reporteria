import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_CLIENT_NAME: process.env.NEXT_CLIENT_NAME,

    // Tu aplicación
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_HUBS_URL: process.env.NEXT_PUBLIC_HUBS_URL,
    NEXT_PUBLIC_API_URL_INT: process.env.NEXT_PUBLIC_API_URL_INT,
    NEXT_PUBLIC_TEST_API_URL: process.env.NEXT_PUBLIC_TEST_API_URL,
    NEXT_DOMINIO_URL: process.env.NEXT_DOMINIO_URL,

    // Configuración
    NEXT_PUBLIC_ITEMS_PER_PAGE: process.env.NEXT_PUBLIC_ITEMS_PER_PAGE || "8",

    // Solo la clave ANÓNIMA de Supabase (NO la contraseña)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Puedes agregar más si necesitas
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID:
      process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
  },

  experimental: {
    useCache: true,
  },
};

export default nextConfig;
