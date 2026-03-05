import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const includeTickets = searchParams.get("includeTickets") === "true";
  const includeLottery = searchParams.get("includeLottery") === "true";

  const event = await prisma.event.findUnique({
    where: { id: eventId },
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
      lotteryPrizes: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { results: true } },
          ...(includeLottery && {
            results: {
              where: { prizeId: { not: null } },
            },
          }),
        },
      },
      ...(includeTickets && {
        tickets: {
          where: { payment: { status: "SUCCEEDED" } },
          include: {
            user: { select: { displayName: true, lineUserId: true } },
            ticketType: { select: { name: true } },
            payment: { select: { amount: true, createdAt: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      }),
      ...(includeLottery && {
        lotteryResults: {
          include: {
            user: { select: { displayName: true } },
            prize: { select: { name: true, requireRedeem: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      }),
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ticketTypes = event.ticketTypes.map(({ _count, ...tt }) => ({
    ...tt,
    soldCount: _count.tickets,
  }));

  return NextResponse.json({ event: { ...event, ticketTypes } });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const body = await request.json();
  const { title, description, date, venue, address, imageUrl, isPublished, hasLottery, tagIds, ticketTypes, lotteryPrizes } = body;

  // Update event fields
  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      date: date ? new Date(date) : undefined,
      venue,
      address: address ?? undefined,
      imageUrl: imageUrl ?? undefined,
      isPublished: isPublished ?? undefined,
      hasLottery: hasLottery ?? undefined,
      ...(tagIds && { tags: { set: tagIds.map((id: string) => ({ id })) } }),
    },
  });

  // Update ticket types if provided
  if (ticketTypes) {
    const existingTypes = await prisma.ticketType.findMany({
      where: { eventId },
    });
    const existingIds = existingTypes.map((t) => t.id);
    const incomingIds = ticketTypes
      .filter((tt: { id?: string }) => tt.id)
      .map((tt: { id: string }) => tt.id);

    // Delete removed types (only if no tickets sold)
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
    for (const id of toDelete) {
      const hasSoldTickets = await prisma.ticket.count({
        where: { ticketTypeId: id, payment: { status: "SUCCEEDED" } },
      });
      if (hasSoldTickets === 0) {
        await prisma.ticketType.delete({ where: { id } });
      }
    }

    // Upsert ticket types
    for (let i = 0; i < ticketTypes.length; i++) {
      const tt = ticketTypes[i];
      if (tt.id && existingIds.includes(tt.id)) {
        await prisma.ticketType.update({
          where: { id: tt.id },
          data: {
            name: tt.name,
            description: tt.description || null,
            price: Number(tt.price),
            capacity: Number(tt.capacity),
            sortOrder: tt.sortOrder ?? i,
          },
        });
      } else {
        await prisma.ticketType.create({
          data: {
            eventId,
            name: tt.name,
            description: tt.description || null,
            price: Number(tt.price),
            capacity: Number(tt.capacity),
            sortOrder: tt.sortOrder ?? i,
          },
        });
      }
    }
  }

  // Update lottery prizes if provided
  if (lotteryPrizes) {
    const existingPrizes = await prisma.lotteryPrize.findMany({
      where: { eventId },
    });
    const existingPrizeIds = existingPrizes.map((p) => p.id);
    const incomingPrizeIds = lotteryPrizes
      .filter((lp: { id?: string }) => lp.id)
      .map((lp: { id: string }) => lp.id);

    // Delete removed prizes (only if no results)
    const prizesToDelete = existingPrizeIds.filter((id) => !incomingPrizeIds.includes(id));
    for (const id of prizesToDelete) {
      const hasResults = await prisma.lotteryResult.count({ where: { prizeId: id } });
      if (hasResults === 0) {
        await prisma.lotteryPrize.delete({ where: { id } });
      }
    }

    // Upsert lottery prizes
    for (let i = 0; i < lotteryPrizes.length; i++) {
      const lp = lotteryPrizes[i];
      if (lp.id && existingPrizeIds.includes(lp.id)) {
        await prisma.lotteryPrize.update({
          where: { id: lp.id },
          data: {
            name: lp.name,
            stock: Number(lp.stock),
            requireRedeem: lp.requireRedeem ?? false,
            sortOrder: lp.sortOrder ?? i,
          },
        });
      } else {
        await prisma.lotteryPrize.create({
          data: {
            eventId,
            name: lp.name,
            stock: Number(lp.stock),
            requireRedeem: lp.requireRedeem ?? false,
            sortOrder: lp.sortOrder ?? i,
          },
        });
      }
    }
  }

  const updated = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      tags: { select: { id: true, name: true } },
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      lotteryPrizes: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({ event: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  await prisma.event.delete({ where: { id: eventId } });

  return NextResponse.json({ success: true });
}
