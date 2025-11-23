import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rewrites removed - using NEXT_PUBLIC_API_BASE_URL directly
  // This allows Cloudflare Tunnel to work correctly
};

export default nextConfig;
