import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      tags: { select: { id: true, name: true } },
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

export async function POST(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, date, venue, address, imageUrl, isPublished, hasLottery, tagIds, ticketTypes, lotteryPrizes } = body;

  if (!title || !description || !date || !venue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!ticketTypes || ticketTypes.length === 0) {
    return NextResponse.json({ error: "At least one ticket type is required" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      venue,
      address: address || null,
      imageUrl: imageUrl || null,
      isPublished: isPublished ?? false,
      hasLottery: hasLottery ?? false,
      ...(tagIds && { tags: { connect: tagIds.map((id: string) => ({ id })) } }),
      ticketTypes: {
        create: ticketTypes.map((tt: { name: string; description?: string; price: number; capacity: number; sortOrder?: number }, i: number) => ({
          name: tt.name,
          description: tt.description || null,
          price: Number(tt.price),
          capacity: Number(tt.capacity),
          sortOrder: tt.sortOrder ?? i,
        })),
      },
      ...(lotteryPrizes && lotteryPrizes.length > 0 && {
        lotteryPrizes: {
          create: lotteryPrizes.map((lp: { name: string; stock: number; requireRedeem?: boolean; sortOrder?: number }, i: number) => ({
            name: lp.name,
            stock: Number(lp.stock),
            requireRedeem: lp.requireRedeem ?? false,
            sortOrder: lp.sortOrder ?? i,
          })),
        },
      }),
    },
    include: { ticketTypes: true, lotteryPrizes: true },
  });

  return NextResponse.json({ event }, { status: 201 });
}
