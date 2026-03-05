"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/components/liff-provider";

export default function Home() {
  const { isReady, isLoggedIn, accessToken, error } = useLiff();
  const router = useRouter();
  const [status, setStatus] = useState("LIFF を初期化中...");

  useEffect(() => {
    if (!isReady || !isLoggedIn || !accessToken) return;

    const authenticate = async () => {
      setStatus("認証中...");

      const res = await fetch("/api/auth/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      if (!res.ok) {
        setStatus("認証に失敗しました。再度お試しください。");
        return;
      }

      const { user } = await res.json();

      if (!user.isRegistered) {
        router.push("/register");
      } else {
        router.push("/events");
      }
    };

    authenticate();
  }, [isReady, isLoggedIn, accessToken, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg" style={{ color: "var(--error)" }}>
            エラーが発生しました
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-6 w-6 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--accent)",
            animation: "spin-slow 0.8s linear infinite",
          }}
        />
        <p className="text-sm font-light" style={{ color: "var(--text-muted)" }}>
          {status}
        </p>
      </div>
    </div>
  );
}
