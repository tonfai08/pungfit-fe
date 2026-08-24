import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: 'standalone',
   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.pungfit.life",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wger.de",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
