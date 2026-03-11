import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce cache lock contention that can cause "Lock broken by another request with the 'steal' option" (AbortError)
  experimental: {
    // Disable persistent cache in dev to avoid Web Locks API contention (e.g. multiple tabs, HMR)
    turbopackPersistentCaching: false,
  },
};

export default nextConfig;
