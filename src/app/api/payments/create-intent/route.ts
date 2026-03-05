import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, ticketTypeId } = await request.json();

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
    include: { event: true },
  });

  if (!ticketType || ticketType.event.id !== eventId || !ticketType.event.isPublished) {
    return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
  }

  const soldCount = await prisma.ticket.count({
    where: { ticketTypeId, payment: { status: "SUCCEEDED" } },
  });

  if (ticketType.capacity - soldCount <= 0) {
    return NextResponse.json({ error: "Sold out" }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      eventId: ticketType.event.id,
      ticketTypeId,
    },
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: ticketType.price,
    currency: "jpy",
    metadata: {
      ticketId: ticket.id,
      userId: user.id,
      eventId: ticketType.event.id,
      ticketTypeId,
    },
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      ticketId: ticket.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: ticketType.price,
      status: "PENDING",
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
