"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { useLiff } from "@/components/liff-provider";
import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const ticketTypeId = searchParams.get("ticketTypeId");
  const { accessToken } = useLiff();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [ticketTypeName, setTicketTypeName] = useState("");
  const [ticketTypePrice, setTicketTypePrice] = useState(0);

  useEffect(() => {
    if (!accessToken || !ticketTypeId) return;

    // Fetch event details
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setEventTitle(data.event.title);
          const tt = data.event.ticketTypes?.find(
            (t: { id: string }) => t.id === ticketTypeId
          );
          if (tt) {
            setTicketTypeName(tt.name);
            setTicketTypePrice(tt.price);
          }
        }
      });

    // Create payment intent
    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ eventId, ticketTypeId }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d));
        return res.json();
      })
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => setError(err.error ?? "エラーが発生しました"));
  }, [accessToken, eventId, ticketTypeId]);

  if (!ticketTypeId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-red-500">チケット種別が指定されていません</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">お支払い</h1>
        <p className="mb-1 text-sm text-gray-600">{eventTitle}</p>
        <p className="mb-1 text-xs text-gray-500">{ticketTypeName}</p>
        <p className="mb-6 text-lg font-bold text-gray-900">
          ¥{ticketTypePrice.toLocaleString()}
        </p>

        <Elements
          stripe={stripePromise}
          options={{ clientSecret, locale: "ja" }}
        >
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
}
