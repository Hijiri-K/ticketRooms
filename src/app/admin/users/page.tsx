"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface User {
  id: string;
  lineUserId: string;
  displayName: string | null;
  isRegistered: boolean;
  isFriend: boolean;
  prefecture: string | null;
  gender: string | null;
  createdAt: string;
  _count: { tickets: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>;
  }

  return (
    <div>
      <h2
        className="text-xl md:text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        ユーザー一覧
      </h2>

      {users.length === 0 ? (
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <p style={{ color: "var(--admin-muted)" }}>ユーザーはまだいません</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-lg p-4"
                style={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm" style={{ color: "var(--admin-text)" }}>
                    {user.displayName || "未設定"}
                  </p>
                  <div className="flex gap-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: user.isRegistered ? "var(--success-dim)" : "var(--admin-bg)",
                        color: user.isRegistered ? "var(--success)" : "var(--admin-muted)",
                      }}
                    >
                      {user.isRegistered ? "登録済" : "未登録"}
                    </span>
                    {user.isFriend && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "var(--success-dim)", color: "var(--success)" }}
                      >
                        友だち
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs space-y-1" style={{ color: "var(--admin-muted)" }}>
                  <p>
                    {user.prefecture || "-"} ・ チケット{user._count.tickets}枚
                  </p>
                  <p>
                    {format(new Date(user.createdAt), "yyyy/MM/dd", {
                      locale: ja,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div
            className="hidden md:block rounded-lg overflow-hidden"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-[10px] uppercase tracking-widest font-medium"
                  style={{
                    color: "var(--admin-muted)",
                    borderBottom: "1px solid var(--admin-border)",
                    background: "var(--admin-bg)",
                  }}
                >
                  <th className="px-4 py-3">表示名</th>
                  <th className="px-4 py-3">LINE ID</th>
                  <th className="px-4 py-3">登録</th>
                  <th className="px-4 py-3">友だち</th>
                  <th className="px-4 py-3">都道府県</th>
                  <th className="px-4 py-3">チケット数</th>
                  <th className="px-4 py-3">登録日</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="text-sm transition-colors"
                    style={{ borderBottom: "1px solid var(--admin-border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--admin-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--admin-text)" }}>
                      {user.displayName || "未設定"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--admin-muted)" }}>
                      {user.lineUserId.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: user.isRegistered ? "var(--success-dim)" : "var(--admin-bg)",
                          color: user.isRegistered ? "var(--success)" : "var(--admin-muted)",
                        }}
                      >
                        {user.isRegistered ? "済" : "未"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: user.isFriend ? "var(--success-dim)" : "var(--admin-bg)",
                          color: user.isFriend ? "var(--success)" : "var(--admin-muted)",
                        }}
                      >
                        {user.isFriend ? "友だち" : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                      {user.prefecture || "-"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>{user._count.tickets}</td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                      {format(new Date(user.createdAt), "yyyy/MM/dd", {
                        locale: ja,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
