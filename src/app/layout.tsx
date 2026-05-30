import type { Metadata } from "next";
import { generalSans, satoshi } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "InternTracker",
  description: "Track your SE internship journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full", generalSans.variable, satoshi.variable)}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
