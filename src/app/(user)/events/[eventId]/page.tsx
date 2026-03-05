"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
  soldCount: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  address: string | null;
  imageUrl: string | null;
  hasLottery: boolean;
  ticketTypes: TicketType[];
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data.event);
        if (data.event?.ticketTypes?.length > 0) {
          const firstAvailable = data.event.ticketTypes.find(
            (tt: TicketType) => tt.capacity - tt.soldCount > 0
          );
          setSelectedTypeId(firstAvailable?.id || data.event.ticketTypes[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

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

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>イベントが見つかりません</p>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const selectedType = event.ticketTypes.find(
    (tt) => tt.id === selectedTypeId
  );
  const allSoldOut = event.ticketTypes.every(
    (tt) => tt.capacity - tt.soldCount <= 0
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative">
        {event.imageUrl ? (
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "var(--hero-overlay)",
              }}
            />
          </div>
        ) : (
          <div
            className="aspect-[4/3] w-full"
            style={{
              background: "var(--no-image-gradient)",
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute left-0 top-1/3 h-px w-full"
                style={{ background: "var(--accent)" }}
              />
              <div
                className="absolute right-1/4 top-0 h-full w-px"
                style={{ background: "var(--accent)" }}
              />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {event.hasLottery && (
            <span
              className="mb-2 inline-block text-[10px] uppercase tracking-widest"
              style={{ color: "#d4b87a" }}
            >
              無料抽選あり
            </span>
          )}
          <h1
            className="text-2xl font-light leading-tight anim-fade-up"
            style={{ color: "#ffffff" }}
          >
            {event.title}
          </h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="mx-auto max-w-md">
          {/* Info */}
          <div className="mb-5 space-y-3 anim-fade-up" style={{ animationDelay: "60ms" }}>
            <div className="flex items-start gap-3">
              <span
                className="w-10 shrink-0 text-[10px] font-medium uppercase tracking-widest pt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                DATE
              </span>
              <span
                className="text-sm font-light"
                style={{ color: "var(--text-primary)" }}
              >
                {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span
                className="w-10 shrink-0 text-[10px] font-medium uppercase tracking-widest pt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                VENUE
              </span>
              <span
                className="text-sm font-light"
                style={{ color: "var(--text-primary)" }}
              >
                {event.venue}
              </span>
            </div>
            {event.address && (
              <div className="flex items-start gap-3">
                <span
                  className="w-10 shrink-0 text-[10px] font-medium uppercase tracking-widest pt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  ADDR
                </span>
                <span
                  className="text-sm font-light"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {event.address}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div
            className="mb-6 whitespace-pre-wrap text-sm font-light leading-relaxed anim-fade-up"
            style={{ color: "var(--text-secondary)", animationDelay: "120ms" }}
          >
            {event.description}
          </div>

          {/* Ticket types */}
          <div className="mb-4 anim-fade-up" style={{ animationDelay: "180ms" }}>
            <h2
              className="mb-3 text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              TICKETS
            </h2>
            <div className="space-y-2">
              {event.ticketTypes.map((tt) => {
                const remaining = tt.capacity - tt.soldCount;
                const isSoldOut = remaining <= 0;
                const isSelected = selectedTypeId === tt.id;

                return (
                  <button
                    key={tt.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => setSelectedTypeId(tt.id)}
                    className="w-full rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: isSelected
                        ? "var(--accent-glow)"
                        : "var(--bg-surface)",
                      border: `1.5px solid ${
                        isSelected ? "var(--accent)" : "var(--border)"
                      }`,
                      opacity: isSoldOut ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tt.name}
                        </p>
                        {tt.description && (
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {tt.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className="text-base font-light"
                          style={{
                            color: isSelected
                              ? "var(--accent)"
                              : "var(--text-primary)",
                          }}
                        >
                          ¥{tt.price.toLocaleString()}
                        </p>
                        {isSoldOut ? (
                          <p
                            className="text-[10px] font-medium uppercase tracking-widest"
                            style={{ color: "var(--error)" }}
                          >
                            SOLD OUT
                          </p>
                        ) : (
                          <p
                            className="text-[10px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            残り {remaining} 枚
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sticky buy bar */}
          <div
            className="sticky bottom-0 -mx-5 px-5 py-4"
            style={{
              background: "var(--nav-bg)",
              borderTop: "1px solid var(--border)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            <button
              onClick={() =>
                router.push(
                  `/events/${event.id}/checkout?ticketTypeId=${selectedTypeId}`
                )
              }
              disabled={allSoldOut || !selectedType}
              className="w-full rounded-xl px-4 py-3.5 font-medium tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-40"
              style={{
                background:
                  allSoldOut || !selectedType
                    ? "var(--bg-elevated)"
                    : "var(--accent)",
                color:
                  allSoldOut || !selectedType
                    ? "var(--text-muted)"
                    : "var(--btn-on-accent)",
              }}
            >
              {allSoldOut
                ? "完売しました"
                : selectedType
                  ? `${selectedType.name} ¥${selectedType.price.toLocaleString()} を購入`
                  : "チケットを選択してください"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
