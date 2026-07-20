import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "売上報告 | お結び屋 日本の心",
  description: "キッチンカーの売上報告・振り返りダッシュボード",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen pb-24 md:pb-8">
        <NavBar />
        <main className="mx-auto w-full max-w-3xl px-4 pt-4 md:pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
