"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/", label: "一覧", icon: "📋" },
  { href: "/reports/new", label: "新規報告", icon: "✏️" },
  { href: "/analytics", label: "分析", icon: "📊" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ヘッダー（PC・スマホ共通） */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="text-xl">🍙</span>
            <span>
              お結び屋 日本の心
              <span className="ml-2 hidden text-xs font-normal text-ink-3 sm:inline">
                売上報告ダッシュボード
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden gap-1 md:flex">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                    isActive(t.href)
                      ? "bg-accent text-white"
                      : "text-ink-2 hover:bg-accent-soft"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={logout}
              className="rounded-full px-3 py-1.5 text-xs text-ink-3 hover:bg-accent-soft"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* スマホ用ボトムナビ */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive(t.href) ? "font-bold text-accent" : "text-ink-3"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
