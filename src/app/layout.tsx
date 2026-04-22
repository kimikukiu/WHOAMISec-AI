import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WHOAMISec AI — Agentic Coding Platform",
  description: "WHOAMISec AI — Platformă AI completă cu 19+ modele, coding agentic, Red Team testing, Loop Coder, QuantumSwarm Intelligence.",
  icons: {
    icon: "/whoamisec-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0e1a] text-slate-100`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
