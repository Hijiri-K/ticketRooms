"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useLiff } from "@/components/liff-provider";

interface Ticket {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
  };
  ticketType: {
    name: string;
  };
}

export default function TicketsPage() {
  const { accessToken } = useLiff();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    fetch("/api/tickets", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets ?? []))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  const now = new Date();
  const upcoming = tickets.filter(
    (t) => new Date(t.event.date) >= now && t.status === "ACTIVE"
  );
  const past = tickets.filter(
    (t) => new Date(t.event.date) < now || t.status !== "ACTIVE"
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          マイチケット
        </h1>

        {tickets.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-500">チケットはまだありません</p>
            <Link
              href="/events"
              className="text-blue-600 hover:underline"
            >
              イベントを探す
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 text-sm font-medium text-gray-500">
                  これからのイベント
                </h2>
                <div className="space-y-3">
                  {upcoming.map((ticket) => (
                    <TicketItem key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-medium text-gray-500">
                  過去のイベント
                </h2>
                <div className="space-y-3">
                  {past.map((ticket) => (
                    <TicketItem key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/events" className="text-sm text-blue-600 hover:underline">
            イベント一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

function TicketItem({ ticket }: { ticket: Ticket }) {
  const eventDate = new Date(ticket.event.date);

  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
        <h3 className="mb-1 font-semibold text-gray-900">
          {ticket.event.title}
        </h3>
        <p className="text-xs text-gray-500">{ticket.ticketType.name}</p>
        <p className="text-sm text-gray-500">
          {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
        </p>
        <p className="text-sm text-gray-500">{ticket.event.venue}</p>
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              ticket.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : ticket.status === "USED"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {ticket.status === "ACTIVE"
              ? "有効"
              : ticket.status === "USED"
                ? "使用済み"
                : "キャンセル"}
          </span>
        </div>
      </div>
    </Link>
  );
}
