"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/events", label: "イベント", icon: "calendar" },
  { href: "/tickets", label: "チケット", icon: "ticket" },
] as const;

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  calendar: (active) => (
    <svg
      className={`h-6 w-6 ${active ? "text-blue-600" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
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
      className={`h-6 w-6 ${active ? "text-blue-600" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center py-2"
            >
              {icons[item.icon](active)}
              <span
                className={`mt-0.5 text-xs ${
                  active ? "font-medium text-blue-600" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
