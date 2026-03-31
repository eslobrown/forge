import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
  outputFileTracingIncludes: {
    "/api/documents": [
      path.join(__dirname, "node_modules/pdfjs-dist/legacy/build/**/*"),
    ],
  },
};

export default nextConfig;
