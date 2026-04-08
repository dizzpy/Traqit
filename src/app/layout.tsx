import type { Metadata } from "next";
import { generalSans, satoshi } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "InternTracker",
  description: "Track your SE internship journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${generalSans.variable} ${satoshi.variable}`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
