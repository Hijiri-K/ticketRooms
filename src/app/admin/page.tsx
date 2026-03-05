"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Stats {
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  todayEvents: number;
}

interface RecentTicket {
  id: string;
  user: { displayName: string | null };
  event: { title: string };
  payment: { amount: number; createdAt: string } | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) {
          setStats(data.stats);
          setRecentTickets(data.recentTickets ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500">読み込み中...</p>;
  }

  const statCards = [
    { label: "総イベント数", value: stats?.totalEvents ?? 0 },
    { label: "チケット販売数", value: stats?.totalTickets ?? 0 },
    {
      label: "総売上",
      value: `¥${(stats?.totalRevenue ?? 0).toLocaleString()}`,
    },
    { label: "本日のイベント", value: stats?.todayEvents ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
        ダッシュボード
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4 md:p-6"
          >
            <p className="text-xs md:text-sm text-gray-600">{card.label}</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm md:text-base">
            最近のチケット販売
          </h3>
        </div>
        {recentTickets.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">
            チケット販売はまだありません
          </p>
        ) : (
          <>
            {/* Mobile: list */}
            <div className="divide-y divide-gray-50 md:hidden">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {ticket.user.displayName || "未設定"}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      ¥{ticket.payment?.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {ticket.event.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ticket.payment
                        ? format(
                            new Date(ticket.payment.createdAt),
                            "MM/dd HH:mm",
                            { locale: ja }
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3">ユーザー</th>
                  <th className="px-4 py-3">イベント</th>
                  <th className="px-4 py-3">金額</th>
                  <th className="px-4 py-3">日時</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-50 text-sm"
                  >
                    <td className="px-4 py-3">
                      {ticket.user.displayName || "未設定"}
                    </td>
                    <td className="px-4 py-3">{ticket.event.title}</td>
                    <td className="px-4 py-3">
                      ¥{ticket.payment?.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {ticket.payment
                        ? format(
                            new Date(ticket.payment.createdAt),
                            "yyyy/MM/dd HH:mm",
                            { locale: ja }
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
