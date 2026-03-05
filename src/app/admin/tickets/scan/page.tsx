"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TicketInfo {
  id: string;
  user: { displayName: string | null };
  event: { title: string; date: string; venue: string };
  ticketType: { name: string };
}

type ScanResult =
  | { type: "success"; ticket: TicketInfo }
  | { type: "error"; message: string; ticket?: TicketInfo };

export default function AdminTicketScanPage() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const verifyTicket = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch("/api/admin/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();

      if (data.valid) {
        setResult({ type: "success", ticket: data.ticket });
      } else {
        setResult({
          type: "error",
          message: data.error,
          ticket: data.ticket,
        });
      }
    } catch {
      setResult({ type: "error", message: "通信エラーが発生しました" });
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;
    setScanning(true);
    setResult(null);

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        QRコードスキャン（入場受付）
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div
              id="qr-reader"
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
              <p className="text-sm text-gray-600 mb-2">
                手動でチケットIDを入力
              </p>
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
        </div>

        <div>
          {result && (
            <div
              className={`rounded-lg border p-6 ${
                result.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  {result.type === "success" ? "✅" : "❌"}
                </span>
                <h3
                  className={`text-lg font-bold ${
                    result.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {result.type === "success"
                    ? "入場を受け付けました"
                    : "入場不可"}
                </h3>
              </div>

              {result.type === "error" && (
                <p className="text-red-700 mb-4">{result.message}</p>
              )}

              {result.ticket && (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">ユーザー: </span>
                    <span className="font-medium">
                      {result.ticket.user.displayName || "未設定"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">イベント: </span>
                    <span className="font-medium">
                      {result.ticket.event.title}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">種別: </span>
                    <span className="font-medium">
                      {result.ticket.ticketType.name}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">日時: </span>
                    {format(
                      new Date(result.ticket.event.date),
                      "yyyy/MM/dd HH:mm",
                      { locale: ja }
                    )}
                  </p>
                  <p>
                    <span className="text-gray-600">会場: </span>
                    {result.ticket.event.venue}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setResult(null);
                  startScanner();
                }}
                className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                次のスキャン
              </button>
            </div>
          )}

          {!result && !scanning && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
              <p>カメラでQRコードをスキャンするか、</p>
              <p>QRコードの値を手動で入力してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
