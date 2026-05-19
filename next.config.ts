import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  basePath: "/timesheet",
  trailingSlash: true,
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
