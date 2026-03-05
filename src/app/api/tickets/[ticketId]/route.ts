import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, userId: user.id },
    include: {
      event: { include: { lotteryPrizes: { orderBy: { sortOrder: "asc" } } } },
      ticketType: true,
      lotteryResults: { where: { userId: user.id }, include: { prize: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}
