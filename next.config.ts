import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   async rewrites() {
     if (process.env.NODE_ENV === 'production' && !process.env.BK_API_ORIGIN) {
       throw new Error('Set BK_API_ORIGIN to the backend origin before building the booking admin frontend.');
     }
     const bookingApi = (process.env.BK_API_ORIGIN || 'http://127.0.0.1:5000').replace(/\/$/, '');
     return [{ source: '/bk-api/:path*', destination: `${bookingApi}/v1/bk/:path*` }];
   },
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
