import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

const nextConfig: NextConfig = {
  basePath,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
