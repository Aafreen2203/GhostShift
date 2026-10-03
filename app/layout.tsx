import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { BrandWatermark } from "@/components/BrandWatermark";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhostShift Memory Agent",
  description:
    "Institutional memory for engineering teams. When people leave, their technical knowledge shouldn’t leave with them.",
  icons: {
    icon: "/brand/ghostshift-mark.png",
    apple: "/brand/ghostshift-mark.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-x-hidden bg-gs-bg text-slate-900">
        <BrandWatermark />
        <div className="relative z-10 min-h-full">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
