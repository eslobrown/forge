import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

export default nextConfig;
