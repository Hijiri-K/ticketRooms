import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ticketId } = body;

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
  }

  // チケット取得＋入場済み確認
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, userId: user.id },
    include: { event: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "チケットが見つかりません" }, { status: 404 });
  }

  if (ticket.status !== "USED") {
    return NextResponse.json({ error: "入場済みのチケットのみ抽選できます" }, { status: 400 });
  }

  // トランザクションで排他制御
  const result = await prisma.$transaction(async (tx) => {
    // 既に抽選済みか確認
    const existing = await tx.lotteryResult.findUnique({
      where: { eventId_userId: { eventId: ticket.eventId, userId: user.id } },
      include: { prize: true },
    });

    if (existing) {
      return { alreadyDrawn: true as const, result: existing };
    }

    // チケット購入者数（入場済み＝抽選対象者数）を取得
    const totalParticipants = await tx.ticket.count({
      where: {
        eventId: ticket.eventId,
        status: "USED",
        payment: { status: "SUCCEEDED" },
      },
    });

    // 既に抽選済みの人数
    const alreadyDrawnCount = await tx.lotteryResult.count({
      where: { eventId: ticket.eventId },
    });

    // 残りの抽選者数（自分を含む）
    const remainingDrawers = totalParticipants - alreadyDrawnCount;

    // 景品と当選済み数を取得
    const prizes = await tx.lotteryPrize.findMany({
      where: { eventId: ticket.eventId },
      include: { _count: { select: { results: true } } },
      orderBy: { sortOrder: "asc" },
    });

    if (prizes.length === 0) {
      return { error: "このイベントに抽選はありません" };
    }

    // 在庫のある景品を計算
    const availablePrizes = prizes
      .map((p) => ({ ...p, remaining: p.stock - p._count.results }))
      .filter((p) => p.remaining > 0);

    // 残り景品総数
    const totalRemainingPrizes = availablePrizes.reduce((sum, p) => sum + p.remaining, 0);

    // 排出率計算:
    // 残りの抽選者数で景品をちょうど配り切るように当選確率を設定
    // 当選確率 = 残り景品総数 / 残り抽選者数
    // 各景品の当選確率 = (その景品の残在庫 / 残り景品総数) * 当選確率
    let selectedPrizeId: string | null = null;

    if (totalRemainingPrizes > 0 && remainingDrawers > 0) {
      // 当選確率（1.0を超えないようにキャップ）
      const winRate = Math.min(totalRemainingPrizes / remainingDrawers, 1.0);
      const rand = Math.random();

      if (rand < winRate) {
        // 当選 → どの景品かを残在庫の重みで選択
        const prizeRand = Math.random() * totalRemainingPrizes;
        let cumulative = 0;
        for (const prize of availablePrizes) {
          cumulative += prize.remaining;
          if (prizeRand < cumulative) {
            selectedPrizeId = prize.id;
            break;
          }
        }
      }
      // rand >= winRate → ハズレ
    }

    // 結果作成
    const lotteryResult = await tx.lotteryResult.create({
      data: {
        eventId: ticket.eventId,
        userId: user.id,
        ticketId: ticket.id,
        prizeId: selectedPrizeId,
      },
      include: { prize: true },
    });

    return { alreadyDrawn: false as const, result: lotteryResult };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (result.alreadyDrawn) {
    return NextResponse.json({ error: "already_drawn", result: result.result });
  }

  return NextResponse.json({ result: result.result });
}
