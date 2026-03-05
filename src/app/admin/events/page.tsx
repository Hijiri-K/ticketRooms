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
    return <p className="text-gray-500">読み込み中...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          イベント管理
        </h2>
        <Link
          href="/admin/events/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">イベントはまだありません</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {event.title}
                  </h3>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {event.isPublished ? "公開" : "非公開"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
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
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
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
                    className="border-b border-gray-50 text-sm hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(event.date), "yyyy/MM/dd HH:mm", {
                        locale: ja,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{event.venue}</td>
                    <td className="px-4 py-3">
                      ¥{event.minPrice.toLocaleString()}〜
                    </td>
                    <td className="px-4 py-3">
                      {event.totalSold}/{event.totalCapacity}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {event.isPublished ? "公開" : "非公開"}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
