"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

interface TicketPurchaser {
  id: string;
  status: string;
  createdAt: string;
  user: { displayName: string | null; lineUserId: string };
  ticketType: { name: string };
  payment: { amount: number; createdAt: string } | null;
}

interface LotteryPrize {
  id: string;
  name: string;
  stock: number;
  requireRedeem: boolean;
  _count: { results: number };
}

interface LotteryResultItem {
  id: string;
  redeemed: boolean;
  createdAt: string;
  user: { displayName: string | null };
  prize: { id: string; name: string; requireRedeem: boolean } | null;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  address: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  tags: { id: string; name: string }[];
  ticketTypes: TicketType[];
  tickets: TicketPurchaser[];
  lotteryPrizes: LotteryPrize[];
  lotteryResults: LotteryResultItem[];
}

type ScanResult =
  | { type: "success"; ticket: { id: string; user: { displayName: string | null }; ticketType: { name: string } } }
  | { type: "error"; message: string; ticket?: { id: string; user: { displayName: string | null }; ticketType: { name: string } } };

const statusLabels: Record<string, { label: string; css: { background: string; color: string } }> = {
  ACTIVE: { label: "有効", css: { background: "var(--success-dim)", color: "var(--success)" } },
  USED: { label: "入場済", css: { background: "var(--accent-glow)", color: "var(--accent)" } },
  CANCELLED: { label: "キャンセル", css: { background: "var(--error-dim)", color: "var(--error)" } },
};

function StatusIcon({ type }: { type: "success" | "error" }) {
  if (type === "success") {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "var(--success-dim)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: "var(--error-dim)" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

export default function AdminEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // QR scanner state
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvent = useCallback(() => {
    fetch(`/api/admin/events/${eventId}?includeTickets=true&includeLottery=true`)
      .then((res) => res.json())
      .then((data) => setEvent(data.event ?? null))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const verifyTicket = useCallback(
    async (ticketId: string) => {
      try {
        const res = await fetch("/api/admin/tickets/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
        const data = await res.json();
        if (data.valid) {
          setScanResult({ type: "success", ticket: data.ticket });
          fetchEvent();
        } else {
          setScanResult({ type: "error", message: data.error, ticket: data.ticket });
        }
      } catch {
        setScanResult({ type: "error", message: "通信エラーが発生しました" });
      }
    },
    [fetchEvent]
  );

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader-detail");
    html5QrCodeRef.current = scanner;
    setScanning(true);
    setScanResult(null);

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText: string) => {
        await scanner.stop();
        setScanning(false);
        await verifyTicket(decodedText);
      },
      () => {}
    );
  }, [verifyTicket]);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // ignore
      }
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await verifyTicket(manualCode.trim());
    setManualCode("");
  };

  const handleMarkUsed = async (ticketId: string) => {
    try {
      const res = await fetch("/api/admin/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (data.valid) {
        fetchEvent();
      } else {
        alert(data.error || "入場処理に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm(`「${event.title}」を削除しますか？`)) return;
    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/events");
  };

  const handleRedeem = async (resultId: string) => {
    try {
      const res = await fetch("/api/admin/lottery/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });
      if (res.ok) {
        fetchEvent();
      } else {
        const data = await res.json();
        alert(data.error || "引き換えに失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  if (loading) {
    return <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>;
  }

  if (!event) {
    return <p style={{ color: "var(--error)" }}>イベントが見つかりません</p>;
  }

  const eventDate = new Date(event.date);
  const totalCapacity = event.ticketTypes.reduce((s, tt) => s + tt.capacity, 0);
  const totalSold = event.ticketTypes.reduce((s, tt) => s + tt.soldCount, 0);
  const filteredTickets = searchQuery
    ? event.tickets.filter((t) =>
        (t.user.displayName || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : event.tickets;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/events"
              className="text-sm hover:underline"
              style={{ color: "var(--admin-muted)" }}
            >
              イベント管理
            </Link>
            <span style={{ color: "var(--admin-border)" }}>/</span>
          </div>
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{ color: "var(--admin-text)" }}
          >
            {event.title}
          </h2>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/admin/events/${eventId}/edit`}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
            style={{
              background: "var(--admin-accent)",
              color: "var(--admin-surface)",
            }}
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
            style={{
              background: "var(--error)",
              color: "#fff",
            }}
          >
            削除
          </button>
        </div>
      </div>

      {/* Event info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info card */}
          <div
            className="rounded-lg p-5"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: event.isPublished ? "var(--success-dim)" : "var(--admin-bg)",
                  color: event.isPublished ? "var(--success)" : "var(--admin-muted)",
                }}
              >
                {event.isPublished ? "公開" : "非公開"}
              </span>
              {event.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p
                  className="text-[10px] uppercase tracking-widest font-medium mb-1"
                  style={{ color: "var(--admin-muted)" }}
                >
                  日時
                </p>
                <p className="font-medium" style={{ color: "var(--admin-text)" }}>
                  {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] uppercase tracking-widest font-medium mb-1"
                  style={{ color: "var(--admin-muted)" }}
                >
                  会場
                </p>
                <p className="font-medium" style={{ color: "var(--admin-text)" }}>{event.venue}</p>
                {event.address && (
                  <p className="text-xs" style={{ color: "var(--admin-muted)" }}>{event.address}</p>
                )}
              </div>
            </div>
            {event.description && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
                <p
                  className="text-[10px] uppercase tracking-widest font-medium mb-1"
                  style={{ color: "var(--admin-muted)" }}
                >
                  説明
                </p>
                <p className="text-sm whitespace-pre-wrap line-clamp-3" style={{ color: "var(--admin-text)" }}>
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Ticket types card */}
          <div
            className="rounded-lg p-5"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <h3
              className="text-[10px] uppercase tracking-widest font-medium mb-3"
              style={{ color: "var(--admin-muted)" }}
            >
              チケット種別
            </h3>
            <div className="space-y-2">
              {event.ticketTypes.map((tt) => (
                <div
                  key={tt.id}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{ border: "1px solid var(--admin-border)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                      {tt.name}
                    </p>
                    {tt.description && (
                      <p className="text-xs" style={{ color: "var(--admin-muted)" }}>{tt.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>
                      ¥{tt.price.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                      {tt.soldCount}/{tt.capacity}枚
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div
            className="rounded-lg p-5"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <h3
              className="text-[10px] uppercase tracking-widest font-medium mb-3"
              style={{ color: "var(--admin-muted)" }}
            >
              販売状況
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span style={{ color: "var(--admin-muted)" }}>販売数</span>
                  <span className="font-bold" style={{ color: "var(--admin-text)" }}>
                    {totalSold}/{totalCapacity}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--admin-bg)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0}%`,
                      background: "var(--admin-text)",
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--admin-muted)" }}>売上</span>
                <span className="font-bold" style={{ color: "var(--admin-text)" }}>
                  ¥
                  {event.tickets
                    .reduce((s, t) => s + (t.payment?.amount ?? 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--admin-muted)" }}>入場済</span>
                <span className="font-bold" style={{ color: "var(--admin-text)" }}>
                  {event.tickets.filter((t) => t.status === "USED").length}/
                  {event.tickets.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner section */}
      <div className="mb-8">
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: "var(--admin-text)" }}
        >
          入場受付（QRスキャン）
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div
              id="qr-reader-detail"
              ref={scannerRef}
              className="mb-4 overflow-hidden rounded-lg"
              style={{ minHeight: scanning ? "300px" : "0" }}
            />
            <div className="flex gap-2 mb-4">
              {!scanning ? (
                <button
                  onClick={startScanner}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    background: "var(--admin-accent)",
                    color: "var(--admin-surface)",
                  }}
                >
                  カメラでスキャン
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    background: "var(--admin-muted)",
                    color: "var(--admin-surface)",
                  }}
                >
                  スキャン停止
                </button>
              )}
            </div>
            <div className="pt-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
              <p
                className="text-[10px] uppercase tracking-widest font-medium mb-2"
                style={{ color: "var(--admin-muted)" }}
              >
                手動でチケットIDを入力
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="チケットIDを入力"
                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--admin-bg)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    background: "var(--admin-accent)",
                    color: "var(--admin-surface)",
                  }}
                >
                  確認
                </button>
              </form>
            </div>
          </div>

          <div>
            {scanResult && (
              <div
                className="rounded-lg p-6"
                style={{
                  background: scanResult.type === "success" ? "var(--success-dim)" : "var(--error-dim)",
                  border: `1px solid ${scanResult.type === "success" ? "var(--success)" : "var(--error)"}`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <StatusIcon type={scanResult.type} />
                  <h4
                    className="text-lg font-bold"
                    style={{
                      color: scanResult.type === "success" ? "var(--success)" : "var(--error)",
                    }}
                  >
                    {scanResult.type === "success"
                      ? "入場を受け付けました"
                      : "入場不可"}
                  </h4>
                </div>
                {scanResult.type === "error" && (
                  <p className="mb-4" style={{ color: "var(--error)" }}>{scanResult.message}</p>
                )}
                {scanResult.ticket && (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span style={{ color: "var(--admin-muted)" }}>ユーザー: </span>
                      <span className="font-medium" style={{ color: "var(--admin-text)" }}>
                        {scanResult.ticket.user.displayName || "未設定"}
                      </span>
                    </p>
                    <p>
                      <span style={{ color: "var(--admin-muted)" }}>種別: </span>
                      <span className="font-medium" style={{ color: "var(--admin-text)" }}>
                        {scanResult.ticket.ticketType.name}
                      </span>
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setScanResult(null);
                    startScanner();
                  }}
                  className="mt-4 px-4 py-2 rounded-lg text-sm transition-all active:scale-[0.97]"
                  style={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                >
                  次のスキャン
                </button>
              </div>
            )}
            {!scanResult && !scanning && (
              <div
                className="rounded-lg p-6 text-center"
                style={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-muted)",
                }}
              >
                <p>カメラでQRコードをスキャンするか、</p>
                <p>チケットIDを手動入力してください</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lottery Results */}
      {event.lotteryPrizes.length > 0 && (
        <div className="mb-8">
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: "var(--admin-text)" }}
          >
            抽選結果
          </h3>

          {/* Prize stock summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {event.lotteryPrizes.map((prize) => (
              <div
                key={prize.id}
                className="rounded-lg p-4"
                style={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{prize.name}</p>
                  {prize.requireRedeem && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
                    >
                      引換要
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
                  当選 {prize._count.results}/{prize.stock}
                </p>
                <div
                  className="mt-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--admin-bg)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${prize.stock > 0 ? (prize._count.results / prize.stock) * 100 : 0}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Results table */}
          {event.lotteryResults.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {event.lotteryResults.map((lr) => (
                  <div
                    key={lr.id}
                    className="rounded-lg p-4"
                    style={{
                      background: "var(--admin-surface)",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                        {lr.user.displayName || "未設定"}
                      </p>
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: lr.prize ? "var(--accent-glow)" : "var(--admin-bg)",
                          color: lr.prize ? "var(--accent)" : "var(--admin-muted)",
                        }}
                      >
                        {lr.prize ? lr.prize.name : "ハズレ"}
                      </span>
                    </div>
                    {lr.prize?.requireRedeem && (
                      <div className="mt-2">
                        {lr.redeemed ? (
                          <span className="text-xs" style={{ color: "var(--admin-muted)" }}>引き換え済み</span>
                        ) : (
                          <button
                            onClick={() => handleRedeem(lr.id)}
                            className="px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                            style={{ background: "var(--warning)", color: "#fff" }}
                          >
                            引き換え
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

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
                      <th className="px-4 py-3">ユーザー</th>
                      <th className="px-4 py-3">結果</th>
                      <th className="px-4 py-3">引き換え</th>
                      <th className="px-4 py-3">抽選日時</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.lotteryResults.map((lr) => (
                      <tr
                        key={lr.id}
                        className="text-sm transition-colors"
                        style={{ borderBottom: "1px solid var(--admin-border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--admin-bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--admin-text)" }}>
                          {lr.user.displayName || "未設定"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: lr.prize ? "var(--accent-glow)" : "var(--admin-bg)",
                              color: lr.prize ? "var(--accent)" : "var(--admin-muted)",
                            }}
                          >
                            {lr.prize ? lr.prize.name : "ハズレ"}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                          {lr.prize?.requireRedeem
                            ? lr.redeemed
                              ? "済"
                              : "未"
                            : "-"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                          {format(
                            new Date(lr.createdAt),
                            "MM/dd HH:mm",
                            { locale: ja }
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lr.prize?.requireRedeem && !lr.redeemed && (
                            <button
                              onClick={() => handleRedeem(lr.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                              style={{ background: "var(--warning)", color: "#fff" }}
                            >
                              引き換え
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div
              className="rounded-lg p-4"
              style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <p style={{ color: "var(--admin-muted)" }}>まだ抽選結果はありません</p>
            </div>
          )}
        </div>
      )}

      {/* Purchasers list */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
            購入者一覧
            <span className="ml-2 text-sm font-normal" style={{ color: "var(--admin-muted)" }}>
              ({filteredTickets.length}/{event.tickets.length}件)
            </span>
          </h3>
          {event.tickets.length > 0 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前で検索..."
              className="w-full sm:w-64 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
              }}
            />
          )}
        </div>

        {event.tickets.length === 0 ? (
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <p style={{ color: "var(--admin-muted)" }}>購入者はまだいません</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <p style={{ color: "var(--admin-muted)" }}>「{searchQuery}」に一致する購入者はいません</p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {filteredTickets.map((ticket) => {
                const status = statusLabels[ticket.status] || {
                  label: ticket.status,
                  css: { background: "var(--admin-bg)", color: "var(--admin-muted)" },
                };
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
                      <p>{ticket.ticketType.name}</p>
                      <p>
                        ¥{ticket.payment?.amount.toLocaleString()}{" "}
                        {ticket.payment &&
                          format(
                            new Date(ticket.payment.createdAt),
                            "yyyy/MM/dd HH:mm",
                            { locale: ja }
                          )}
                      </p>
                    </div>
                    {ticket.status === "ACTIVE" && (
                      <button
                        onClick={() => handleMarkUsed(ticket.id)}
                        className="mt-2 px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                        style={{ background: "var(--success)", color: "#fff" }}
                      >
                        入場済みにする
                      </button>
                    )}
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
                    <th className="px-4 py-3">ユーザー</th>
                    <th className="px-4 py-3">チケット種別</th>
                    <th className="px-4 py-3">金額</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3">購入日</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const status = statusLabels[ticket.status] || {
                      label: ticket.status,
                      css: { background: "var(--admin-bg)", color: "var(--admin-muted)" },
                    };
                    return (
                      <tr
                        key={ticket.id}
                        className="text-sm transition-colors"
                        style={{ borderBottom: "1px solid var(--admin-border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--admin-bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--admin-text)" }}>
                          {ticket.user.displayName || "未設定"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                          {ticket.ticketType.name}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>
                          ¥{ticket.payment?.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={status.css}
                          >
                            {status.label}
                          </span>
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
                        <td className="px-4 py-3">
                          {ticket.status === "ACTIVE" && (
                            <button
                              onClick={() => handleMarkUsed(ticket.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                              style={{ background: "var(--success)", color: "#fff" }}
                            >
                              入場済みにする
                            </button>
                          )}
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
    </div>
  );
}
