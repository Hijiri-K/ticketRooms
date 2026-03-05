import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const result = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTypes: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              tickets: { where: { payment: { status: "SUCCEEDED" } } },
            },
          },
        },
      },
    },
  });

  if (!result) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const ticketTypes = result.ticketTypes.map(({ _count, ...tt }) => ({
    ...tt,
    soldCount: _count.tickets,
  }));

  const { ticketTypes: _, ...event } = result;
  return NextResponse.json({ event: { ...event, ticketTypes } });
}
