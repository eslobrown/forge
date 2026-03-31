import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGE — Structural Decision Intelligence",
  description: "Adversarial stress-testing for policy and infrastructure decisions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050510] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
