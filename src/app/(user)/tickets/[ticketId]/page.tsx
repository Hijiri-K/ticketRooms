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

  if (!ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>チケットが見つかりません</p>
      </div>
    );
  }

  const isUsed = ticket.status === "USED";

  if (isUsed) {
    return (
      <EnteredView
        ticket={ticket}
        accessToken={accessToken!}
        onUpdate={setTicket}
      />
    );
  }

  return <PreEntryView ticket={ticket} />;
}

function PreEntryView({ ticket }: { ticket: Ticket }) {
  const eventDate = new Date(ticket.event.date);

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1
          className="mb-4 text-2xl font-light tracking-tight anim-fade-up"
          style={{ color: "var(--text-primary)" }}
        >
          {ticket.event.title}
        </h1>

        <div className="mb-6 anim-fade-up" style={{ animationDelay: "60ms" }}>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <QrCodeDisplay value={ticket.id} size={240} />
            <p
              className="mt-3 text-center text-[10px] uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              入場時にこのQRコードを提示してください
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 anim-fade-up"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            animationDelay: "120ms",
          }}
        >
          <div className="space-y-3">
            <div>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                TICKET
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {ticket.ticketType.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                ¥{ticket.ticketType.price.toLocaleString()}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                DATE
              </p>
              <p
                className="text-sm font-light"
                style={{ color: "var(--text-primary)" }}
              >
                {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                VENUE
              </p>
              <p
                className="text-sm font-light"
                style={{ color: "var(--text-primary)" }}
              >
                {ticket.event.venue}
              </p>
              {ticket.event.address && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {ticket.event.address}
                </p>
              )}
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                STATUS
              </p>
              <span
                className="inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest"
                style={{
                  background:
                    ticket.status === "ACTIVE"
                      ? "var(--success-dim)"
                      : "var(--error-dim)",
                  color:
                    ticket.status === "ACTIVE"
                      ? "var(--success)"
                      : "var(--error)",
                }}
              >
                {ticket.status === "ACTIVE" ? "有効" : "キャンセル"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/tickets"
            className="text-xs tracking-wide"
            style={{ color: "var(--text-muted)" }}
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
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative">
        {ticket.event.imageUrl ? (
          <div className="aspect-[2/1] w-full overflow-hidden">
            <img
              src={ticket.event.imageUrl}
              alt={ticket.event.title}
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
            className="aspect-[2/1] w-full"
            style={{
              background: "var(--no-image-gradient)",
            }}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="mb-2 flex gap-2">
            <span
              className="inline-block rounded-sm px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest"
              style={{
                background: "var(--lottery-badge-bg)",
                border: "1px solid var(--lottery-badge-border)",
                color: "var(--accent)",
                backdropFilter: "blur(8px)",
              }}
            >
              入場済み
            </span>
            <span
              className="inline-block rounded-sm px-2.5 py-1 text-[10px] font-medium tracking-widest"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(8px)",
              }}
            >
              {ticket.ticketType.name}
            </span>
          </div>
          <h1
            className="text-2xl font-light leading-tight"
            style={{ color: "#ffffff" }}
          >
            {ticket.event.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 py-5">
        {/* Event info */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="mb-1 text-[10px] uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              DATE
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {format(eventDate, "M月d日(E)", { locale: ja })}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {format(eventDate, "HH:mm", { locale: ja })}
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="mb-1 text-[10px] uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              VENUE
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {ticket.event.venue}
            </p>
            {ticket.event.address && (
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
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
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
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
            <span className="text-xs tracking-wide">Google Maps で開く</span>
          </a>
        )}

        {/* Description */}
        {ticket.event.description && (
          <div
            className="mb-4 rounded-xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="mb-2 text-[10px] uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              ABOUT
            </h2>
            <p
              className="whitespace-pre-wrap text-sm font-light leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
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
            className="text-xs tracking-wide"
            style={{ color: "var(--text-muted)" }}
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
  const [state, setState] = useState<LotteryState>(
    initialResult ? "result" : "ready"
  );
  const [result, setResult] = useState<LotteryResult | null>(initialResult);
  const [drawResult, setDrawResult] = useState<LotteryResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDraw = async () => {
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

  useEffect(() => {
    if (state === "playing" && videoRef.current) {
      videoRef.current.play().catch(() => {
        handleVideoEnded();
      });
    }
  }, [state, handleVideoEnded]);

  // Ready state
  if (state === "ready") {
    return (
      <div
        className="mb-4 rounded-xl p-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="mb-3 text-[10px] uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          LOTTERY
        </h2>
        <p
          className="mb-4 text-sm font-light"
          style={{ color: "var(--text-secondary)" }}
        >
          抽選に参加して景品を当てよう！（1回限り）
        </p>
        <button
          onClick={handleDraw}
          className="w-full rounded-xl px-6 py-3.5 text-base font-medium tracking-wide transition-all duration-200 active:scale-[0.97]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent) 0%, #d4b87a 100%)",
            color: "var(--btn-on-accent)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        >
          抽選する
        </button>
      </div>
    );
  }

  // Playing state
  if (state === "playing") {
    return (
      <>
        <div
          className="mb-4 rounded-xl p-4 text-center"
          style={{
            background: "var(--accent-glow)",
            border: "1px solid rgba(201,169,110,0.3)",
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            抽選中...
          </p>
        </div>

        {/* Modal overlay */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl anim-scale-in"
            style={{ background: "#000" }}
          >
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
              className="absolute bottom-3 right-3 rounded-full px-4 py-2 text-xs tracking-wide transition-colors"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "var(--text-secondary)",
                backdropFilter: "blur(8px)",
              }}
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
  const needsRedeem =
    isWin && result?.prize?.requireRedeem && !result?.redeemed;

  return (
    <div
      className="mb-4 rounded-xl p-4"
      style={{
        background: isWin ? "var(--accent-glow)" : "var(--bg-surface)",
        border: `1px solid ${isWin ? "rgba(201,169,110,0.3)" : "var(--border)"}`,
      }}
    >
      <h2
        className="mb-3 text-[10px] uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        LOTTERY
      </h2>

      {isWin ? (
        <div className="text-center">
          <p className="mb-1 text-2xl">🎉</p>
          <p
            className="mb-1 text-lg font-medium"
            style={{ color: "var(--accent)" }}
          >
            おめでとう！
          </p>
          <p
            className="mb-3 text-base font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            「{result!.prize!.name}」が当たりました！
          </p>

          {result!.redeemed && (
            <span
              className="inline-block rounded-sm px-3 py-1 text-[10px] font-medium uppercase tracking-widest"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "var(--text-muted)",
              }}
            >
              引き換え済み
            </span>
          )}

          {needsRedeem && (
            <p
              className="text-sm font-light"
              style={{ color: "var(--text-secondary)" }}
            >
              スタッフにお声がけください
            </p>
          )}

          {isWin && !result!.prize!.requireRedeem && (
            <p
              className="text-sm font-light"
              style={{ color: "var(--text-muted)" }}
            >
              引き換え不要です。そのままお楽しみください。
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-1 text-2xl">😢</p>
          <p
            className="text-base font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            残念！ハズレでした
          </p>
        </div>
      )}
    </div>
  );
}
