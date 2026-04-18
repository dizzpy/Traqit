import type { Metadata } from "next";
import { generalSans, satoshi } from "@/lib/fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "InternTracker",
  description: "Track your SE internship journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full", generalSans.variable, satoshi.variable, "font-sans", geist.variable)}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
