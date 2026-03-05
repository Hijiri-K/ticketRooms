"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function AdminNavIcon({ name }: { name: string }) {
  switch (name) {
    case "dashboard":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "events":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "tickets":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case "tags":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l6.58-6.58a1 1 0 0 0 0-1.42L12 2Z" />
          <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "users":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return null;
  }
}

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: "dashboard" },
  { href: "/admin/events", label: "イベント", icon: "events" },
  { href: "/admin/tickets", label: "チケット", icon: "tickets" },
  { href: "/admin/tags", label: "タグ", icon: "tags" },
  { href: "/admin/users", label: "ユーザー", icon: "users" },
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--admin-bg)" }}
      >
        <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>
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
    <div className="min-h-screen" style={{ background: "var(--admin-bg)" }}>
      {/* Mobile header - frosted glass */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--admin-border)",
        }}
      >
        <div>
          <h1
            className="text-[11px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "var(--admin-text)" }}
          >
            ROOMS
          </h1>
          <p
            className="text-[9px] tracking-[0.15em] uppercase"
            style={{ color: "var(--admin-muted)" }}
          >
            Admin Console
          </p>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1"
          style={{ color: "var(--admin-text)" }}
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
          <nav
            className="relative p-2 shadow-lg"
            style={{
              background: "var(--admin-surface)",
              borderBottom: "1px solid var(--admin-border)",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors"
                style={{
                  color: isActive(item.href) ? "var(--admin-text)" : "var(--admin-muted)",
                  background: isActive(item.href) ? "var(--admin-bg)" : "transparent",
                  fontWeight: isActive(item.href) ? 500 : 400,
                }}
              >
                <AdminNavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
            <div
              className="mt-1 px-3 pt-3 pb-1 flex items-center justify-between"
              style={{ borderTop: "1px solid var(--admin-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--admin-muted)" }}>{adminName}</p>
              <button
                onClick={handleLogout}
                className="text-sm"
                style={{ color: "var(--error)" }}
              >
                ログアウト
              </button>
            </div>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0"
          style={{
            background: "var(--admin-surface)",
            borderRight: "1px solid var(--admin-border)",
          }}
        >
          <div className="p-5" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <h1
              className="text-[11px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--admin-text)" }}
            >
              ROOMS
            </h1>
            <p
              className="text-[9px] tracking-[0.15em] uppercase mt-0.5"
              style={{ color: "var(--admin-muted)" }}
            >
              Admin Console
            </p>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  color: isActive(item.href) ? "var(--admin-text)" : "var(--admin-muted)",
                  background: isActive(item.href) ? "var(--admin-bg)" : "transparent",
                  fontWeight: isActive(item.href) ? 500 : 400,
                }}
              >
                <AdminNavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
            <p className="text-sm mb-2" style={{ color: "var(--admin-muted)" }}>{adminName}</p>
            <button
              onClick={handleLogout}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--error)" }}
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
