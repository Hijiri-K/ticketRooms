"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Ticket {
  id: string;
  status: string;
  user: { displayName: string | null; lineUserId: string };
  event: { title: string };
  ticketType: { name: string };
  payment: { amount: number; createdAt: string } | null;
}

interface Event {
  id: string;
  title: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "有効", color: "bg-green-100 text-green-700" },
  USED: { label: "使用済", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "キャンセル", color: "bg-red-100 text-red-700" },
  EXPIRED: { label: "期限切れ", color: "bg-yellow-100 text-yellow-700" },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedEventId
      ? `/api/admin/tickets?eventId=${selectedEventId}`
      : "/api/admin/tickets";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const getStatus = (status: string) =>
    statusLabels[status] || { label: status, color: "bg-gray-100 text-gray-600" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          チケット一覧
        </h2>
        <Link
          href="/admin/tickets/scan"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          QRスキャン
        </Link>
      </div>

      <div className="mb-4">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全イベント</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">チケットはまだありません</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => {
              const status = getStatus(ticket.status);
              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-gray-900 text-sm">
                      {ticket.user.displayName || "未設定"}
                    </p>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>{ticket.event.title} / {ticket.ticketType.name}</p>
                    <p>
                      ¥{ticket.payment?.amount.toLocaleString()} ・{" "}
                      {ticket.payment
                        ? format(
                            new Date(ticket.payment.createdAt),
                            "yyyy/MM/dd HH:mm",
                            { locale: ja }
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3">チケットID</th>
                  <th className="px-4 py-3">ユーザー</th>
                  <th className="px-4 py-3">イベント</th>
                  <th className="px-4 py-3">種別</th>
                  <th className="px-4 py-3">ステータス</th>
                  <th className="px-4 py-3">金額</th>
                  <th className="px-4 py-3">購入日</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const status = getStatus(ticket.status);
                  return (
                    <tr
                      key={ticket.id}
                      className="border-b border-gray-50 text-sm hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {ticket.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        {ticket.user.displayName || "未設定"}
                      </td>
                      <td className="px-4 py-3">{ticket.event.title}</td>
                      <td className="px-4 py-3 text-gray-600">{ticket.ticketType.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
