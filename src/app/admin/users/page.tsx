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
    return <p className="text-gray-500">読み込み中...</p>;
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
        ユーザー一覧
      </h2>

      {users.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">ユーザーはまだいません</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {user.displayName || "未設定"}
                  </p>
                  <div className="flex gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isRegistered
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.isRegistered ? "登録済" : "未登録"}
                    </span>
                    {user.isFriend && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        友だち
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
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
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
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
                    className="border-b border-gray-50 text-sm hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {user.displayName || "未設定"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {user.lineUserId.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isRegistered
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.isRegistered ? "済" : "未"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isFriend
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.isFriend ? "友だち" : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {user.prefecture || "-"}
                    </td>
                    <td className="px-4 py-3">{user._count.tickets}</td>
                    <td className="px-4 py-3 text-gray-500">
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
