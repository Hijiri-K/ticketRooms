"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: "📊" },
  { href: "/admin/events", label: "イベント", icon: "🎫" },
  { href: "/admin/tickets", label: "チケット", icon: "🎟️" },
  { href: "/admin/tags", label: "タグ", icon: "🏷️" },
  { href: "/admin/users", label: "ユーザー", icon: "👥" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.admin) {
          setAdminName(data.admin.name);
        }
      })
      .finally(() => setLoading(false));
  }, [isLoginPage, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <h1 className="text-base font-bold text-gray-900">Rooms 管理画面</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 text-gray-600"
          aria-label="メニュー"
        >
          {menuOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-[49px] z-20 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="relative border-b border-gray-200 bg-white p-2 shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-gray-100 px-3 pt-3 pb-1 flex items-center justify-between">
              <p className="text-sm text-gray-600">{adminName}</p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600"
              >
                ログアウト
              </button>
            </div>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-900">Rooms 管理画面</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">{adminName}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              ログアウト
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
