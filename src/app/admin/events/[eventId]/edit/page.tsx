"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminEventForm } from "@/components/admin-event-form";

interface TicketTypeData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
}

interface LotteryPrizeData {
  id: string;
  name: string;
  stock: number;
  requireRedeem: boolean;
}

export default function AdminEditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [initialData, setInitialData] = useState<{
    title: string;
    description: string;
    date: string;
    venue: string;
    address: string;
    imageUrl: string;
    isPublished: boolean;
    hasLottery: boolean;
  } | null>(null);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);
  const [initialTicketTypes, setInitialTicketTypes] = useState<
    { id: string; name: string; description: string; price: string; capacity: string }[]
  >([]);
  const [initialLotteryPrizes, setInitialLotteryPrizes] = useState<
    { id: string; name: string; stock: string; requireRedeem: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        const event = data.event;
        const date = new Date(event.date);
        const localDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);

        setInitialData({
          title: event.title,
          description: event.description,
          date: localDate,
          venue: event.venue,
          address: event.address || "",
          imageUrl: event.imageUrl || "",
          isPublished: event.isPublished,
          hasLottery: event.hasLottery ?? false,
        });
        setInitialTagIds(
          (event.tags || []).map((t: { id: string }) => t.id)
        );
        setInitialTicketTypes(
          (event.ticketTypes || []).map((tt: TicketTypeData) => ({
            id: tt.id,
            name: tt.name,
            description: tt.description || "",
            price: String(tt.price),
            capacity: String(tt.capacity),
          }))
        );
        setInitialLotteryPrizes(
          (event.lotteryPrizes || []).map((lp: LotteryPrizeData) => ({
            id: lp.id,
            name: lp.name,
            stock: String(lp.stock),
            requireRedeem: lp.requireRedeem,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>;
  }

  if (!initialData) {
    return <p style={{ color: "var(--error)" }}>イベントが見つかりません</p>;
  }

  return (
    <div>
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        イベント編集
      </h2>
      <AdminEventForm
        initialData={initialData}
        initialTagIds={initialTagIds}
        initialTicketTypes={initialTicketTypes}
        initialLotteryPrizes={initialLotteryPrizes}
        eventId={eventId}
      />
    </div>
  );
}
