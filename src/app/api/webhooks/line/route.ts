import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendPushMessage } from "@/lib/line-messaging";

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const { events } = JSON.parse(body);

  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    if (event.type === "follow") {
      await prisma.user.upsert({
        where: { lineUserId },
        update: { isFriend: true },
        create: { lineUserId, isFriend: true },
      });

      await sendPushMessage(
        lineUserId,
        "友だち追加ありがとうございます！\nイベント情報やチケット購入はアプリからどうぞ。"
      );
    }

    if (event.type === "unfollow") {
      await prisma.user.updateMany({
        where: { lineUserId },
        data: { isFriend: false },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
