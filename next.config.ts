import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The driver is also on Next.js's default external list. Listed here so
  // the MongoDB dependency stays obvious to the team.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
