import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: user.id,
      payment: { status: "SUCCEEDED" },
    },
    include: { event: true, ticketType: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}
