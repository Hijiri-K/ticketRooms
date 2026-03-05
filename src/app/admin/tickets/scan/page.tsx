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
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        QRコードスキャン（入場受付）
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
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
        </div>

        <div>
          {result && (
            <div
              className="rounded-lg p-6"
              style={{
                background: result.type === "success" ? "var(--success-dim)" : "var(--error-dim)",
                border: `1px solid ${result.type === "success" ? "var(--success)" : "var(--error)"}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon type={result.type} />
                <h3
                  className="text-lg font-bold"
                  style={{
                    color: result.type === "success" ? "var(--success)" : "var(--error)",
                  }}
                >
                  {result.type === "success"
                    ? "入場を受け付けました"
                    : "入場不可"}
                </h3>
              </div>

              {result.type === "error" && (
                <p className="mb-4" style={{ color: "var(--error)" }}>{result.message}</p>
              )}

              {result.ticket && (
                <div className="space-y-2 text-sm">
                  <p>
                    <span style={{ color: "var(--admin-muted)" }}>ユーザー: </span>
                    <span className="font-medium" style={{ color: "var(--admin-text)" }}>
                      {result.ticket.user.displayName || "未設定"}
                    </span>
                  </p>
                  <p>
                    <span style={{ color: "var(--admin-muted)" }}>イベント: </span>
                    <span className="font-medium" style={{ color: "var(--admin-text)" }}>
                      {result.ticket.event.title}
                    </span>
                  </p>
                  <p>
                    <span style={{ color: "var(--admin-muted)" }}>種別: </span>
                    <span className="font-medium" style={{ color: "var(--admin-text)" }}>
                      {result.ticket.ticketType.name}
                    </span>
                  </p>
                  <p>
                    <span style={{ color: "var(--admin-muted)" }}>日時: </span>
                    <span style={{ color: "var(--admin-text)" }}>
                      {format(
                        new Date(result.ticket.event.date),
                        "yyyy/MM/dd HH:mm",
                        { locale: ja }
                      )}
                    </span>
                  </p>
                  <p>
                    <span style={{ color: "var(--admin-muted)" }}>会場: </span>
                    <span style={{ color: "var(--admin-text)" }}>
                      {result.ticket.event.venue}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setResult(null);
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

          {!result && !scanning && (
            <div
              className="rounded-lg p-6 text-center"
              style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-muted)",
              }}
            >
              <p>カメラでQRコードをスキャンするか、</p>
              <p>QRコードの値を手動で入力してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
