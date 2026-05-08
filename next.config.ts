import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tailwindcss/oxide", "@tailwindcss/postcss"],
  experimental: {
    // Client-side Router Cache: hergebruikt RSC-payload bij terug-navigatie zodat
    // back/forth tussen dashboard-pagina's instant is.
    // Cache is in-memory (per tab), wordt door Next.js LRU-gemanaged en gewist bij hard reload —
    // groeit dus niet ongelimiteerd op het device.
    staleTimes: {
      dynamic: 60,   // 1 min voor per-user pagina's (dashboard, inventory, planogram)
      static: 300,   // 5 min voor statisch geprefetchte / SSG-pagina's
    },
  },
};

export default nextConfig;
