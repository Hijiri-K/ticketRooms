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

  const now = new Date();
  const upcoming = tickets.filter(
    (t) => new Date(t.event.date) >= now && t.status === "ACTIVE"
  );
  const past = tickets.filter(
    (t) => new Date(t.event.date) < now || t.status !== "ACTIVE"
  );

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1
          className="mb-6 text-3xl font-light tracking-tight anim-fade-up"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          MY TICKETS
        </h1>

        {tickets.length === 0 ? (
          <div className="text-center anim-fade-up" style={{ animationDelay: "60ms" }}>
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              チケットはまだありません
            </p>
            <Link
              href="/events"
              className="text-sm"
              style={{ color: "var(--accent)" }}
            >
              イベントを探す
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-8 anim-fade-up" style={{ animationDelay: "60ms" }}>
                <h2
                  className="mb-3 text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  UPCOMING
                </h2>
                <div className="stagger-children space-y-3">
                  {upcoming.map((ticket) => (
                    <TicketItem key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="anim-fade-up" style={{ animationDelay: "120ms" }}>
                <h2
                  className="mb-3 text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  PAST
                </h2>
                <div className="stagger-children space-y-3">
                  {past.map((ticket) => (
                    <TicketItem key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/events"
            className="text-xs tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            イベント一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

function TicketItem({ ticket }: { ticket: Ticket }) {
  const eventDate = new Date(ticket.event.date);

  const statusConfig: Record<
    string,
    { label: string; bg: string; color: string }
  > = {
    ACTIVE: {
      label: "有効",
      bg: "var(--success-dim)",
      color: "var(--success)",
    },
    USED: {
      label: "入場済み",
      bg: "var(--accent-glow)",
      color: "var(--accent)",
    },
    CANCELLED: {
      label: "キャンセル",
      bg: "var(--error-dim)",
      color: "var(--error)",
    },
  };

  const status = statusConfig[ticket.status] ?? statusConfig.CANCELLED;

  return (
    <Link href={`/tickets/${ticket.id}`} className="block group">
      <div
        className="rounded-xl p-4 transition-all duration-200 group-hover:translate-y-[-1px]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="mb-1 text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {ticket.event.title}
        </h3>
        <p
          className="text-[10px] tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          {ticket.ticketType.name}
        </p>
        <p
          className="text-xs font-light"
          style={{ color: "var(--text-secondary)" }}
        >
          {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {ticket.event.venue}
        </p>
        <div className="mt-2">
          <span
            className="inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest"
            style={{
              background: status.bg,
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
