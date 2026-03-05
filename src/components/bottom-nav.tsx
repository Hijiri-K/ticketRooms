"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { href: "/events", label: "イベント", icon: "calendar" },
  { href: "/tickets", label: "チケット", icon: "ticket" },
] as const;

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  calendar: (active) => (
    <svg
      className={`h-5 w-5 transition-colors duration-200 ${
        active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  ticket: (active) => (
    <svg
      className={`h-5 w-5 transition-colors duration-200 ${
        active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
      />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--nav-bg)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div
        className="mx-auto flex max-w-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-3 transition-opacity duration-150 active:opacity-60"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
                  style={{
                    background: "var(--accent)",
                    animation: "indicator-slide 0.25s var(--ease-out-expo) both",
                    transformOrigin: "center",
                  }}
                />
              )}
              {icons[item.icon](active)}
              <span
                className={`text-[10px] tracking-wide transition-colors duration-200 ${
                  active ? "font-medium" : ""
                }`}
                style={{
                  color: active ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="relative flex flex-1 flex-col items-center gap-1 py-3 transition-opacity duration-150 active:opacity-60"
          aria-label="テーマ切り替え"
        >
          {theme === "light" ? (
            <svg
              className="h-5 w-5 text-[var(--text-muted)] transition-colors duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-[var(--text-muted)] transition-colors duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
          )}
          <span
            className="text-[10px] tracking-wide transition-colors duration-200"
            style={{ color: "var(--text-muted)" }}
          >
            {theme === "light" ? "ダーク" : "ライト"}
          </span>
        </button>
      </div>
    </nav>
  );
}
