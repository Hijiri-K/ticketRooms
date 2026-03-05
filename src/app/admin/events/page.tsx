"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  minPrice: number;
  totalCapacity: number;
  totalSold: number;
  isPublished: boolean;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    fetch("/api/admin/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;

    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  if (loading) {
    return <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl md:text-2xl font-bold"
          style={{ color: "var(--admin-text)" }}
        >
          イベント管理
        </h2>
        <Link
          href="/admin/events/new"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
          style={{
            background: "var(--admin-accent)",
            color: "var(--admin-surface)",
          }}
        >
          新規作成
        </Link>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <p style={{ color: "var(--admin-muted)" }}>イベントはまだありません</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block rounded-lg p-4 transition-shadow hover:shadow-md"
                style={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-medium text-sm"
                    style={{ color: "var(--admin-text)" }}
                  >
                    {event.title}
                  </h3>
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: event.isPublished
                        ? "var(--success-dim)"
                        : "var(--admin-bg)",
                      color: event.isPublished
                        ? "var(--success)"
                        : "var(--admin-muted)",
                    }}
                  >
                    {event.isPublished ? "公開" : "非公開"}
                  </span>
                </div>
                <div className="text-xs space-y-1" style={{ color: "var(--admin-muted)" }}>
                  <p>
                    {format(new Date(event.date), "yyyy/MM/dd HH:mm", {
                      locale: ja,
                    })}{" "}
                    / {event.venue}
                  </p>
                  <p>
                    ¥{event.minPrice.toLocaleString()}〜 ・ {event.totalSold}/
                    {event.totalCapacity}枚
                  </p>
                </div>
              </Link>
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
                  <th className="px-4 py-3">タイトル</th>
                  <th className="px-4 py-3">日時</th>
                  <th className="px-4 py-3">会場</th>
                  <th className="px-4 py-3">価格</th>
                  <th className="px-4 py-3">販売数/定員</th>
                  <th className="px-4 py-3">状態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="text-sm transition-colors"
                    style={{ borderBottom: "1px solid var(--admin-border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--admin-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="hover:underline"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                      {format(new Date(event.date), "yyyy/MM/dd HH:mm", {
                        locale: ja,
                      })}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>{event.venue}</td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>
                      ¥{event.minPrice.toLocaleString()}〜
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>
                      {event.totalSold}/{event.totalCapacity}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: event.isPublished
                            ? "var(--success-dim)"
                            : "var(--admin-bg)",
                          color: event.isPublished
                            ? "var(--success)"
                            : "var(--admin-muted)",
                        }}
                      >
                        {event.isPublished ? "公開" : "非公開"}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-sm hover:underline"
                        style={{ color: "var(--admin-text)" }}
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-sm hover:underline"
                        style={{ color: "var(--admin-text)" }}
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-sm hover:underline"
                        style={{ color: "var(--error)" }}
                      >
                        削除
                      </button>
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
