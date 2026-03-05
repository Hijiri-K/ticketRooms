import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("tagId");

  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      ...(tagId && { tags: { some: { id: tagId } } }),
    },
    orderBy: { date: "asc" },
    include: {
      tags: { select: { id: true, name: true, imageUrl: true } },
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

  const eventsWithStats = events.map((event) => {
    const ticketTypes = event.ticketTypes.map(({ _count, ...tt }) => ({
      ...tt,
      soldCount: _count.tickets,
    }));
    const totalCapacity = ticketTypes.reduce((sum, tt) => sum + tt.capacity, 0);
    const totalSold = ticketTypes.reduce((sum, tt) => sum + tt.soldCount, 0);
    const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map((tt) => tt.price)) : 0;
    return { ...event, ticketTypes, totalCapacity, totalSold, minPrice };
  });

  return NextResponse.json({ events: eventsWithStats });
}
