import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "GhostShift",
  description: "Institutional memory for engineering teams.",
};

const links = [
  ["/", "Home"],
  ["/dashboard", "Dashboard"],
  ["/incidents", "Incidents"],
  ["/search", "Search"],
  ["/simulator", "Simulator"],
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              GhostShift
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
              {links.map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-slate-900">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
