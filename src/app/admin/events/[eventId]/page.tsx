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

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "有効", color: "bg-green-100 text-green-700" },
  USED: { label: "入場済", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "キャンセル", color: "bg-red-100 text-red-700" },
};

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
    return <p className="text-gray-500">読み込み中...</p>;
  }

  if (!event) {
    return <p className="text-red-600">イベントが見つかりません</p>;
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
            <Link href="/admin/events" className="text-sm text-gray-500 hover:text-gray-700">
              イベント管理
            </Link>
            <span className="text-gray-300">/</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {event.title}
          </h2>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/admin/events/${eventId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            削除
          </button>
        </div>
      </div>

      {/* Event info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.isPublished
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {event.isPublished ? "公開" : "非公開"}
              </span>
              {event.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">日時</p>
                <p className="font-medium text-gray-900">
                  {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">会場</p>
                <p className="font-medium text-gray-900">{event.venue}</p>
                {event.address && (
                  <p className="text-xs text-gray-500">{event.address}</p>
                )}
              </div>
            </div>
            {event.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">説明</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Ticket types card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              チケット種別
            </h3>
            <div className="space-y-2">
              {event.ticketTypes.map((tt) => (
                <div
                  key={tt.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tt.name}
                    </p>
                    {tt.description && (
                      <p className="text-xs text-gray-500">{tt.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ¥{tt.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
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
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              販売状況
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">販売数</span>
                  <span className="font-bold text-gray-900">
                    {totalSold}/{totalCapacity}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">売上</span>
                <span className="font-bold text-gray-900">
                  ¥
                  {event.tickets
                    .reduce((s, t) => s + (t.payment?.amount ?? 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">入場済</span>
                <span className="font-bold text-gray-900">
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          入場受付（QRスキャン）
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  カメラでスキャン
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  スキャン停止
                </button>
              )}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">手動でチケットIDを入力</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="チケットIDを入力"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  確認
                </button>
              </form>
            </div>
          </div>

          <div>
            {scanResult && (
              <div
                className={`rounded-lg border p-6 ${
                  scanResult.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">
                    {scanResult.type === "success" ? "✅" : "❌"}
                  </span>
                  <h4
                    className={`text-lg font-bold ${
                      scanResult.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {scanResult.type === "success"
                      ? "入場を受け付けました"
                      : "入場不可"}
                  </h4>
                </div>
                {scanResult.type === "error" && (
                  <p className="text-red-700 mb-4">{scanResult.message}</p>
                )}
                {scanResult.ticket && (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">ユーザー: </span>
                      <span className="font-medium">
                        {scanResult.ticket.user.displayName || "未設定"}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">種別: </span>
                      <span className="font-medium">
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
                  className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  次のスキャン
                </button>
              </div>
            )}
            {!scanResult && !scanning && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            抽選結果
          </h3>

          {/* Prize stock summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {event.lotteryPrizes.map((prize) => (
              <div
                key={prize.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{prize.name}</p>
                  {prize.requireRedeem && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">
                      引換要
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  当選 {prize._count.results}/{prize.stock}
                </p>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all"
                    style={{
                      width: `${prize.stock > 0 ? (prize._count.results / prize.stock) * 100 : 0}%`,
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
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {lr.user.displayName || "未設定"}
                      </p>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                          lr.prize
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {lr.prize ? lr.prize.name : "ハズレ"}
                      </span>
                    </div>
                    {lr.prize?.requireRedeem && (
                      <div className="mt-2">
                        {lr.redeemed ? (
                          <span className="text-xs text-gray-500">引き換え済み</span>
                        ) : (
                          <button
                            onClick={() => handleRedeem(lr.id)}
                            className="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700"
                          >
                            引き換え
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
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
                        className="border-b border-gray-50 text-sm hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {lr.user.displayName || "未設定"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lr.prize
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {lr.prize ? lr.prize.name : "ハズレ"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {lr.prize?.requireRedeem
                            ? lr.redeemed
                              ? "済"
                              : "未"
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
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
                              className="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700"
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-gray-500">まだ抽選結果はありません</p>
            </div>
          )}
        </div>
      )}

      {/* Purchasers list */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            購入者一覧
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredTickets.length}/{event.tickets.length}件)
            </span>
          </h3>
          {event.tickets.length > 0 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前で検索..."
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {event.tickets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-500">購入者はまだいません</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-500">「{searchQuery}」に一致する購入者はいません</p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {filteredTickets.map((ticket) => {
                const status = statusLabels[ticket.status] || {
                  label: ticket.status,
                  color: "bg-gray-100 text-gray-600",
                };
                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-gray-900 text-sm">
                        {ticket.user.displayName || "未設定"}
                      </p>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
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
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                      >
                        入場済みにする
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
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
                      color: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-50 text-sm hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {ticket.user.displayName || "未設定"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {ticket.ticketType.name}
                        </td>
                        <td className="px-4 py-3">
                          ¥{ticket.payment?.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
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
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
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
