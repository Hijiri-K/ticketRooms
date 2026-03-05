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

const statusLabels: Record<string, { label: string; css: { background: string; color: string } }> = {
  ACTIVE: { label: "有効", css: { background: "var(--success-dim)", color: "var(--success)" } },
  USED: { label: "使用済", css: { background: "var(--admin-bg)", color: "var(--admin-muted)" } },
  CANCELLED: { label: "キャンセル", css: { background: "var(--error-dim)", color: "var(--error)" } },
  EXPIRED: { label: "期限切れ", css: { background: "var(--warning-dim)", color: "var(--warning)" } },
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
    statusLabels[status] || { label: status, css: { background: "var(--admin-bg)", color: "var(--admin-muted)" } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl md:text-2xl font-bold"
          style={{ color: "var(--admin-text)" }}
        >
          チケット一覧
        </h2>
        <Link
          href="/admin/tickets/scan"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
          style={{
            background: "var(--admin-accent)",
            color: "var(--admin-surface)",
          }}
        >
          QRスキャン
        </Link>
      </div>

      <div className="mb-4">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full md:w-auto px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{
            background: "var(--admin-bg)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
          }}
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
        <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>
      ) : tickets.length === 0 ? (
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <p style={{ color: "var(--admin-muted)" }}>チケットはまだありません</p>
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
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm" style={{ color: "var(--admin-text)" }}>
                      {ticket.user.displayName || "未設定"}
                    </p>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={status.css}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="text-xs space-y-1" style={{ color: "var(--admin-muted)" }}>
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
                      className="text-sm transition-colors"
                      style={{ borderBottom: "1px solid var(--admin-border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--admin-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--admin-muted)" }}>
                        {ticket.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>
                        {ticket.user.displayName || "未設定"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>{ticket.event.title}</td>
                      <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>{ticket.ticketType.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={status.css}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>
                        ¥{ticket.payment?.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
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
