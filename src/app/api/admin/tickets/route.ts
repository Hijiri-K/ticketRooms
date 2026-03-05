import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      payment: { status: "SUCCEEDED" },
    },
    include: {
      user: { select: { displayName: true, lineUserId: true } },
      event: { select: { title: true } },
      ticketType: { select: { name: true } },
      payment: { select: { amount: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}
