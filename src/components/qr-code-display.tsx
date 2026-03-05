"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
}

export function QrCodeDisplay({ value, size = 200 }: QrCodeDisplayProps) {
  return (
    <div className="flex justify-center rounded-xl bg-white p-4">
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
