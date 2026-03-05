import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [totalEvents, totalTickets, revenueResult, todayEvents, recentTickets] =
    await Promise.all([
      prisma.event.count(),
      prisma.ticket.count({
        where: { payment: { status: "SUCCEEDED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCEEDED" },
      }),
      prisma.event.count({
        where: { date: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.ticket.findMany({
        where: { payment: { status: "SUCCEEDED" } },
        include: {
          user: { select: { displayName: true } },
          event: { select: { title: true } },
          payment: { select: { amount: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return NextResponse.json({
    stats: {
      totalEvents,
      totalTickets,
      totalRevenue: revenueResult._sum.amount || 0,
      todayEvents,
    },
    recentTickets,
  });
}
