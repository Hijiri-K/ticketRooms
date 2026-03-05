import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { resultId } = body;

  if (!resultId) {
    return NextResponse.json({ error: "resultId is required" }, { status: 400 });
  }

  const result = await prisma.lotteryResult.findUnique({
    where: { id: resultId },
    include: { prize: true },
  });

  if (!result) {
    return NextResponse.json({ error: "抽選結果が見つかりません" }, { status: 404 });
  }

  if (!result.prizeId) {
    return NextResponse.json({ error: "ハズレのため引き換えできません" }, { status: 400 });
  }

  if (!result.prize?.requireRedeem) {
    return NextResponse.json({ error: "引き換え不要の景品です" }, { status: 400 });
  }

  if (result.redeemed) {
    return NextResponse.json({ error: "既に引き換え済みです" }, { status: 400 });
  }

  const updated = await prisma.lotteryResult.update({
    where: { id: resultId },
    data: { redeemed: true },
    include: { prize: true, user: true },
  });

  return NextResponse.json({ result: updated });
}
