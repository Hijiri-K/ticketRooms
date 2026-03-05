import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId } = await request.json();

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { displayName: true } },
      event: { select: { title: true, date: true, venue: true } },
      ticketType: { select: { name: true } },
      payment: { select: { status: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "チケットが見つかりません", valid: false },
      { status: 404 }
    );
  }

  if (ticket.payment?.status !== "SUCCEEDED") {
    return NextResponse.json(
      { error: "未決済のチケットです", valid: false, ticket },
      { status: 400 }
    );
  }

  if (ticket.status === "USED") {
    return NextResponse.json(
      { error: "使用済みのチケットです", valid: false, ticket },
      { status: 400 }
    );
  }

  if (ticket.status === "CANCELLED" || ticket.status === "EXPIRED") {
    return NextResponse.json(
      { error: `チケットは${ticket.status === "CANCELLED" ? "キャンセル済み" : "有効期限切れ"}です`, valid: false, ticket },
      { status: 400 }
    );
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "USED" },
    include: {
      user: { select: { displayName: true } },
      event: { select: { title: true, date: true, venue: true } },
      ticketType: { select: { name: true } },
    },
  });

  return NextResponse.json({ valid: true, ticket: updatedTicket });
}
