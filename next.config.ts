import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache webpack désactivé en dev → moins de crashes .next corrompu
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // Limite les compilations parallèles agressives
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
