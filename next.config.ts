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
    ],
  },
};

export default nextConfig;
