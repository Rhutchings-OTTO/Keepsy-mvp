import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.keepsy.store" }],
        destination: "https://keepsy.store/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
