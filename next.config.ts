import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      { source: "/v2", destination: "/", permanent: true },
      { source: "/v2/nori", destination: "/dashboard", permanent: true },
      { source: "/v2/nori/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
