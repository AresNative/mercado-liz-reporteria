import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  "process.env": process.env,
  experimental: {
    useCache: true,
  },
};

export default nextConfig;
