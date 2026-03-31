import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
  outputFileTracingIncludes: {
    "/api/documents": ["./node_modules/pdfjs-dist/legacy/build/**/*"],
  },
};

export default nextConfig;
