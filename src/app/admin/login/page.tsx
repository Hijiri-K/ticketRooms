"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "ログインに失敗しました");
        return;
      }

      router.replace("/admin");
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--admin-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-8"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-[13px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "var(--admin-text)" }}
          >
            ROOMS
          </h1>
          <p
            className="text-[10px] tracking-[0.15em] uppercase mt-1"
            style={{ color: "var(--admin-muted)" }}
          >
            Admin Console
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
              style={{ color: "var(--admin-muted)" }}
            >
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
                // @ts-expect-error CSS variable in focus ring
                "--tw-ring-color": "var(--admin-text)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
              style={{ color: "var(--admin-muted)" }}
            >
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
                // @ts-expect-error CSS variable in focus ring
                "--tw-ring-color": "var(--admin-text)",
              }}
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "var(--admin-accent)",
              color: "var(--admin-surface)",
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
