"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/components/liff-provider";
import { useTheme } from "@/components/theme-provider";

interface UserProfile {
  displayName: string | null;
  pictureUrl: string | null;
  birthday: string | null;
  gender: string | null;
  prefecture: string | null;
  createdAt: string;
}

const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  no_answer: "回答しない",
};

export default function SettingsPage() {
  const { accessToken } = useLiff();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    fetch("/api/users", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setProfile(data.user ?? null))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-6 w-6 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--accent)",
            animation: "spin-slow 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1
          className="mb-6 text-2xl font-light tracking-tight anim-fade-up"
          style={{ color: "var(--text-primary)" }}
        >
          SETTINGS
        </h1>

        {/* Profile Section */}
        <div className="anim-fade-up" style={{ animationDelay: "60ms" }}>
          <h2
            className="mb-3 text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            PROFILE
          </h2>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {profile ? (
              <>
                {/* Avatar + Name */}
                <div className="mb-5 flex items-center gap-4">
                  {profile.pictureUrl ? (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName ?? ""}
                      className="h-14 w-14 rounded-full object-cover"
                      style={{ border: "2px solid var(--border)" }}
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-light"
                      style={{
                        background: "var(--accent-glow)",
                        color: "var(--accent)",
                        border: "2px solid var(--border)",
                      }}
                    >
                      {profile.displayName?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <div>
                    <p
                      className="text-base font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {profile.displayName ?? "名前未設定"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(profile.createdAt).toLocaleDateString("ja-JP")}
                      {" 登録"}
                    </p>
                  </div>
                </div>

                {/* Profile Details */}
                <div
                  className="space-y-3 border-t pt-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ProfileRow
                    label="BIRTHDAY"
                    value={
                      profile.birthday
                        ? new Date(profile.birthday).toLocaleDateString(
                            "ja-JP"
                          )
                        : "未設定"
                    }
                  />
                  <ProfileRow
                    label="GENDER"
                    value={
                      profile.gender
                        ? GENDER_LABELS[profile.gender] ?? profile.gender
                        : "未設定"
                    }
                  />
                  <ProfileRow
                    label="PREFECTURE"
                    value={profile.prefecture ?? "未設定"}
                  />
                </div>
              </>
            ) : (
              <p
                className="text-sm font-light"
                style={{ color: "var(--text-muted)" }}
              >
                プロフィール情報を取得できませんでした
              </p>
            )}
          </div>
        </div>

        {/* Appearance Section */}
        <div className="mt-8 anim-fade-up" style={{ animationDelay: "120ms" }}>
          <h2
            className="mb-3 text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            APPEARANCE
          </h2>
          <div
            className="rounded-2xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-between px-5 py-4 transition-colors duration-150 active:opacity-70"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{ color: "var(--text-secondary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  ダークモード
                </span>
              </div>
              {/* Toggle Switch */}
              <div
                className="relative h-7 w-12 rounded-full transition-colors duration-300"
                style={{
                  background:
                    theme === "dark" ? "var(--accent)" : "var(--bg-elevated)",
                  border: `1px solid ${theme === "dark" ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <div
                  className="absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-all duration-300"
                  style={{
                    background:
                      theme === "dark"
                        ? "var(--btn-on-accent)"
                        : "var(--text-muted)",
                    left: theme === "dark" ? "calc(100% - 22px)" : "2px",
                  }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-8 anim-fade-up" style={{ animationDelay: "180ms" }}>
          <h2
            className="mb-3 text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            ABOUT
          </h2>
          <div
            className="rounded-2xl px-5 py-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                バージョン
              </span>
              <span
                className="text-sm font-light"
                style={{ color: "var(--text-muted)" }}
              >
                1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[10px] font-medium uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-light"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
