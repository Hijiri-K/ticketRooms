import { LiffProvider } from "@/components/liff-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <LiffProvider>
        <div
          className="min-h-screen pb-20"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="anim-fade-in">{children}</div>
        </div>
        <BottomNav />
      </LiffProvider>
    </ThemeProvider>
  );
}
