import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemini :: Linkv2",
  description: "A chat interface for Gemini with a reactive Three.js tunnel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
