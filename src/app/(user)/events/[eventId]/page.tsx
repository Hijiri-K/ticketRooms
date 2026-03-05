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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">イベントが見つかりません</p>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const selectedType = event.ticketTypes.find((tt) => tt.id === selectedTypeId);
  const allSoldOut = event.ticketTypes.every((tt) => tt.capacity - tt.soldCount <= 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {event.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="px-4 py-6">
        <div className="mx-auto max-w-md">
          {event.hasLottery && (
            <span className="mb-2 inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
              無料抽選あり
            </span>
          )}
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {event.title}
          </h1>

          <div className="mb-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="shrink-0 font-medium">日時</span>
              <span>
                {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="shrink-0 font-medium">会場</span>
              <span>{event.venue}</span>
            </div>
            {event.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="shrink-0 font-medium">住所</span>
                <span>{event.address}</span>
              </div>
            )}
          </div>

          <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {event.description}
          </div>

          {/* Ticket type selection */}
          <div className="mb-4">
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              チケットを選択
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
                    className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : isSoldOut
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {tt.name}
                        </p>
                        {tt.description && (
                          <p className="text-xs text-gray-500">
                            {tt.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">
                          ¥{tt.price.toLocaleString()}
                        </p>
                        {isSoldOut ? (
                          <p className="text-xs font-medium text-red-600">
                            SOLD OUT
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">
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

          <div className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white px-4 py-4">
            <button
              onClick={() =>
                router.push(
                  `/events/${event.id}/checkout?ticketTypeId=${selectedTypeId}`
                )
              }
              disabled={allSoldOut || !selectedType}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
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
