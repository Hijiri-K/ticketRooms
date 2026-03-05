"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useLiff } from "@/components/liff-provider";
import { QrCodeDisplay } from "@/components/qr-code-display";

interface LotteryPrize {
  id: string;
  name: string;
  stock: number;
  requireRedeem: boolean;
}

interface LotteryResult {
  id: string;
  prizeId: string | null;
  redeemed: boolean;
  prize: LotteryPrize | null;
}

interface Ticket {
  id: string;
  status: string;
  event: {
    title: string;
    description: string;
    date: string;
    venue: string;
    address: string | null;
    imageUrl: string | null;
    lotteryPrizes: LotteryPrize[];
  };
  ticketType: {
    name: string;
    price: number;
  };
  lotteryResults: LotteryResult[];
}

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { accessToken } = useLiff();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    fetch(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setTicket(data.ticket ?? null))
      .finally(() => setLoading(false));
  }, [accessToken, ticketId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">チケットが見つかりません</p>
      </div>
    );
  }

  const isUsed = ticket.status === "USED";

  if (isUsed) {
    return <EnteredView ticket={ticket} accessToken={accessToken!} onUpdate={setTicket} />;
  }

  return <PreEntryView ticket={ticket} />;
}

function PreEntryView({ ticket }: { ticket: Ticket }) {
  const eventDate = new Date(ticket.event.date);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          {ticket.event.title}
        </h1>

        <div className="mb-6">
          <QrCodeDisplay value={ticket.id} size={240} />
          <p className="mt-2 text-center text-xs text-gray-400">
            入場時にこのQRコードを提示してください
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">チケット種別</p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.ticketType.name}
              </p>
              <p className="text-xs text-gray-500">
                ¥{ticket.ticketType.price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">日時</p>
              <p className="text-sm font-medium text-gray-900">
                {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">会場</p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.event.venue}
              </p>
              {ticket.event.address && (
                <p className="text-xs text-gray-500">{ticket.event.address}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">ステータス</p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  ticket.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {ticket.status === "ACTIVE" ? "有効" : "キャンセル"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/tickets"
            className="text-sm text-blue-600 hover:underline"
          >
            マイチケットに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

function EnteredView({
  ticket,
  accessToken,
  onUpdate,
}: {
  ticket: Ticket;
  accessToken: string;
  onUpdate: (t: Ticket) => void;
}) {
  const eventDate = new Date(ticket.event.date);
  const hasPrizes = ticket.event.lotteryPrizes.length > 0;
  const lotteryResult = ticket.lotteryResults?.[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative">
        {ticket.event.imageUrl ? (
          <div className="aspect-[2/1] w-full overflow-hidden">
            <img
              src={ticket.event.imageUrl}
              alt={ticket.event.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[2/1] w-full bg-gradient-to-br from-blue-500 to-purple-600" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 flex gap-2">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              入場済み
            </span>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {ticket.ticketType.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">
            {ticket.event.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-5">
        {/* Event info cards */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">
              日時
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {format(eventDate, "M月d日(E)", { locale: ja })}
            </p>
            <p className="text-xs text-gray-500">
              {format(eventDate, "HH:mm", { locale: ja })}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">
              会場
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {ticket.event.venue}
            </p>
            {ticket.event.address && (
              <p className="text-xs text-gray-500 truncate">
                {ticket.event.address}
              </p>
            )}
          </div>
        </div>

        {/* Map link */}
        {ticket.event.address && (
          <a
            href={`https://maps.google.com/maps?q=${encodeURIComponent(ticket.event.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-blue-600 transition-colors hover:bg-blue-50"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            Google Maps で開く
          </a>
        )}

        {/* Description */}
        {ticket.event.description && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-xs uppercase tracking-wider text-gray-400">
              イベント詳細
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {ticket.event.description}
            </p>
          </div>
        )}

        {/* Lottery Section */}
        {hasPrizes && (
          <LotterySection
            ticket={ticket}
            lotteryResult={lotteryResult}
            accessToken={accessToken}
            onUpdate={onUpdate}
          />
        )}

        <div className="mt-6 text-center">
          <Link
            href="/tickets"
            className="text-sm text-blue-600 hover:underline"
          >
            マイチケットに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Lottery Section ──

type LotteryState = "ready" | "playing" | "result";

function LotterySection({
  ticket,
  lotteryResult: initialResult,
  accessToken,
  onUpdate,
}: {
  ticket: Ticket;
  lotteryResult: LotteryResult | null;
  accessToken: string;
  onUpdate: (t: Ticket) => void;
}) {
  const [state, setState] = useState<LotteryState>(initialResult ? "result" : "ready");
  const [result, setResult] = useState<LotteryResult | null>(initialResult);
  const [drawResult, setDrawResult] = useState<LotteryResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDraw = async () => {
    // Call API first to get the result
    const res = await fetch("/api/lottery/draw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ticketId: ticket.id }),
    });

    const data = await res.json();
    const dr: LotteryResult = data.result;
    setDrawResult(dr);

    // Open modal with video
    setState("playing");
  };

  const handleVideoEnded = useCallback(() => {
    if (!drawResult) return;
    setResult(drawResult);
    setState("result");
    onUpdate({
      ...ticket,
      lotteryResults: [drawResult],
    });
  }, [drawResult, ticket, onUpdate]);

  // Auto-play video when modal opens
  useEffect(() => {
    if (state === "playing" && videoRef.current) {
      videoRef.current.play().catch(() => {
        // If autoplay is blocked, show result immediately
        handleVideoEnded();
      });
    }
  }, [state, handleVideoEnded]);

  // Ready state: show draw button
  if (state === "ready") {
    return (
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-gray-400">
          無料抽選
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          抽選に参加して景品を当てよう！（1回限り）
        </p>
        <button
          onClick={handleDraw}
          className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          抽選する
        </button>
      </div>
    );
  }

  // Playing state: fullscreen modal with video
  if (state === "playing") {
    return (
      <>
        {/* Inline placeholder so page layout doesn't shift */}
        <div className="mb-4 rounded-xl border-2 border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50 p-4 text-center">
          <p className="text-sm font-bold text-orange-700">抽選中...</p>
        </div>

        {/* Modal overlay */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              src="/lottery-animation.mp4"
              playsInline
              muted
              onEnded={handleVideoEnded}
              className="w-full object-contain"
            />
            <button
              onClick={handleVideoEnded}
              className="absolute bottom-3 right-3 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              スキップ
            </button>
          </div>
        </div>
      </>
    );
  }

  // Result state
  const isWin = !!result?.prizeId;
  const needsRedeem = isWin && result?.prize?.requireRedeem && !result?.redeemed;

  return (
    <div
      className={`mb-4 rounded-xl border-2 p-4 ${
        isWin
          ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <h2 className="mb-3 text-xs uppercase tracking-wider text-gray-400">
        無料抽選
      </h2>

      {isWin ? (
        <div className="text-center">
          <p className="mb-1 text-2xl">🎉</p>
          <p className="mb-1 text-lg font-bold text-orange-700">おめでとう！</p>
          <p className="mb-3 text-base font-semibold text-gray-900">
            「{result!.prize!.name}」が当たりました！
          </p>

          {result!.redeemed && (
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              引き換え済み
            </span>
          )}

          {needsRedeem && (
            <p className="text-sm text-gray-600">
              スタッフにお声がけください
            </p>
          )}

          {isWin && !result!.prize!.requireRedeem && (
            <p className="text-sm text-gray-500">
              引き換え不要です。そのままお楽しみください。
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-1 text-2xl">😢</p>
          <p className="text-base font-semibold text-gray-700">
            残念！ハズレでした
          </p>
        </div>
      )}
    </div>
  );
}
