import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindle Highlights",
  description: "Kindleハイライト管理・復習アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kindle Highlights",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-lg sm:text-xl font-bold text-blue-600">
              Kindle Highlights
            </a>
            <nav className="flex items-center gap-2 sm:gap-4">
              <a
                href="/import"
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
              >
                インポート
              </a>
              <a
                href="/settings"
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-xs sm:text-sm font-medium"
              >
                設定
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
