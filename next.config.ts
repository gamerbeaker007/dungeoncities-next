import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.hive.blog",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
