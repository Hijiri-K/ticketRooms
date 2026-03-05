import { LiffProvider } from "@/components/liff-provider";
import { BottomNav } from "@/components/bottom-nav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffProvider>
      <div className="pb-16">{children}</div>
      <BottomNav />
    </LiffProvider>
  );
}
