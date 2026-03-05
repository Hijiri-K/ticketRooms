import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { sendPushMessage } from "@/lib/line-messaging";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { ticketId, userId, eventId, ticketTypeId } = paymentIntent.metadata;

    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: "SUCCEEDED" },
    });

    // Send LINE notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const eventData = await prisma.event.findUnique({ where: { id: eventId } });
    const ticketType = ticketTypeId
      ? await prisma.ticketType.findUnique({ where: { id: ticketTypeId } })
      : null;

    if (user && eventData) {
      try {
        const typeName = ticketType ? `【${ticketType.name}】` : "";
        const price = ticketType?.price ?? paymentIntent.amount;
        await sendPushMessage(
          user.lineUserId,
          `チケットを購入しました！\n\n${eventData.title}\n${typeName}¥${price.toLocaleString()}\n\nマイチケットからQRコードを確認できます。`
        );
      } catch {
        // LINE notification failure should not break payment flow
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const { ticketId } = paymentIntent.metadata;

    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: "FAILED" },
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
